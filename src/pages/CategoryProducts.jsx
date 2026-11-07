import { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useProducts } from '../hooks/queries/useProducts';
import { useCategories } from '../hooks/queries/useCategories';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, ShoppingCart, Search, ChevronDown, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';
import SortDropdown from '../components/SortDropdown';
import PullToRefreshLayout from '../components/PullToRefreshLayout';
import { isStoreOpen, isProductScheduled } from '../utils/storeHelpers';
import { groupProducts } from '../utils/productGrouping';
import { API_BASE_URL } from '../utils/api';

const CategoryProducts = () => {
    const { categoryName } = useParams();
    const navigate = useNavigate();
    const { stores = [], globalSortOrder, setGlobalSortOrder } = useData();
    const { t, language } = useLanguage();
    const { cartCount } = useCart();
    const { user } = useAuth();

    const [activeCategory, setActiveCategory] = useState(decodeURIComponent(categoryName || ''));
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (categoryName) {
            setActiveCategory(decodeURIComponent(categoryName));
        }
    }, [categoryName]);

    // Fetch categories and products
    const { data: rawCategories = [], isLoading: loadingCategories } = useCategories();
    const { data: rawProducts = [], isLoading: loadingProducts } = useProducts();

    const categories = useMemo(() => {
        const list = Array.isArray(rawCategories) ? rawCategories : (rawCategories?.data || []);
        return list.filter(c => !c.isHidden);
    }, [rawCategories]);

    const allProducts = useMemo(() => {
        return Array.isArray(rawProducts) ? rawProducts : (rawProducts?.data || []);
    }, [rawProducts]);

    // Filter products by selected category
    const categoryProducts = useMemo(() => {
        const normalize = (str) => String(str || '').toLowerCase().replace(/\s+/g, ' ').trim();
        const activeNorm = normalize(activeCategory);

        return allProducts.filter(p => {
            if (p.isAvailable === false) return false;
            if (activeNorm && activeNorm !== 'all') {
                return normalize(p.category) === activeNorm;
            }
            return true;
        });
    }, [allProducts, activeCategory]);

    // Apply grouping (like homepage group cards)
    const groupedCategoryProducts = useMemo(() => {
        const grouped = groupProducts(categoryProducts, stores);
        
        let list = [...grouped];
        // Apply global sort order
        if (globalSortOrder !== 'none') {
            list.sort((a, b) => {
                const priceA = Number(a.price || 0);
                const priceB = Number(b.price || 0);
                return globalSortOrder === 'lowToHigh' ? priceA - priceB : priceB - priceA;
            });
        }
        return list;
    }, [categoryProducts, stores, globalSortOrder]);

    // Check if only one store in the category
    const storeCount = useMemo(() => {
        const storeIds = new Set(
            categoryProducts
                .map(p => String(p.storeId?._id || p.storeId || ''))
                .filter(Boolean)
        );
        return storeIds.size;
    }, [categoryProducts]);

    const isSingleStore = storeCount <= 1;

    // Multi-store sections (when more than 1 store)
    const storeSections = useMemo(() => {
        if (isSingleStore || groupedCategoryProducts.length === 0) return [];

        const storeMap = {};
        const generalProducts = [];

        groupedCategoryProducts.forEach(product => {
            const rawStoreId = product.storeId?._id || product.storeId;
            if (rawStoreId) {
                const sId = String(rawStoreId);
                if (!storeMap[sId]) {
                    const storeObj = stores.find(s => String(s._id || s.id) === sId) || product.storeId || { _id: sId, name: t('Store') };
                    storeMap[sId] = {
                        store: storeObj,
                        products: []
                    };
                }
                storeMap[sId].products.push(product);
            } else {
                generalProducts.push(product);
            }
        });

        const sections = Object.values(storeMap);
        sections.sort((a, b) => {
            const aOpen = isStoreOpen(a.store);
            const bOpen = isStoreOpen(b.store);
            if (aOpen && !bOpen) return -1;
            if (!aOpen && bOpen) return 1;
            return 0;
        });

        if (generalProducts.length > 0) {
            sections.push({
                store: {
                    _id: 'general',
                    name: activeCategory || t('All Products'),
                    isGeneral: true
                },
                products: generalProducts
            });
        }

        return sections;
    }, [groupedCategoryProducts, stores, isSingleStore, activeCategory, t]);

    // Auto-scroll selected category into view in the horizontal categories bar
    useEffect(() => {
        const activePill = document.getElementById('active-category-pill');
        if (activePill) {
            activePill.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }, [activeCategory]);

    // Header location display (matching HomeHeader exactly)
    const displayAddress = (() => {
        if (!user) return t('Select Location');
        if (user.address && (user.address.street || user.address.city || user.address.address)) {
            const parts = [];
            if (user.address.street) parts.push(user.address.street);
            if (user.address.city) parts.push(user.address.city);
            if (parts.length === 0 && user.address.address) {
                return user.address.address.length > 30 ? user.address.address.substring(0, 30) + '...' : user.address.address;
            }
            return parts.join(', ');
        }
        if (user.location && !user.location.startsWith('http')) return user.location;
        if (user.address?.street) return user.address.street;
        if (user.address?.city) return user.address.city;
        return t('Add Location');
    })();

    const isLoading = loadingCategories || loadingProducts;

    return (
        <PullToRefreshLayout>
            <div className="flex-1 min-h-[calc(100vh-4rem)] bg-[#E8EAEF] dark:bg-gray-900 pb-20 transition-colors duration-200 w-full relative">
                
                {/* Header: Location & Cart (Exact same size, icons, and text as Home page) */}
                <div className="fixed top-0 left-0 right-0 z-[100] w-full bg-[#CBF9B2] dark:bg-[#CBF9B2] rounded-b-[2.5rem] px-4 pt-3.5 pb-3.5 shadow-sm overflow-hidden">
                    {/* Background Accents (Subtle light accents like Home page) */}
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/30 dark:bg-[#CBF9B2]/20 rounded-full blur-3xl pointer-events-none"></div>

                    <div className="w-full px-4 relative flex items-center justify-center min-h-[38px]">
                        <div className="absolute left-2 top-1/2 -translate-y-1/2">
                            <button
                                onClick={() => navigate(-1)}
                                className="w-[38px] h-[38px] bg-white dark:bg-white/80 rounded-full flex items-center justify-center border border-black/5 dark:border-gray-200/50 shadow-sm transition-transform active:scale-95 flex-shrink-0 cursor-pointer"
                                aria-label="Go back"
                            >
                                <ArrowLeft size={19} className="text-gray-900 dark:text-gray-900" />
                            </button>
                        </div>
                        <div className="flex flex-col text-center">
                            <h1 className="text-[14.5px] font-bold text-gray-900 tracking-tight leading-tight">{t('Home')}</h1>
                            <p className="text-[10px] font-semibold text-gray-700 mt-0.5">{t('Explore products')}</p>
                        </div>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            <Link 
                                to="/cart"
                                className="w-[38px] h-[38px] bg-white dark:bg-white/80 rounded-full flex items-center justify-center border border-black/5 dark:border-gray-200/50 relative hover:bg-gray-50 dark:hover:bg-white/70 shadow-sm transition-all active:scale-95 flex-shrink-0"
                                aria-label="View cart"
                            >
                                <ShoppingCart size={19} className="text-[#2E5A2E] dark:text-[#2E5A2E]" />
                                {cartCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold h-[18px] w-[18px] rounded-full flex items-center justify-center shadow-sm border-2 border-white dark:border-gray-800">
                                        {cartCount}
                                    </span>
                                )}
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="pt-[88px]">
                {/* Search Bar & Sort Dropdown (Exact same as Home page design and search logic) */}
                <section className="px-4 relative z-30 mb-4 sm:mb-5">
                    <div className="flex items-center gap-2.5 sm:gap-3 max-w-2xl mx-auto relative">
                        <div className="relative group flex-1">
                            <form onSubmit={(e) => e.preventDefault()}>
                                <input
                                    type="text"
                                    placeholder={t('Search "grocery, fresh items..."')}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-11 sm:pl-12 pr-11 py-3.5 sm:py-4 text-[14.5px] sm:text-[15.5px] font-medium rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:outline-none ring-0 shadow-none transition-colors duration-200"
                                />
                                <Search className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 stroke-[2.2]" size={20} />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 active:scale-90 transition-all rounded-full cursor-pointer"
                                        title={t('Clear')}
                                    >
                                        <X size={18} className="stroke-[2.5]" />
                                    </button>
                                )}
                            </form>
                        </div>

                        {/* Sort Dropdown */}
                        <SortDropdown currentSort={globalSortOrder} onSortChange={setGlobalSortOrder} />

                        {/* Search Results Dropdown (Same as Home.jsx) */}
                        {searchQuery.trim() && (
                            <div className="absolute top-[calc(100%+12px)] left-0 right-0 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto z-[200] animate-in fade-in slide-in-from-top-2 duration-300 shadow-xl">
                                {(() => {
                                    const filteredDropdown = allProducts
                                        .filter(p => 
                                            p.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                            p.title_ta?.toLowerCase().includes(searchQuery.toLowerCase())
                                        )
                                        .sort((a, b) => {
                                            const aStore = stores.find(s => (s._id || s.id) === (a.storeId?._id || a.storeId));
                                            const bStore = stores.find(s => (s._id || s.id) === (b.storeId?._id || b.storeId));
                                            
                                            const checkOpen = (p, s) => {
                                                if (p.isAvailable === false) return false;
                                                if (!isStoreOpen(s)) return false;
                                                return isProductScheduled(p);
                                            };

                                            const aOpen = checkOpen(a, aStore);
                                            const bOpen = checkOpen(b, bStore);
                                            
                                            if (aOpen && !bOpen) return -1;
                                            if (!aOpen && bOpen) return 1;
                                            
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
                                                    <div className={`w-12 h-12 rounded-lg bg-gray-50 dark:bg-gray-700 p-1 flex items-center justify-center overflow-hidden border border-gray-100 dark:border-gray-600 ${isClosed ? 'blur-[1px] grayscale' : ''}`}>
                                                        <img
                                                            src={product.image || `${API_BASE_URL}/products/${productId}/image`}
                                                            onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/100x100?text=No+Image'; }}
                                                            alt={product.title}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                    {isClosed && (
                                                        <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-lg">
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

                {/* Related Products:
                    - If only ONE store in category: 2 cards per row with slightly bigger quantity controls!
                    - If multiple stores: Homepage side-scrollable store sections!
                */}
                <div className="px-3 sm:px-4 max-w-7xl mx-auto mt-2">
                    {isLoading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 px-1">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-2.5 shadow-xs border border-gray-100 dark:border-gray-700 space-y-2">
                                    <div className="aspect-square w-full rounded-xl blinkit-shimmer"></div>
                                    <div className="h-3.5 rounded-md w-full blinkit-shimmer"></div>
                                    <div className="h-3 rounded-md w-2/3 blinkit-shimmer"></div>
                                    <div className="flex items-center justify-between pt-1">
                                        <div className="h-4 w-12 rounded-md blinkit-shimmer"></div>
                                        <div className="h-8 w-8 rounded-full blinkit-shimmer"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : isSingleStore ? (
                        /* Only ONE store in the category: Show as 2 cards per row with bigger quantity controls */
                        groupedCategoryProducts.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 px-1">
                                {groupedCategoryProducts.map((product) => (
                                    <div key={product._id || product.id} className="animate-in fade-in duration-300">
                                        <ProductCard 
                                            product={product}
                                            showCartControls={true}
                                            largeControls={true}
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 flex flex-col items-center justify-center gap-3">
                                <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-xs text-gray-400">
                                    <Search size={28} />
                                </div>
                                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                                    {t('No products found in this category')}
                                </p>
                            </div>
                        )
                    ) : (
                        /* Multiple stores: Show Homepage side-scrollable store sections */
                        storeSections.length > 0 ? (
                            <div className="space-y-4">
                                {storeSections.map((section) => {
                                    const storeId = section.store?._id || section.store?.id;
                                    const isStoreSection = !section.store?.isGeneral && storeId !== 'general';
                                    const isOpen = isStoreSection ? isStoreOpen(section.store) : true;

                                    return (
                                        <section key={storeId} className="pt-1 pb-2">
                                            {/* Store Section Header */}
                                            <div className="flex justify-between items-end mb-2.5 px-2">
                                                <div className="flex flex-col min-w-0 flex-1 pr-2">
                                                    <h3 className="text-[15px] sm:text-[17px] font-bold text-gray-900 dark:text-white truncate">
                                                        {t(section.store?.name || section.store)}
                                                    </h3>
                                                    {section.store?.address && (
                                                        <p className="text-[10.5px] text-gray-500 dark:text-gray-400 truncate">
                                                            {section.store.address}
                                                        </p>
                                                    )}
                                                </div>

                                                {isStoreSection && isOpen && (
                                                    <Link 
                                                        to={`/store/${storeId}`} 
                                                        className="text-xs font-semibold text-[#2E5A2E] dark:text-[#CBF9B2] hover:opacity-75 transition-opacity shrink-0"
                                                    >
                                                        {t('See All')}
                                                    </Link>
                                                )}
                                            </div>

                                            {/* Horizontal Side-Scrollable Product Cards (Homepage Style) */}
                                            <div className="flex overflow-x-auto scrollbar-hide gap-2.5 sm:gap-3 md:gap-4 pb-2 px-1">
                                                <div className="flex gap-2.5 sm:gap-3 md:gap-4">
                                                    {section.products.map((product) => (
                                                        <div 
                                                            key={product._id || product.id}
                                                            className="w-[142px] sm:w-[155px] md:w-[175px] shrink-0 animate-in fade-in duration-300"
                                                        >
                                                            <ProductCard 
                                                                product={product}
                                                                showCartControls={true}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </section>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-20 flex flex-col items-center justify-center gap-3">
                                <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-xs text-gray-400">
                                    <Search size={28} />
                                </div>
                                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                                    {t('No products found in this category')}
                                </p>
                            </div>
                        )
                    )}
                </div>
                </div>

            </div>
        </PullToRefreshLayout>
    );
};

export default CategoryProducts;
