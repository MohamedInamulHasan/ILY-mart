import { useState, useMemo, useEffect, useRef, useCallback, useTransition } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Search, ListFilter, X } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useProducts } from '../hooks/queries/useProducts';
import { useAds, adKeys } from '../hooks/queries/useAds';
import { useCategories } from '../hooks/queries/useCategories';
import { useStores } from '../hooks/queries/useStores';
import { useMainCategories } from '../hooks/queries/useMainCategories';
import { getCleanCategoryName } from '../utils/categoryHelpers';
import { API_BASE_URL } from '../utils/api';
import { useLanguage } from '../context/LanguageContext';
import { useSocket } from '../context/SocketContext';
import { useData } from '../context/DataContext';
import { isStoreOpen, isProductScheduled, isProductFromActiveStore } from '../utils/storeHelpers';
import HomeHeader from '../components/home/HomeHeader';
import HeroBanner from '../components/home/HeroBanner';
import PullToRefreshLayout from '../components/PullToRefreshLayout';
import { useCart } from '../context/CartContext';
import useTypewriterPlaceholder, { cleanSearchTitle } from '../hooks/useTypewriterPlaceholder';
import ProductCard from '../components/ProductCard';
import { groupProducts } from '../utils/productGrouping';

const Home = () => {
    const { cartItems, deliveryCharge } = useCart();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [, startTransition] = useTransition();

    const handleSelectCategory = useCallback((catName) => {
        startTransition(() => {
            setSelectedCategory(catName);
        });
    }, []);
    const { globalSortOrder, setGlobalSortOrder, setIsFooterHidden } = useData();
    const navigate = useNavigate();
    const { t, language } = useLanguage();
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
    const { data: mainCategories = [], isLoading: loadingMainCats } = useMainCategories();

    // Admin Categories visible on Home (active / non-hidden)
    const homeCategories = useMemo(() => {
        const list = Array.isArray(rawCategories) ? rawCategories : (rawCategories?.data || []);
        return list.filter(c => c.isActive !== false && !c.isHidden && !c.isHomeHidden);
    }, [rawCategories]);

    // Zepto-style typewriter animated placeholder (cycles through Admin Categories)
    const searchWords = useMemo(() => {
        const catList = homeCategories;
        const titles = catList.map(c => {
            const raw = (language === 'ta' && c.name_ta) ? c.name_ta : (c.name || '');
            return cleanSearchTitle(raw, language);
        }).filter(w => w && w.length > 1);

        const fallbackEn = ['Groceries & Kitchen', 'Fresh Fruits & Vegetables', 'Meat & Fish', 'Bakery & Snacks', 'Dairy & Eggs'];
        const fallbackTa = ['மளிகை பொருட்கள்', 'பழங்கள் & காய்கறிகள்', 'இறைச்சி & மீன்', 'தின்பண்டங்கள்', 'பால் & முட்டை'];
        const fallbacks = language === 'ta' ? fallbackTa : fallbackEn;

        const combined = titles.length > 0 ? titles : fallbacks;
        return Array.from(new Set(combined));
    }, [homeCategories, language]);

    const searchPlaceholder = useTypewriterPlaceholder(
        searchWords,
        language === 'ta' ? 'தேடுக' : 'Search'
    );

    // Show all active ads on the home page (both general platform and store-specific ads)
    const homeAds = useMemo(() => {
        if (!Array.isArray(ads) || ads.length === 0) return [];
        return ads.filter(ad => ad.isActive !== false);
    }, [ads]);

    // Remember if home has ads across sessions to avoid flashing skeleton banner when there are no banners
    const hasCachedHomeAds = useMemo(() => {
        try {
            return localStorage.getItem('has_home_ads') === 'true';
        } catch {
            return false;
        }
    }, []);

    useEffect(() => {
        if (!loadingAds) {
            try {
                localStorage.setItem('has_home_ads', homeAds.length > 0 ? 'true' : 'false');
            } catch {}
        }
    }, [loadingAds, homeAds.length]);

    const handleCategoryClick = (category) => {
        if (!category) return;
        const catName = typeof category === 'string' ? category : (category.name || '');
        if (!catName) return;
        navigate(`/category/${encodeURIComponent(catName)}`);
    };

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

    // Filter categories by products (as before), stably rendered once data is ready
    const featuredCategories = useMemo(() => {
        const raw = Array.isArray(rawCategories) ? rawCategories : (rawCategories?.data || []);
        const allProducts = Array.isArray(rawProducts) ? rawProducts : (rawProducts?.data || []);

        if (raw.length === 0) return [];
        // Show categories from cached data immediately, even if still fetching fresh data
        if (allProducts.length === 0) return [];

        const productCategories = new Set(allProducts.map(p => p.category?.toLowerCase()));
        return raw.filter(cat => !cat.isHidden && productCategories.has(cat.name?.toLowerCase()));
    }, [rawCategories, rawProducts]);


    // Active products for Home store sections (non-disabled & from active stores)
    const activeProducts = useMemo(() => {
        const allProducts = Array.isArray(rawProducts) ? rawProducts : (rawProducts?.data || []);
        return allProducts.filter(p => {
            if (p.isAvailable === false) return false;
            return isProductFromActiveStore(p, stores);
        });
    }, [rawProducts, stores]);

    // Apply product grouping (variants) & sorting like CategoryProducts
    const groupedHomeProducts = useMemo(() => {
        const grouped = groupProducts(activeProducts, stores);
        let list = [...grouped];
        if (globalSortOrder && globalSortOrder !== 'none') {
            list.sort((a, b) => {
                const priceA = Number(a.price || 0);
                const priceB = Number(b.price || 0);
                return globalSortOrder === 'lowToHigh' ? priceA - priceB : priceB - priceA;
            });
        }
        return list;
    }, [activeProducts, stores, globalSortOrder]);

    // Multi-store sections (all stores list matching CategoryProducts page)
    const storeSections = useMemo(() => {
        if (!stores || stores.length === 0 || groupedHomeProducts.length === 0) return [];

        const storeMap = {};
        const generalProducts = [];

        groupedHomeProducts.forEach(product => {
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

            // Preserve store order from admin panel / database
            const aIndex = stores.findIndex(s => String(s._id || s.id) === String(a.store?._id || a.store?.id));
            const bIndex = stores.findIndex(s => String(s._id || s.id) === String(b.store?._id || b.store?.id));
            const aPos = aIndex === -1 ? 999 : aIndex;
            const bPos = bIndex === -1 ? 999 : bIndex;
            return aPos - bPos;
        });

        if (generalProducts.length > 0) {
            sections.push({
                store: {
                    _id: 'general',
                    name: t('All Products'),
                    isGeneral: true
                },
                products: generalProducts
            });
        }

        return sections;
    }, [groupedHomeProducts, stores, t]);

    // Only show skeleton when there is NO data at all (not even cached)
    const hasAnyProducts = (Array.isArray(rawProducts) ? rawProducts : (rawProducts?.data || [])).length > 0;
    const hasAnyStores = (Array.isArray(rawStores) ? rawStores : (rawStores?.data || [])).length > 0;
    const isLoadingAll = (loadingProducts && !hasAnyProducts) || (loadingStores && !hasAnyStores);

    return (
        <div className="flex-1 min-h-[calc(100vh-8rem)] md:min-h-0 bg-[#E8EAEF] dark:bg-gray-900 pb-8 transition-colors duration-200">
            
            {/* Premium Light Green Header Card / Dark Mode Adjusted */}
            <div className="fixed top-0 left-0 right-0 z-[100] w-full bg-[#CBF9B2] dark:bg-[#CBF9B2] rounded-b-[2.5rem] px-4 pt-3.5 pb-3.5 shadow-sm overflow-hidden">
                {/* Background Accents (Subtle light accents) */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/30 dark:bg-[#CBF9B2]/20 rounded-full blur-3xl pointer-events-none"></div>
                
                <div className="relative z-10">
                    <HomeHeader />
                </div>
            </div>



            <div>
                <div className="pt-[88px]">
                {/* Search Bar (Now Below the Design with Filter) */}
                <section className="px-4 relative z-30 mb-4 sm:mb-5">
                    <div className="flex items-center gap-2.5 sm:gap-3 max-w-2xl mx-auto relative">
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
                                    placeholder={searchPlaceholder}
                                    className="w-full pl-11 sm:pl-12 pr-11 py-3.5 sm:py-4 text-[14.5px] sm:text-[15.5px] font-medium rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:outline-none focus-visible:outline-none ring-0 focus:ring-0 focus-visible:ring-0 shadow-none transition-colors duration-200"
                                />
                                <Search className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#2E5A2E] dark:group-focus-within:text-[#CBF9B2] stroke-[2.2] transition-colors" size={20} />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-3 sm:right-3.5 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 active:scale-90 transition-all rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center cursor-pointer"
                                        title={t('Clear')}
                                    >
                                        <X size={18} className="stroke-[2.5]" />
                                    </button>
                                )}
                            </form>
                        </div>
                        
                        
                        {/* Search Results Dropdown (Matching CategoryProducts design) */}
                        {searchQuery.trim() && (
                            <div className="absolute top-[calc(100%+12px)] left-0 right-0 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto z-[200] animate-in fade-in slide-in-from-top-2 duration-300 shadow-xl">
                                {(() => {
                                    const filteredDropdown = products
                                        .filter(p => {
                                            if (!isProductFromActiveStore(p, (Array.isArray(rawStores) && rawStores.length > 0) ? rawStores : stores)) {
                                                return false;
                                            }
                                            return (
                                                p.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                                p.title_ta?.toLowerCase().includes(searchQuery.toLowerCase())
                                            );
                                        })
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
                                        const storeName = productStore ? (t(productStore, 'name') || productStore.name) : (product.storeId?.name || product.storeName || '');

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
                                                    <div className="flex flex-col gap-0.5">
                                                        <p className={`font-normal text-gray-800 dark:text-gray-200 truncate text-[13px] tracking-tight leading-tight ${isClosed ? 'opacity-60' : ''}`}>
                                                            {title}
                                                        </p>
                                                        {storeName && (
                                                            <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate leading-tight font-normal">
                                                                {storeName}
                                                            </p>
                                                        )}
                                                        <div className="flex items-center gap-1.5 mt-0.5">
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
                <HeroBanner slides={homeAds} isLoading={loadingAds && (hasCachedHomeAds || homeAds.length > 0)} />

                {/* Main Categories Section with Reconstructed Skeleton */}
                <section className="pt-2 pb-3.5 mt-1 sm:mt-1.5 px-3 sm:px-4 mb-4">
                    <div className="flex justify-between items-center mb-3 px-1">
                        <h2 className="text-[20px] sm:text-[22px] font-black text-gray-900 dark:text-white tracking-tight">
                            {t('Shop By Categories')}
                        </h2>
                    </div>
                    {loadingCategories && homeCategories.length === 0 ? (
                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="flex flex-col rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 pb-1 sm:pb-1.5 bg-white dark:bg-gray-800 shadow-sm">
                                    <div className="w-full aspect-[16/9] blinkit-shimmer" />
                                    <div className="pt-1 pb-1 px-2 flex justify-center">
                                        <div className="h-3.5 w-24 rounded-md blinkit-shimmer" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : homeCategories.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                            {homeCategories.map((category) => {
                                const cleanName = getCleanCategoryName(category, language);
                                const imageSrc = category.image || (category._id ? `${API_BASE_URL}/categories/${category._id}/image` : '');
                                return (
                                    <div 
                                        key={category._id || category.id || category.name}
                                        onClick={() => handleCategoryClick(category)}
                                        className="flex flex-col cursor-pointer group select-none active:scale-[0.98] transition-transform rounded-2xl overflow-hidden shadow-sm border border-[#2E5A2E]/15 dark:border-gray-700/80 bg-gradient-to-b from-white via-[#F7FCF5] to-[#E3F9DC] dark:from-gray-800 dark:via-gray-800 dark:to-[#2E5A2E]/25 pb-1 sm:pb-1.5"
                                    >
                                        {/* 16:9 Rectangular Card (Edge-to-Edge Image with scaled graphics to eliminate dead space) */}
                                        <div className="w-full aspect-[16/9] overflow-hidden relative flex items-center justify-center">
                                            <img 
                                                src={imageSrc} 
                                                alt={cleanName} 
                                                className="w-full h-full object-contain pointer-events-none select-none"
                                                loading="lazy"
                                                decoding="async"
                                                draggable={false}
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = 'https://placehold.co/800x450?text=' + encodeURIComponent(cleanName);
                                                }}
                                            />
                                        </div>
                                        {/* Main Category Name Inside Card with tight padding, removing large gap */}
                                        <div className="pt-0.5 pb-1 px-1.5 flex items-center justify-center">
                                            <span className="text-[12px] sm:text-[13px] font-bold text-gray-900 dark:text-gray-100 text-center line-clamp-2 leading-tight w-full pointer-events-none select-none">
                                                {cleanName}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : null}
                </section>

                {/* Store Products Section (all stores list like in Category Products page) */}
                <div className="px-3 sm:px-4 max-w-7xl mx-auto space-y-4 mb-6">
                    {loadingProducts && !hasAnyProducts ? (
                        <div className="space-y-6">
                            {[1, 2].map((s) => (
                                <div key={s} className="space-y-3">
                                    <div className="flex justify-between items-center px-1">
                                        <div className="h-4 w-36 sm:w-44 rounded-md blinkit-shimmer" />
                                        <div className="h-3 w-14 rounded-md blinkit-shimmer" />
                                    </div>
                                    <div className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide py-1">
                                        {[1, 2, 3, 4].map((i) => (
                                            <div key={i} className="w-[155px] sm:w-[170px] flex-shrink-0 bg-white dark:bg-gray-800 rounded-2xl p-2.5 shadow-xs border border-gray-100 dark:border-gray-700 space-y-2">
                                                <div className="aspect-square w-full rounded-xl blinkit-shimmer"></div>
                                                <div className="h-3.5 rounded-md w-full blinkit-shimmer"></div>
                                                <div className="h-3 rounded-md w-2/3 blinkit-shimmer"></div>
                                                <div className="flex items-center justify-between pt-1">
                                                    <div className="h-5 w-12 rounded-md blinkit-shimmer"></div>
                                                    <div className="h-7 w-7 rounded-lg blinkit-shimmer"></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : storeSections.length > 0 ? (
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
                                                {(section.store?.address || section.store?.location) && (
                                                    <p className="text-[10.5px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                                        {section.store.address || section.store.location}
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
                                                            stores={stores}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </section>
                                );
                            })}
                        </div>
                    ) : null}
                </div>

                </div>
            </div>
        </div>
    );
};

export default Home;
