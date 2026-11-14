import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useProducts } from '../hooks/queries/useProducts';
import { useCategories } from '../hooks/queries/useCategories';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Search, ChevronDown, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { safeNavigateBack } from '../utils/useBackButton';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';
import SortDropdown from '../components/SortDropdown';
import PullToRefreshLayout from '../components/PullToRefreshLayout';
import CartHeaderButton from '../components/CartHeaderButton';
import useTypewriterPlaceholder, { cleanSearchTitle } from '../hooks/useTypewriterPlaceholder';
import { isStoreOpen, isProductScheduled } from '../utils/storeHelpers';
import { getCleanCategoryName, areCategoriesMatching, areSubcategoriesMatching, safeDecodeURIComponent } from '../utils/categoryHelpers';
import { groupProducts } from '../utils/productGrouping';
import { API_BASE_URL } from '../utils/api';

const CategoryProducts = () => {
    const { categoryName } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { stores = [], globalSortOrder, setGlobalSortOrder } = useData();
    const { t, language } = useLanguage();
    const { user } = useAuth();

    const decodedCategoryName = useMemo(() => safeDecodeURIComponent(categoryName || ''), [categoryName]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isInitialMount, setIsInitialMount] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setIsInitialMount(false), 300);
        return () => clearTimeout(timer);
    }, []);

    // Fetch categories and products
    const { data: rawCategories = [], isLoading: loadingCategories } = useCategories();
    const { data: rawProducts = [], isLoading: loadingProducts } = useProducts();

    // Find current category object in admin categories list
    const currentCategory = useMemo(() => {
        const list = Array.isArray(rawCategories) ? rawCategories : (rawCategories?.data || []);
        return list.find(c => areCategoriesMatching(c, decodedCategoryName)) || null;
    }, [rawCategories, decodedCategoryName]);

    // Subcategories belonging to this category from admin panel
    const subcategoriesList = useMemo(() => {
        if (!currentCategory) return [];
        const subs = Array.isArray(currentCategory.subcategories) ? currentCategory.subcategories : [];
        return subs.filter(Boolean);
    }, [currentCategory]);

    const [searchParams, setSearchParams] = useSearchParams();
    const sessionKey = `cat_sub_${decodedCategoryName}`;

    const [selectedSubcategory, setSelectedSubcategory] = useState(() => {
        const querySub = searchParams.get('sub');
        if (querySub) return querySub;
        try {
            return sessionStorage.getItem(sessionKey) || '';
        } catch (e) {
            return '';
        }
    });

    const handleSelectSubcategory = useCallback((sub) => {
        setSelectedSubcategory(sub);
        try {
            if (sub) {
                sessionStorage.setItem(sessionKey, sub);
                setSearchParams(prev => {
                    const next = new URLSearchParams(prev);
                    next.set('sub', sub);
                    return next;
                }, { replace: true });
            } else {
                sessionStorage.removeItem(sessionKey);
                setSearchParams(prev => {
                    const next = new URLSearchParams(prev);
                    next.delete('sub');
                    return next;
                }, { replace: true });
            }
        } catch (e) {}
    }, [sessionKey, setSearchParams]);

    // Keep subcategory in sync with query parameter / session storage
    useEffect(() => {
        if (subcategoriesList.length > 0) {
            setSelectedSubcategory(prev => {
                const stored = searchParams.get('sub') || (() => {
                    try { return sessionStorage.getItem(sessionKey); } catch (e) { return null; }
                })();
                const target = prev || stored;
                if (target) {
                    const match = subcategoriesList.find(s => areSubcategoriesMatching(s, target));
                    if (match) return match;
                }
                return subcategoriesList[0];
            });
        } else {
            setSelectedSubcategory('');
        }
    }, [decodedCategoryName, subcategoriesList, sessionKey, searchParams]);

    useEffect(() => {
        if (selectedSubcategory) {
            const timer = setTimeout(() => {
                document.getElementById("active-subcategory-pill")?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'center'
                });
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [selectedSubcategory]);

    // Category name for the header
    const categoryDisplayName = useMemo(() => {
        if (currentCategory) {
            return getCleanCategoryName(currentCategory, language);
        }
        if (decodedCategoryName && decodedCategoryName !== 'All') {
            return getCleanCategoryName(decodedCategoryName, language);
        }
        return t('Products');
    }, [currentCategory, decodedCategoryName, language, t]);

    const allProducts = useMemo(() => {
        return Array.isArray(rawProducts) ? rawProducts : (rawProducts?.data || []);
    }, [rawProducts]);

    // Filter products:
    // 1. When NO subcategory selected: must match current category
    // 2. When a subcategory IS selected: show ALL products that have that subcategory
    //    (regardless of category) — so shared subcategories like "Fresh Juice" that
    //    appear under both "Fruits" and "Juice" categories will show the same products.
    const categoryProducts = useMemo(() => {
        const targetCategory = currentCategory?.name || decodedCategoryName;

        return allProducts.filter(p => {
            if (p.isAvailable === false) return false;

            if (selectedSubcategory) {
                // Subcategory-first filtering: show any product that belongs to this subcategory
                const pSubs = Array.isArray(p.subcategory) ? p.subcategory : (p.subcategory ? [p.subcategory] : []);
                return pSubs.some(s => areSubcategoriesMatching(s, selectedSubcategory));
            }

            // No subcategory selected → filter by category only
            if (targetCategory && targetCategory.toLowerCase() !== 'all') {
                return areCategoriesMatching(p.category, targetCategory);
            }

            return true;
        });
    }, [allProducts, currentCategory, decodedCategoryName, selectedSubcategory]);

    // Zepto-style typewriter animated placeholder (cycles through this section's products)
    const searchWords = useMemo(() => {
        const prodList = (categoryProducts && categoryProducts.length > 0) ? categoryProducts : allProducts;
        const titles = prodList.map(p => {
            const raw = (language === 'ta' && p.title_ta) ? p.title_ta : (p.title || p.name || '');
            return cleanSearchTitle(raw, language);
        }).filter(w => w && w.length > 1);

        const fallbackEn = ['milk', 'bread', 'eggs', 'fruits', 'atta', 'oil', 'tea'];
        const fallbackTa = ['பால்', 'ரொட்டி', 'முட்டை', 'பழங்கள்', 'மாவு', 'எண்ணெய்'];
        const fallbacks = language === 'ta' ? fallbackTa : fallbackEn;

        const combined = titles.length > 0 ? titles.slice(0, 20) : fallbacks;
        return Array.from(new Set(combined));
    }, [categoryProducts, allProducts, language]);

    const searchPlaceholder = useTypewriterPlaceholder(
        searchWords,
        language === 'ta' ? 'தேடுக' : 'Search'
    );

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

    // Single store object for category view
    const singleStore = useMemo(() => {
        if (!categoryProducts || categoryProducts.length === 0) return null;
        for (const p of categoryProducts) {
            const rawStoreId = p.storeId?._id || p.storeId;
            if (rawStoreId) {
                const sId = String(rawStoreId);
                const found = stores.find(s => String(s._id || s.id) === sId);
                if (found) return found;
                if (typeof p.storeId === 'object' && p.storeId?.name) return p.storeId;
            }
        }
        return null;
    }, [categoryProducts, stores]);

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
                    name: currentCategory?.name || t('All Products'),
                    isGeneral: true
                },
                products: generalProducts
            });
        }

        return sections;
    }, [groupedCategoryProducts, stores, isSingleStore, currentCategory, t]);

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

    const isLoading = loadingCategories || loadingProducts || rawProducts.length === 0 || isInitialMount;

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
                                onClick={() => safeNavigateBack(navigate, '/categories')}
                                className="w-[38px] h-[38px] bg-white dark:bg-white/80 rounded-full flex items-center justify-center border border-black/5 dark:border-gray-200/50 shadow-sm transition-transform active:scale-95 flex-shrink-0 cursor-pointer"
                                aria-label="Go back"
                            >
                                <ArrowLeft size={19} className="text-gray-900 dark:text-gray-900" />
                            </button>
                        </div>
                        <div className="flex flex-col text-center px-10 max-w-[260px] sm:max-w-md mx-auto">
                            <h1 className="text-[13.5px] sm:text-[14.5px] font-bold text-gray-900 tracking-tight leading-snug line-clamp-2" title={categoryDisplayName}>
                                {categoryDisplayName}
                            </h1>
                            <p className="text-[10px] font-semibold text-gray-700 mt-0.5">{t('Explore products')}</p>
                        </div>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            <CartHeaderButton className="w-[38px] h-[38px] bg-white dark:bg-white/80 rounded-full flex items-center justify-center border border-black/5 dark:border-gray-200/50 relative hover:bg-gray-50 dark:hover:bg-white/70 shadow-sm transition-all active:scale-95 flex-shrink-0" />
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
                                    placeholder={searchPlaceholder}
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

                {/* Subcategories Bar (Scrollable horizontal bar with box effect) - shown if category has subcategories */}
                {subcategoriesList && subcategoriesList.length > 0 ? (
                    <div className="w-full px-4 mb-4 sm:mb-5">
                        <div className="flex items-stretch gap-2 overflow-x-auto scrollbar-hide py-1">
                            {/* Individual Subcategories */}
                            {subcategoriesList.map((sub) => {
                                const isSelected = selectedSubcategory && areSubcategoriesMatching(selectedSubcategory, sub);
                                const cleanTitle = getCleanCategoryName(sub, language);

                                let subImg = currentCategory?.subcategoryImages?.[sub];
                                if (!subImg && currentCategory?.subcategoryImages) {
                                    const matchEntry = Object.entries(currentCategory.subcategoryImages).find(([k]) => areSubcategoriesMatching(k, sub));
                                    if (matchEntry) subImg = matchEntry[1];
                                }
                                if (!subImg) {
                                    subImg = currentCategory?.image || (currentCategory?._id ? `${API_BASE_URL}/categories/${currentCategory._id}/image` : '');
                                }

                                return (
                                    <button
                                        type="button"
                                        key={sub}
                                        id={isSelected ? "active-subcategory-pill" : undefined}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleSelectSubcategory(sub);
                                        }}
                                        className={`w-[calc((100%-24px)/4)] min-w-[calc((100%-24px)/4)] max-w-[calc((100%-24px)/4)] sm:w-auto sm:min-w-[88px] h-[114px] sm:h-[126px] px-1 pt-2 pb-1.5 sm:px-2.5 sm:pt-2.5 sm:pb-2 rounded-xl flex flex-col items-center justify-start flex-shrink-0 cursor-pointer select-none active:scale-95 transition-all border outline-none ${
                                            isSelected
                                                ? 'bg-white dark:bg-gray-800 shadow-xs border-gray-200/90 dark:border-gray-700'
                                                : 'bg-transparent border-transparent hover:bg-white/40 dark:hover:bg-gray-800/40'
                                        }`}
                                    >
                                        <div className="w-[62px] h-[62px] sm:w-[70px] sm:h-[70px] aspect-square flex items-center justify-center bg-transparent pointer-events-none flex-shrink-0">
                                            <img
                                                src={subImg}
                                                alt={cleanTitle}
                                                draggable={false}
                                                className="w-full h-full object-contain filter drop-shadow-[0_2px_3px_rgba(0,0,0,0.06)] pointer-events-none select-none"
                                                onError={(e) => { e.target.onerror = null; e.target.style.opacity = '0'; }}
                                            />
                                        </div>
                                        <div className="flex items-start justify-center text-center mt-1.5 w-full px-0.5 pointer-events-none h-[28px] sm:h-[32px] overflow-hidden">
                                            <span 
                                                className={`leading-[14px] sm:leading-[15px] text-center w-full transition-colors text-[11px] sm:text-[12px] ${
                                                    isSelected 
                                                        ? 'font-bold text-gray-900 dark:text-white' 
                                                        : 'font-semibold text-gray-700 dark:text-gray-300'
                                                }`} 
                                                style={{
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    wordBreak: 'break-word',
                                                    maxHeight: '28px',
                                                    lineHeight: '14px'
                                                }}
                                                title={cleanTitle}
                                            >
                                                {cleanTitle}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ) : null}

                {/* Related Products:
                    - If only ONE store in category: 2 cards per row with slightly bigger quantity controls!
                    - If multiple stores: Homepage side-scrollable store sections!
                */}
                <div className="px-3 sm:px-4 max-w-7xl mx-auto mt-4 sm:mt-5 pt-1">
                    {isLoading ? (
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
                    ) : isSingleStore ? (
                        /* Only ONE store in the category: Directly show cards without store name and See All */
                        groupedCategoryProducts.length > 0 ? (
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 px-1">
                                    {groupedCategoryProducts.map((product) => (
                                        <div key={product._id || product.id} className="animate-in fade-in duration-300">
                                            <ProductCard 
                                                product={product}
                                                showCartControls={true}
                                                largeControls={false}
                                            />
                                        </div>
                                    ))}
                                </div>
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
