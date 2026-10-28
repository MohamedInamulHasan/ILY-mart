import { useState, useMemo, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Search, ListFilter } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useProducts } from '../hooks/queries/useProducts';
import { useAds, adKeys } from '../hooks/queries/useAds';
import { useCategories } from '../hooks/queries/useCategories';
import { useStores } from '../hooks/queries/useStores';
import { useLanguage } from '../context/LanguageContext';
import { useSocket } from '../context/SocketContext';
import { useData } from '../context/DataContext';
import { isStoreOpen, isProductScheduled } from '../utils/storeHelpers';
import HomeHeader from '../components/home/HomeHeader';
import HeroBanner from '../components/home/HeroBanner';
import CategorySection from '../components/home/CategorySection';
import StoreSection from '../components/home/StoreSection';
import SortDropdown from '../components/SortDropdown';
import PullToRefreshLayout from '../components/PullToRefreshLayout';
import { useCart } from '../context/CartContext';

const Home = () => {
    const { cartItems, deliveryCharge } = useCart();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const { globalSortOrder, setGlobalSortOrder } = useData();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { socket } = useSocket();
    const queryClient = useQueryClient();

    // Real-time Ad Updates
    useEffect(() => {
        if (!socket) return;

        const handleAdsUpdated = () => {
            console.log('⚡ Real-time ads update received!');
            queryClient.invalidateQueries({ queryKey: adKeys.all });
        };

        socket.on('ads:updated', handleAdsUpdated);

        return () => {
            socket.off('ads:updated', handleAdsUpdated);
        };
    }, [socket, queryClient]);

    // Data Fetching
    const { data: rawProducts = [], isLoading: loadingProducts } = useProducts();
    const { data: ads = [], isLoading: loadingAds } = useAds();
    const { data: rawCategories = [], isLoading: loadingCategories } = useCategories();
    const { data: rawStores = [], isLoading: loadingStores } = useStores();

    const products = useMemo(() => {
        const allProducts = Array.isArray(rawProducts) ? rawProducts : (rawProducts?.data || []);
        if (!selectedCategory || selectedCategory === 'All') return allProducts;
        
        // Robust normalization for comparison
        const normalize = (str) => String(str || '').toLowerCase().replace(/\s+/g, ' ').trim();
        const normalizedSelected = normalize(selectedCategory);
        
        return allProducts.filter(p => normalize(p.category) === normalizedSelected);
    }, [rawProducts, selectedCategory]);

    const stores = useMemo(() => {
        const list = Array.isArray(rawStores) ? rawStores : (rawStores?.data || []);
        return list.filter(s => s.isActive !== false);
    }, [rawStores]);

    // Filter categories — only show categories that have at least one product
    const featuredCategories = useMemo(() => {
        const raw = Array.isArray(rawCategories) ? rawCategories : (rawCategories?.data || []);
        const allProducts = Array.isArray(rawProducts) ? rawProducts : (rawProducts?.data || []);

        // Get a Set of categories that have at least one product
        const productCategories = new Set(allProducts.map(p => p.category?.toLowerCase()));

        return raw.filter(cat => {
            if (cat.isHidden) return false;
            // Only show category if it has products
            return productCategories.has(cat.name?.toLowerCase());
        });
    }, [rawCategories, rawProducts]);


    // Grouping Logic (show all available products - timed-out ones show overlay, manually disabled are hidden)
    const groupedByStore = useMemo(() => {
        const availableProducts = products.filter(p => {
            if (p.isAvailable === false) return false; // Manually disabled -> hide completely
            return true; // Timed products still show with an availability overlay
        });

        return availableProducts.reduce((acc, product) => {
            const storeId = product.storeId?._id || product.storeId;
            const key = storeId || `category_${product.category || 'Other'}`;
            if (!acc[key]) acc[key] = [];
            acc[key].push(product);
            return acc;
        }, {});
    }, [products]);

    // Extract Free Products for special section
    const freeProducts = useMemo(() => {
        return products.filter(p => 
            p.isGold === true && 
            p.isAvailable !== false
        );
    }, [products]);

    // Create sections list
    const displaySections = useMemo(() => {
        const sections = [];

        // 0. Add Free Delivery section if products exist
        if (freeProducts.length > 0) {
            sections.push({
                id: 'free_delivery',
                name: 'Free Delivery',
                slogan: 'Zero delivery charges on these selected items',
                type: 'special',
                data: {}
            });
        }

        // 1. Add real stores
        stores.forEach(s => {
            const storeId = s._id || s.id;
            const storeProducts = groupedByStore[storeId] || [];
            
            // Filter by selected category if not 'All'
            const matchesCategory = selectedCategory === 'All' || 
                                    storeProducts.some(p => p.category === selectedCategory);

            if (storeProducts.length > 0 && matchesCategory) {
                sections.push({
                    id: storeId,
                    name: s.name,
                    address: s.address,
                    type: 'store',
                    data: s
                });
            }
        });

        // 2. Add orphan category sections (only if 'All' or matching)
        Object.entries(groupedByStore).forEach(([key, products]) => {
            if (key.startsWith('category_')) {
                const categoryName = key.replace('category_', '');
                if (selectedCategory === 'All' || categoryName === selectedCategory) {
                    sections.push({
                        id: key,
                        name: categoryName,
                        type: 'category',
                        data: { name: categoryName }
                    });
                }
            }
        });

        // Sort by Type then Status
        return sections.sort((a, b) => {
            // 1. Keep Free Delivery at the very top
            if (a.id === 'free_delivery') return -1;
            if (b.id === 'free_delivery') return 1;

            // 2. Prioritize Category Sections over Store Sections
            if (a.type === 'category' && b.type === 'store') return -1;
            if (a.type === 'store' && b.type === 'category') return 1;

            // 3. For Category Sections, sort based on featuredCategories order
            if (a.type === 'category' && b.type === 'category') {
                const aIndex = featuredCategories.findIndex(cat => cat.name === a.name);
                const bIndex = featuredCategories.findIndex(cat => cat.name === b.name);
                // If found, sort by index. If not found (e.g. "Other"), put at the end.
                const aPos = aIndex === -1 ? 999 : aIndex;
                const bPos = bIndex === -1 ? 999 : bIndex;
                return aPos - bPos;
            }

            // 4. For Store Sections, sort by Status (Open first)
            if (a.type === 'store' && b.type === 'store') {
                const aOpen = isStoreOpen(a.data);
                const bOpen = isStoreOpen(b.data);
                if (aOpen && !bOpen) return -1;
                if (!aOpen && bOpen) return 1;
            }

            return 0;
        });
    }, [stores, groupedByStore, selectedCategory, freeProducts, featuredCategories]);

    const isLoadingAll = loadingProducts || loadingStores || loadingCategories;

    return (
        <div className="min-h-screen bg-[#E8EAEF] dark:bg-gray-900 pb-8 transition-colors duration-200">
            
            {/* Premium Light Green Header Card / Dark Mode Adjusted */}
            <div className="fixed top-0 left-0 right-0 z-[100] w-full bg-[#CBF9B2] dark:bg-[#CBF9B2] rounded-b-[2.5rem] px-2 pt-2 pb-3 overflow-hidden">
                {/* Background Accents (Subtle light accents) */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/30 dark:bg-[#2E5A2E]/20 rounded-full blur-3xl pointer-events-none"></div>
                
                <div className="relative z-10">
                    <HomeHeader />
                </div>
            </div>



            <PullToRefreshLayout>
                <div className="pt-[95px]">
                {/* Search Bar (Now Below the Design with Filter) */}
                <section className="px-4 relative z-50 mb-8">
                    <div className="flex items-center gap-3 max-w-2xl mx-auto relative">
                        <div className="relative group flex-1">
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    if (searchQuery.trim()) {
                                        navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
                                    }
                                }}
                            >
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={t('Search by fresh groceries...')}
                                    className="w-full pl-12 pr-4 py-4 rounded-full border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none transition-all duration-300 shadow-sm"
                                />
                                <Search 
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#2E5A2E] dark:group-focus-within:text-[#CBF9B2] transition-colors" 
                                    size={20} 
                                />
                            </form>
                        </div>
                        
                        {/* Sort Dropdown */}
                        <SortDropdown currentSort={globalSortOrder} onSortChange={setGlobalSortOrder} />

                        {/* Search Results Dropdown (Matching CategoryProducts design) */}
                        {searchQuery.trim() && (
                            <div className="absolute top-[calc(100%+12px)] left-0 right-0 bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 max-h-96 overflow-y-auto z-[200] animate-in fade-in slide-in-from-top-2 duration-300 shadow-sm">
                                {(() => {
                                    const filteredDropdown = products
                                        .filter(p => 
                                            p.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                            p.title_ta?.toLowerCase().includes(searchQuery.toLowerCase())
                                        )
                                        .sort((a, b) => {
                                            const aStore = stores.find(s => (s._id || s.id) === (a.storeId?._id || a.storeId));
                                            const bStore = stores.find(s => (s._id || s.id) === (b.storeId?._id || b.storeId));
                                            
                                            // Check product-specific availability + store status
                                            const checkOpen = (p, s) => {
                                                if (p.isAvailable === false) return false;
                                                if (!isStoreOpen(s)) return false;
                                                return isProductScheduled(p);
                                            };

                                            const aOpen = checkOpen(a, aStore);
                                            const bOpen = checkOpen(b, bStore);
                                            
                                            // 1. Available products first
                                            if (aOpen && !bOpen) return -1;
                                            if (!aOpen && bOpen) return 1;
                                            
                                            // 2. Starts with query prioritization
                                            const aTitle = a.title?.toLowerCase() || '';
                                            const bTitle = b.title?.toLowerCase() || '';
                                            const query = searchQuery.toLowerCase();
                                            
                                            const aStarts = aTitle.startsWith(query);
                                            const bStarts = bTitle.startsWith(query);
                                            
                                            if (aStarts && !bStarts) return -1;
                                            if (!aStarts && bStarts) return 1;
                                            return 0;
                                        })
                                        .slice(0, 10);

                                    if (filteredDropdown.length === 0) {
                                        return (
                                            <div className="p-8 text-center text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap overflow-hidden">
                                                {t('No products found')}
                                            </div>
                                        );
                                    }

                                    return filteredDropdown.map((product) => {
                                        const productId = product._id || product.id;
                                        const productStore = stores.find(s => (s._id || s.id) === (product.storeId?._id || product.storeId));
                                        
                                        const checkOpen = (p, s) => {
                                            if (p.isAvailable === false) return false;
                                            if (!isStoreOpen(s)) return false;
                                            return isProductScheduled(p);
                                        };

                                        const productOpen = checkOpen(product, productStore);
                                        const isClosed = !productOpen;
                                        const title = t(product, 'title');

                                        return (
                                            <Link
                                                key={productId}
                                                to={isClosed ? '#' : `/product/${productId}`}
                                                onClick={(e) => {
                                                    if (isClosed) {
                                                        e.preventDefault();
                                                        return;
                                                    }
                                                    setSearchQuery('');
                                                }}
                                                className={`flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50/80 dark:hover:bg-gray-700/50 transition-colors ${isClosed ? 'cursor-not-allowed opacity-80' : ''}`}
                                            >
                                                <div className="relative flex-shrink-0">
                                                    <div className={`w-12 h-12 rounded-[1rem] bg-gray-50 dark:bg-gray-700 p-1 flex items-center justify-center overflow-hidden border border-gray-100 dark:border-gray-600 ${isClosed ? 'blur-[1px] grayscale' : ''}`}>
                                                        <img
                                                            src={product.image || `${API_BASE_URL}/products/${productId}/image`}
                                                            onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/100x100?text=No+Image'; }}
                                                            alt={product.title}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                    {isClosed && (
                                                        <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-[1rem]">
                                                            <span className="bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-tighter">
                                                                {t('Closed')}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {product.unit && !isClosed && (
                                                        <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg px-2 py-0.5">
                                                            <p className="text-gray-500 dark:text-gray-400 text-[9px] font-bold">
                                                                {product.unit}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-col gap-0">
                                                        <p className={`font-normal text-gray-800 dark:text-gray-200 truncate text-[13px] tracking-tight leading-tight ${isClosed ? 'opacity-60' : ''}`}>
                                                            {title}
                                                        </p>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className={`text-[#2E5A2E] dark:text-[#CBF9B2] font-medium text-[11px] ${isClosed ? 'grayscale opacity-50' : ''}`}>₹{Number(product.price).toFixed(0)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Link>
                                        );
                                    });
                                })()}
                            </div>
                        )}
                    </div>
                </section>

                {/* Ads */}
                <HeroBanner slides={ads} isLoading={loadingAds} />

                {/* Categories */}
                <CategorySection 
                    categories={featuredCategories} 
                    isLoading={loadingCategories} 
                    selectedCategory={selectedCategory}
                    onSelectCategory={setSelectedCategory}
                />

                {/* Store Sections Loading Skeleton */}
                {isLoadingAll ? (
                    <div className="space-y-4 py-2">
                        {[1, 2].map((sectionIndex) => (
                            <section key={sectionIndex} className="px-4 py-3">
                                {/* Section Header — shop name + See All */}
                                <div className="flex justify-between items-end mb-4 px-1">
                                    <div className="flex flex-col gap-2 flex-1">
                                        <div className="h-6 w-48 rounded-xl blinkit-shimmer"></div>
                                        <div className="h-3 w-32 rounded-lg blinkit-shimmer"></div>
                                    </div>
                                    <div className="h-5 w-14 rounded-full blinkit-shimmer"></div>
                                </div>

                                {/* Horizontal Product Cards — Blinkit shimmer style */}
                                <div className="flex gap-3 overflow-hidden pb-2 px-1">
                                    {[1, 2, 3, 4].map((cardIndex) => (
                                        <div
                                            key={cardIndex}
                                            className="w-[160px] md:w-[185px] shrink-0 bg-white dark:bg-gray-800 rounded-3xl p-3 shadow-sm border border-gray-100 dark:border-gray-700/50 flex flex-col space-y-3"
                                        >
                                            {/* Product Image placeholder */}
                                            <div className="aspect-square w-full rounded-2xl blinkit-shimmer"></div>
                                            {/* Product Title */}
                                            <div className="space-y-2">
                                                <div className="h-3.5 rounded-lg w-full blinkit-shimmer"></div>
                                                <div className="h-3 rounded-md w-2/3 blinkit-shimmer"></div>
                                            </div>
                                            {/* Price + Add button */}
                                            <div className="flex items-center justify-between pt-1">
                                                <div className="h-5 w-14 rounded-md blinkit-shimmer"></div>
                                                <div className="h-9 w-9 rounded-full blinkit-shimmer"></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                ) : displaySections.length > 0 ? (
                    <div className="space-y-2 md:space-y-4">
                        {displaySections.map((section) => (
                            <StoreSection 
                                key={section.id} 
                                section={section} 
                                products={section.id === 'free_delivery' ? freeProducts : groupedByStore[section.id] || []}
                                selectedCategory={selectedCategory}
                                singleStore={displaySections.length === 1}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        {t('No products found')}
                    </div>
                )}

                </div>
            </PullToRefreshLayout>
        </div>
    );
};

export default Home;
