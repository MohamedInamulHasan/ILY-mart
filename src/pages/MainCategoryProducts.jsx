import { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useProducts } from '../hooks/queries/useProducts';
import { useCategories } from '../hooks/queries/useCategories';
import { useMainCategories } from '../hooks/queries/useMainCategories';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, ShoppingCart, Search, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';
import SimpleProductCard from '../components/SimpleProductCard';
import SortDropdown from '../components/SortDropdown';
import PullToRefreshLayout from '../components/PullToRefreshLayout';
import { isStoreOpen, isProductScheduled } from '../utils/storeHelpers';
import { getCleanCategoryName } from '../utils/categoryHelpers';
import { groupProducts } from '../utils/productGrouping';
import { API_BASE_URL } from '../utils/api';

const ProductSkeleton = ({ fastMode }) => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-3 shadow-sm border border-gray-100 dark:border-gray-700/60 flex flex-col justify-between space-y-2.5 h-full">
        <div className="aspect-square w-full rounded-xl blinkit-shimmer"></div>
        <div className="space-y-1.5 flex-1">
            <div className="h-3.5 w-full rounded-lg blinkit-shimmer"></div>
            <div className="h-3 w-2/3 rounded-lg blinkit-shimmer"></div>
        </div>
        <div className="flex items-center justify-between pt-1">
            <div className="h-5 w-14 rounded-md blinkit-shimmer"></div>
            <div className="h-8 w-8 rounded-full blinkit-shimmer"></div>
        </div>
    </div>
);

const MainCategoryProducts = () => {
    const { mainCategoryName } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { stores = [], globalSortOrder, setGlobalSortOrder, fastMode } = useData();
    const { t, language } = useLanguage();
    const { cartCount } = useCart();
    const { user } = useAuth();

    const decodedMainCatName = decodeURIComponent(mainCategoryName || '');
    const [searchQuery, setSearchQuery] = useState('');

    const { data: mainCategories = [], isLoading: loadingMainCats } = useMainCategories();
    const { data: rawCategories = [], isLoading: loadingCategories } = useCategories();
    const { data: rawProducts = [], isLoading: loadingProducts } = useProducts();

    // Identify the active main category
    const currentMainCat = useMemo(() => {
        if (location.state?.mainCategory && typeof location.state.mainCategory === 'object') {
            return location.state.mainCategory;
        }
        const norm = decodedMainCatName.toLowerCase().trim();
        const found = mainCategories.find(m => 
            (m.name && m.name.toLowerCase().trim() === norm) || 
            (m.id && String(m.id).toLowerCase() === norm) ||
            (m._id && String(m._id).toLowerCase() === norm)
        );
        return found || { name: decodedMainCatName, categories: [] };
    }, [location.state, mainCategories, decodedMainCatName]);

    // Categories belonging to this Main Category
    const subCategories = useMemo(() => {
        const list = Array.isArray(rawCategories) ? rawCategories : (rawCategories?.data || []);
        const allProds = Array.isArray(rawProducts) ? rawProducts : (rawProducts?.data || []);

        // Filter out hidden categories
        let filtered = list.filter(c => !c.isHidden);

        // Hide non-listed categories (categories without any available products)
        if (allProds.length > 0) {
            const productCategories = new Set(
                allProds
                    .filter(p => p.isAvailable !== false)
                    .map(p => String(p.category || '').toLowerCase().trim())
                    .filter(Boolean)
            );
            filtered = filtered.filter(cat => productCategories.has(String(cat.name || '').toLowerCase().trim()));
        }

        // Assigned categories to this main category
        const assigned = Array.isArray(currentMainCat?.categories) ? currentMainCat.categories : [];
        if (assigned.length > 0) {
            const assignedSet = new Set(assigned.map(c => String(c).toLowerCase().trim()));
            const subset = filtered.filter(cat => 
                assignedSet.has(String(cat.name || '').toLowerCase().trim()) ||
                assignedSet.has(String(cat._id || cat.id || '').toLowerCase().trim())
            );
            if (subset.length > 0) {
                return subset;
            }
        }

        // Check if category objects have mainCategory property
        const normMainName = (currentMainCat?.name || decodedMainCatName).toLowerCase().trim();
        const byField = filtered.filter(c => c.mainCategory && c.mainCategory.toLowerCase().trim() === normMainName);
        if (byField.length > 0) {
            return byField;
        }

        return filtered;
    }, [rawCategories, rawProducts, currentMainCat, decodedMainCatName]);

    const allProducts = useMemo(() => {
        return Array.isArray(rawProducts) ? rawProducts : (rawProducts?.data || []);
    }, [rawProducts]);

    // Products belonging to the subcategories of this main category
    const mainCategoryProducts = useMemo(() => {
        const assignedNames = new Set(subCategories.map(c => String(c.name || '').toLowerCase().trim()));
        
        return allProducts.filter(p => {
            if (p.isAvailable === false) return false;
            const pCat = String(p.category || '').toLowerCase().trim();
            if (assignedNames.size > 0 && !assignedNames.has(pCat)) {
                return false;
            }
            return true;
        });
    }, [allProducts, subCategories]);

    // Grouped products with sorting
    const groupedCategoryProducts = useMemo(() => {
        const grouped = groupProducts(mainCategoryProducts, stores);
        let list = [...grouped];
        if (globalSortOrder !== 'none') {
            list.sort((a, b) => {
                const priceA = Number(a.price || 0);
                const priceB = Number(b.price || 0);
                if (globalSortOrder === 'low-to-high') return priceA - priceB;
                if (globalSortOrder === 'high-to-low') return priceB - priceA;
                return 0;
            });
        }
        return list;
    }, [mainCategoryProducts, stores, globalSortOrder]);

    // Store sections (Group products by store)
    const storeSections = useMemo(() => {
        const sections = [];
        const storeMap = new Map();
        const generalProducts = [];

        groupedCategoryProducts.forEach(item => {
            const storeId = item.storeId?._id || item.storeId;
            const store = stores.find(s => (s._id || s.id) === storeId);
            if (store) {
                const sKey = store._id || store.id;
                if (!storeMap.has(sKey)) {
                    storeMap.set(sKey, { store, products: [] });
                }
                storeMap.get(sKey).products.push(item);
            } else {
                generalProducts.push(item);
            }
        });

        storeMap.forEach(sec => sections.push(sec));

        // Sort sections by store open status
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
                    name: currentMainCat?.name || t('All Products'),
                    isGeneral: true
                },
                products: generalProducts
            });
        }

        return sections;
    }, [groupedCategoryProducts, stores, currentMainCat, t]);

    const cleanMainTitle = getCleanCategoryName(currentMainCat?.name || decodedMainCatName, language);
    const isLoading = loadingCategories || loadingProducts || loadingMainCats;
    const isSingleStore = storeSections.length === 1;

    return (
        <PullToRefreshLayout>
            <div className="flex-1 min-h-[calc(100vh-4rem)] bg-[#E8EAEF] dark:bg-gray-900 pb-20 transition-colors duration-200 w-full relative">
                
                {/* Header: Location & Cart (Exact same size, icons, and text as second home page) */}
                <div className="fixed top-0 left-0 right-0 z-[100] w-full bg-[#CBF9B2] dark:bg-[#CBF9B2] rounded-b-[2.5rem] px-4 pt-3.5 pb-3.5 shadow-sm overflow-hidden">
                    {/* Background Accents */}
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
                        <div className="flex flex-col text-center px-10">
                            <h1 className="text-[14.5px] font-bold text-gray-900 tracking-tight leading-tight truncate">
                                {cleanMainTitle || t('Home')}
                            </h1>
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
                    {/* Search Bar & Sort Dropdown (Exact same as second home page design and search logic) */}
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

                            {/* Search Results Dropdown */}
                            {searchQuery.trim() && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50 max-h-96 overflow-y-auto">
                                    {(() => {
                                        const query = searchQuery.toLowerCase().trim();
                                        const filtered = allProducts.filter(p => {
                                            const matchTitle = (p.title || '').toLowerCase().includes(query);
                                            const matchCat = (p.category || '').toLowerCase().includes(query);
                                            const matchSub = (p.subcategory || '').toLowerCase().includes(query);
                                            return matchTitle || matchCat || matchSub;
                                        }).slice(0, 15);

                                        if (filtered.length === 0) {
                                            return (
                                                <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                                    {t('No products found')}
                                                </div>
                                            );
                                        }

                                        return filtered.map((product) => {
                                            const productId = product.id || product._id;
                                            const title = product.title;
                                            const storeObj = stores.find(s => (s._id || s.id) === (product.storeId?._id || product.storeId));
                                            const isClosed = !isStoreOpen(storeObj);

                                            return (
                                                <Link
                                                    key={productId}
                                                    to={`/product/${productId}`}
                                                    onClick={() => setSearchQuery('')}
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
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`font-normal text-gray-800 dark:text-gray-200 truncate text-[13px] tracking-tight leading-tight ${isClosed ? 'opacity-60' : ''}`}>
                                                            {title}
                                                        </p>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className={`text-[#2E5A2E] dark:text-[#CBF9B2] font-medium text-[11px] ${isClosed ? 'grayscale opacity-50' : ''}`}>₹{Number(product.price).toFixed(0)}</span>
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

                    {/* Categories list like in the home page */}
                    {subCategories.length > 0 && (
                        <section className="pt-1 pb-4 px-3 sm:px-4 mb-3">
                            {/* 4 items per row grid - NO white bg card, BIG category images, thick text - exactly like home page */}
                            <div className="grid grid-cols-4 gap-x-2 gap-y-4 px-1 sm:px-2 py-1">
                                {subCategories.map((category) => {
                                    const cleanTitle = getCleanCategoryName(category, language);

                                    return (
                                        <div
                                            key={category._id || category.id}
                                            onClick={() => navigate(`/category/${encodeURIComponent(category.name)}`, {
                                                state: {
                                                    mainCategory: currentMainCat?.name || decodedMainCatName,
                                                    filterCategories: subCategories.map(c => c.name || c)
                                                }
                                            })}
                                            className="w-full flex flex-col items-center gap-1 group cursor-pointer select-none active:scale-95 transition-transform"
                                        >
                                            {/* Big category image directly on background */}
                                            <div className="w-[70px] h-[70px] sm:w-[80px] sm:h-[80px] aspect-square flex items-center justify-center bg-transparent">
                                                <img
                                                    src={`${category.image || `${API_BASE_URL}/categories/${category._id || category.id}/image`}?t=${Math.floor((category.updatedAt ? new Date(category.updatedAt).getTime() : Date.now()) / 60000)}`}
                                                    alt={category.name}
                                                    className="w-full h-full object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.06)]"
                                                    loading="lazy"
                                                    decoding="async"
                                                    onError={(e) => { e.target.onerror = null; e.target.style.opacity = '0'; }}
                                                />
                                            </div>

                                            {/* Clean single-language title, font-bold */}
                                            <div className="flex flex-col items-center justify-center text-center w-full px-0.5 pb-1">
                                                <span 
                                                    className="text-[11px] sm:text-[12px] font-bold text-gray-900 dark:text-gray-100 leading-normal truncate block text-center w-full"
                                                    title={cleanTitle}
                                                >
                                                    {cleanTitle}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {/* Products grouped by Store - matching Home page store name & cards style */}
                    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
                        {isLoading ? (
                            <div className="px-4">
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                    {[1, 2, 3, 4, 5, 6].map(i => (
                                        <ProductSkeleton key={i} fastMode={fastMode} />
                                    ))}
                                </div>
                            </div>
                        ) : storeSections.length === 0 ? (
                            <div className="text-center py-16 px-4">
                                <p className="text-gray-500 dark:text-gray-400 font-medium">
                                    {t('No products found in this category')}
                                </p>
                            </div>
                        ) : (
                            storeSections.map(({ store, products: sProducts }) => {
                                const isOpen = store.isGeneral ? true : isStoreOpen(store);
                                const storeAddress = typeof store.address === 'object'
                                    ? [store.address.street, store.address.city].filter(Boolean).join(', ') || store.address.address || ''
                                    : (store.address || '');

                                return (
                                    <section 
                                        key={store._id || store.id} 
                                        className={`px-4 pt-2.5 pb-4 md:py-5 dark:bg-gray-900 transition-opacity duration-300 ${!isOpen ? 'opacity-80' : ''}`}
                                    >
                                        {/* Store Header matching Home Page exactly */}
                                        <div className="flex justify-between items-end mb-3.5 sm:mb-4 px-1">
                                            <div className="flex flex-col min-w-0 flex-1 pr-3">
                                                <div className="flex items-center gap-2">
                                                    <h2 
                                                        className="text-[16px] sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white leading-tight truncate w-full" 
                                                        title={store.name}
                                                    >
                                                        {store.name}
                                                    </h2>
                                                </div>
                                                {storeAddress && (
                                                    <p className="text-[11px] text-gray-400 font-medium mt-1 truncate w-full">
                                                        {storeAddress}
                                                    </p>
                                                )}
                                                {store.slogan && (
                                                    <p className="text-[11px] text-gray-400 font-medium mt-1 truncate w-full">
                                                        {t(store.slogan)}
                                                    </p>
                                                )}
                                            </div>

                                            {/* See All link matching Home Page */}
                                            {isOpen && !store.isGeneral ? (
                                                <Link 
                                                    to={`/store/${store._id || store.id}`} 
                                                    className="text-xs font-semibold text-[#2E5A2E] dark:text-[#CBF9B2] hover:opacity-70 transition-all shrink-0"
                                                >
                                                    {t('See All')}
                                                </Link>
                                            ) : (
                                                <span className="text-xs font-semibold text-gray-400 dark:text-gray-650 cursor-not-allowed select-none shrink-0">
                                                    {t('See All')}
                                                </span>
                                            )}
                                        </div>

                                        {/* Product Cards: Side-Scrollable if multiple stores, Grid if single store */}
                                        {isSingleStore ? (
                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 px-1">
                                                {sProducts.map((product, idx) => (
                                                    <div key={`${product._id || product.id}-${idx}`}>
                                                        {fastMode ? (
                                                            <SimpleProductCard product={product} />
                                                        ) : (
                                                            <ProductCard product={product} showCartControls={true} />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex overflow-x-auto scrollbar-hide gap-3 md:gap-4 pb-2 px-1">
                                                <div className="flex gap-3 md:gap-4">
                                                    {sProducts.map((product, idx) => (
                                                        <div 
                                                            key={`${product._id || product.id}-${idx}`} 
                                                            className="w-[142px] sm:w-[155px] md:w-[175px] lg:w-[195px] shrink-0"
                                                        >
                                                            {fastMode ? (
                                                                <SimpleProductCard product={product} />
                                                            ) : (
                                                                <ProductCard product={product} showCartControls={true} />
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </section>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </PullToRefreshLayout>
    );
};

export default MainCategoryProducts;
