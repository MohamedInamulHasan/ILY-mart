import { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, Phone, ChevronRight, AlertCircle, Zap, Search, ListFilter, ShoppingCart, X } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { useAds } from '../hooks/queries/useAds';
import { getCleanCategoryName } from '../utils/categoryHelpers';
import { isStoreOpen, isProductScheduled } from '../utils/storeHelpers';
import PullToRefreshLayout from '../components/PullToRefreshLayout';
import { API_BASE_URL } from '../utils/api';
import { groupProducts } from '../utils/productGrouping';
import ProductCard from '../components/ProductCard';
import SimpleProductCard from '../components/SimpleProductCard';
import SortDropdown from '../components/SortDropdown';

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


const StoreAdsBanner = ({ ads, t }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const scrollRef = useRef(null);
    const navigate = useNavigate();

    const handleOrderNow = (e, ad) => {
        if (e) e.stopPropagation();

        // 1. If ad has a specific link, navigate to it
        if (ad.link) {
            if (ad.link.startsWith('/')) {
                navigate(ad.link);
                return;
            } else if (ad.link.startsWith('http')) {
                window.open(ad.link, '_blank');
                return;
            }
        }

        // 2. If ad has a price, navigate directly to checkout (matching HeroBanner direct purchase)
        if (ad.price && Number(ad.price) > 0) {
            const adItem = {
                id: ad._id || ad.id,
                product: ad._id || ad.id,
                title: ad.offerTitle || ad.title || 'Special Offer',
                name: ad.offerTitle || ad.title || 'Special Offer',
                price: Number(ad.price),
                quantity: 1,
                image: ad.image || `${API_BASE_URL}/ads/${ad._id || ad.id}/image`,
                storeId: ad.storeId,
                storeName: ad.storeName,
                isFromAd: true,
                adTitle: ad.offerTitle || ad.title,
                unit: ad.unit || ''
            };
            navigate('/checkout', {
                state: {
                    directPurchase: {
                        items: [adItem],
                        total: adItem.price
                    }
                }
            });
            return;
        }

        // 3. If ad references a product
        if (ad.productId) {
            navigate(`/product/${ad.productId}`);
            return;
        }

        // 4. Default: navigate to checkout
        navigate('/checkout');
    };

    useEffect(() => {
        if (!ads || ads.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentSlide(prev => {
                const next = (prev + 1) % ads.length;
                if (scrollRef.current) {
                    const width = scrollRef.current.offsetWidth;
                    scrollRef.current.scrollTo({
                        left: width * next,
                        behavior: 'smooth'
                    });
                }
                return next;
            });
        }, 4000);
        return () => clearInterval(interval);
    }, [ads]);

    const handleScroll = () => {
        if (scrollRef.current) {
            const width = scrollRef.current.offsetWidth;
            const newIndex = Math.round(scrollRef.current.scrollLeft / width);
            if (newIndex !== currentSlide) {
                setCurrentSlide(newIndex);
            }
        }
    };

    if (!ads || ads.length === 0) return null;

    return (
        <div className="relative w-full rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800">
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory"
                style={{ scrollSnapType: 'x mandatory' }}
            >
                {ads.map((ad, idx) => (
                    <div
                        key={ad._id || ad.id || idx}
                        onClick={(e) => handleOrderNow(e, ad)}
                        className="w-full flex-shrink-0 snap-center relative aspect-[16/7] sm:aspect-[21/9] cursor-pointer"
                    >
                        <img
                            src={ad.image || `${API_BASE_URL}/ads/${ad._id || ad.id}/image`}
                            alt={ad.title || 'Store Ad'}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://placehold.co/800x350?text=Special+Offer';
                            }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none"></div>

                        {/* Order Now Tag in the right side of image: white card, black thick text */}
                        <button
                            type="button"
                            onClick={(e) => handleOrderNow(e, ad)}
                            className="absolute right-3.5 bottom-3.5 sm:right-4 sm:bottom-4 z-20 bg-white text-black font-extrabold text-[11px] sm:text-[12px] px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl shadow-lg flex items-center gap-1.5 select-none active:scale-95 transition-transform cursor-pointer border border-black/5"
                        >
                            <span>{t('Order Now')}</span>
                        </button>
                    </div>
                ))}
            </div>

            {/* Pagination dots if multiple ads */}
            {ads.length > 1 && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
                    {ads.map((_, i) => (
                        <div
                            key={i}
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                                i === currentSlide ? 'w-4 bg-white' : 'w-1.5 bg-white/50'
                            }`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const StoreProducts = () => {
    const { id } = useParams();
    const { products, stores, categories, loading, fastMode, toggleFastMode, globalSortOrder, setGlobalSortOrder } = useData();
    const { cartCount } = useCart();
    const { t, language } = useLanguage();
    const [selectedSubcategory, setSelectedSubcategory] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const storeId = id;
    const navigate = useNavigate();
    const location = useLocation();
    const isFromHome = location.state?.from === 'home';

    // Find store and its products
    const store = stores.find(s => (s._id || s.id) === storeId);

    const { data: allAds = [] } = useAds();

    // Matching ads mentioning this store
    const storeAds = useMemo(() => {
        if (!store || !Array.isArray(allAds) || allAds.length === 0) return [];
        const sName = (store.name || '').toLowerCase().trim();
        const sId = String(store._id || store.id || '');
        
        return allAds.filter(ad => {
            if (ad.isActive === false) return false;
            const adStoreId = String(ad.storeId?._id || ad.storeId || '');
            if (adStoreId && adStoreId === sId) return true;
            
            const adStoreName = String(ad.storeName || '').toLowerCase().trim();
            if (adStoreName && (adStoreName === sName || sName.includes(adStoreName) || adStoreName.includes(sName))) return true;
            
            const adTitle = String(ad.title || '').toLowerCase().trim();
            if (adTitle && sName && (adTitle.includes(sName) || sName.includes(adTitle))) return true;
            
            const adLink = String(ad.link || '');
            if (sId && adLink.includes(sId)) return true;
            
            return false;
        });
    }, [allAds, store]);

    // All products for this store (INCLUDE closed for search)
    const storeProducts = useMemo(() => {
        return products.filter(p => {
            const pStoreId = p.storeId?._id || p.storeId;
            return pStoreId == storeId || String(pStoreId) === String(storeId);
        });
    }, [products, storeId]);

    // Check if the product is open/available
    const checkProductOpen = (p, s) => {
        if (p.isAvailable === false) return false;
        if (!isStoreOpen(s)) return false;
        return true; // Timed products show with availability overlay on card
    };

    // Filtered products for main display (include timed-out ones for overlay display)
    const availableStoreProducts = useMemo(() => {
        return storeProducts.filter(p => checkProductOpen(p, store));
    }, [storeProducts, store]);

    // Group products by title with centralized utility
    const groupedStoreProducts = useMemo(() => {
        return groupProducts(availableStoreProducts, stores, { forcedStoreId: storeId });
    }, [availableStoreProducts, stores, storeId]);

    // Aggressive subcategory normalization (consistent with CategoryProducts.jsx)
    const normalizeSub = (s) => {
        if (!s) return '';
        let clean = s.replace(/[0-9]/g, '').trim().toLowerCase();
        const unitWords = ['units', 'packs', 'pack', 'grams', 'gram', 'ml', 'liter', 'litre', 'kg', 'g', 'l', 'x', 'pc', 'pcs', 'pieces', 'piece', 'bottles', 'bottle', 'cans', 'can', 'boxes', 'box', 'rolls', 'roll', 'sheets', 'sheet', 'pairs', 'pair', 'sets', 'set', 'tubes', 'tube', 'jars', 'jar', 'bags', 'bag', 'strips', 'strip', 'bars', 'bar', 'cups', 'cup', 'sachets', 'sachet', 'pouches', 'pouch', 'cartons', 'carton', 'bundles', 'bundle', 'dzn', 'dozen', 'pkt', 'packet', 'pck', 'pckts'];
        unitWords.forEach(word => {
            clean = clean.replace(new RegExp(`\\b${word}\\b`, 'g'), '').trim();
        });
        if (clean.endsWith('s') && clean.length > 3) clean = clean.slice(0, -1);
        return clean.charAt(0).toUpperCase() + clean.slice(1);
    };

    // Extract unique subcategories and their counts from the store's products
    const subcategoryData = useMemo(() => {
        const counts = {};
        const relevantCategoryIds = new Set();
        const relevantCategoryNames = new Set();

        if (store && store.type) {
            const types = Array.isArray(store.type) ? store.type : [store.type];
            types.forEach(t => relevantCategoryNames.add(t.toLowerCase()));
        }

        groupedStoreProducts.forEach(p => {
            const subs = Array.isArray(p.subcategory) ? p.subcategory : (p.subcategory ? [p.subcategory] : []);
            const unique = [...new Set(subs.map(normalizeSub).filter(Boolean))];
            unique.forEach(s => {
                counts[s] = (counts[s] || 0) + 1;
            });
            const catId = p.categoryId?._id || p.categoryId;
            if (catId) {
                relevantCategoryIds.add(String(catId));
            }
        });

        const result = Object.entries(counts)
            .map(([name, count]) => ({ name, count }));

        // Get the subcategory order from the relevant categories
        const subOrder = [];
        categories.forEach(cat => {
            const isMatch = relevantCategoryIds.has(String(cat._id || cat.id)) ||
                relevantCategoryNames.has(cat.name?.toLowerCase());

            if (isMatch) {
                if (cat.subcategories && Array.isArray(cat.subcategories)) {
                    cat.subcategories.forEach(s => {
                        const normalized = normalizeSub(s);
                        if (!subOrder.includes(normalized)) {
                            subOrder.push(normalized);
                        }
                    });
                }
            }
        });

        // Sort based on the subOrder if available, otherwise fallback to alphabetical
        return result.sort((a, b) => {
            const indexA = subOrder.indexOf(a.name);
            const indexB = subOrder.indexOf(b.name);

            if (indexA !== -1 && indexB !== -1) {
                return indexA - indexB;
            } else if (indexA !== -1) {
                return -1;
            } else if (indexB !== -1) {
                return 1;
            }
            return a.name.localeCompare(b.name);
        });
    }, [groupedStoreProducts, categories, store]);

    const totalProductCount = useMemo(() => groupedStoreProducts.length, [groupedStoreProducts]);

    // Group and sort logic (matches CategoryProducts.jsx)
    const sections = useMemo(() => {
        const groups = {};

        // Pre-filter by search query to allow "No results" feedback in the main grid
        const filteredList = searchQuery.trim()
            ? groupedStoreProducts.filter(p =>
                p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
            )
            : groupedStoreProducts;

        if (!selectedSubcategory) {
            const allItems = filteredList;
            if (allItems.length === 0) return [];

            if (globalSortOrder !== 'none') {
                allItems.sort((a, b) => {
                    const priceA = Number(a.price || 0);
                    const priceB = Number(b.price || 0);
                    return globalSortOrder === 'lowToHigh' ? priceA - priceB : priceB - priceA;
                });
            }
            return [['_all_', allItems]];
        }
        const storeTypes = store ? (Array.isArray(store.type) ? store.type : [store.type]) : [];
        const isFoodStore = storeTypes.some(type =>
            ['foods', 'hotels', 'restaurants', 'food', 'hotel', 'restaurant'].includes(type?.toLowerCase())
        );

        const getCurrentMeal = () => {
            const hour = new Date().getHours();
            if (hour >= 5 && hour < 12) return 'Breakfast';
            if (hour >= 12 && hour < 17) return 'Lunch';
            return 'Dinner';
        };

        const currentMeal = getCurrentMeal();

        // Separate 'All' products to always be top or bottom if needed
        // For food stores, we prioritize current meal subcategories in the 'All' section
        // We handle grouping products into subcategories
        filteredList.forEach(p => {
            const rawSubs = Array.isArray(p.subcategory) ? p.subcategory : (p.subcategory ? [p.subcategory] : []);
            const normalizedSubs = [...new Set(
                rawSubs
                    .filter(Boolean)
                    .map(normalizeSub)
                    .filter(s => s !== '')
            )].sort();

            const subKey = normalizedSubs.join(' & ') || 'Other';
            if (!groups[subKey]) groups[subKey] = [];
            groups[subKey].push(p);
        });

        // 1. Sort products WITHIN each group by their manual 'order'
        Object.keys(groups).forEach(key => {
            groups[key].sort((a, b) => {
                // If sorting by price is active, it takes precedence
                if (globalSortOrder !== 'none') {
                    const priceA = Number(a.price || 0);
                    const priceB = Number(b.price || 0);
                    return globalSortOrder === 'lowToHigh' ? priceA - priceB : priceB - priceA;
                }
                // Fallback to manual order
                return (a.order || 0) - (b.order || 0);
            });
        });

        // 2. Filter by selected subcategory if one is active
        if (selectedSubcategory) {
            const normalizedSelected = normalizeSub(selectedSubcategory);
            const filteredProducts = filteredList
                .filter(p => {
                    const rawSubs = Array.isArray(p.subcategory) ? p.subcategory : (p.subcategory ? [p.subcategory] : []);
                    return rawSubs.some(s => normalizeSub(s) === normalizedSelected);
                })
                .sort((a, b) => (a.order || 0) - (b.order || 0));

            return [['_all_', filteredProducts]];
        }

        // 3. Sort the GROUPS themselves
        return Object.entries(groups).sort((a, b) => {
            const [nameA, productsA] = a;
            const [nameB, productsB] = b;

            // Prioritize by food meal times if it's a food store
            if (isFoodStore) {
                const aIsMeal = [currentMeal, 'Meals', 'Tiffin'].some(m => nameA.includes(m));
                const bIsMeal = [currentMeal, 'Meals', 'Tiffin'].some(m => nameB.includes(m));
                if (aIsMeal && !bIsMeal) return -1;
                if (!aIsMeal && bIsMeal) return 1;
            }

            // Fallback to the 'order' of the first product in the group
            const orderA = productsA[0]?.order || 0;
            const orderB = productsB[0]?.order || 0;
            return orderA - orderB;
        });
    }, [groupedStoreProducts, selectedSubcategory, globalSortOrder, searchQuery, t, store]);

    // Keep displayProducts for simple count checks
    const displayProducts = useMemo(() => sections.flatMap(s => s[1]), [sections]);

    useEffect(() => {
        const activePill = document.getElementById('active-sub-pill');
        if (activePill) {
            activePill.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }, [selectedSubcategory]);

    if (!store || store.isActive === false) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{t('Store not found')}</h2>
                <Link to="/store" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-2">
                    <ArrowLeft size={20} />
                    {t('Back to Stores')}
                </Link>
            </div>
        );
    }

    const storeIsOpen = isStoreOpen(store);

    return (
        <PullToRefreshLayout>
            <div className="flex-1 bg-[#E8EAEF] dark:bg-gray-900 pb-8 transition-colors duration-200 w-full relative">
                {/* Premium Light Green Header Card (Fixed Header) */}
                <div className="fixed top-0 left-0 right-0 z-[100] w-full bg-[#CBF9B2] dark:bg-[#CBF9B2] rounded-b-[2.5rem] px-4 pt-3.5 pb-3.5 shadow-sm overflow-hidden">
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/30 dark:bg-[#CBF9B2]/20 rounded-full blur-3xl pointer-events-none"></div>
                    
                    <div className="relative z-10">
                        <div className="w-full px-4 relative flex items-center justify-center min-h-[38px]">
                            <div className="absolute left-2 top-1/2 -translate-y-1/2">
                                <button 
                                    onClick={() => navigate(-1)} 
                                    className="w-[38px] h-[38px] flex items-center justify-center bg-white dark:bg-white/80 rounded-full text-gray-900 dark:text-gray-900 transition-transform active:scale-95 shadow-sm border border-gray-100/50 dark:border-gray-200/50"
                                >
                                    <ArrowLeft size={19} />
                                </button>
                            </div>
                            <div className="flex flex-col items-center text-center px-12 min-w-0">
                                <h1 className="text-[14.5px] font-bold text-gray-900 tracking-tight leading-tight truncate max-w-[220px] sm:max-w-[320px]">{store?.name}</h1>
                                {store?.address && (
                                    <div className="flex items-center justify-center gap-1 mt-0.5 max-w-[240px] sm:max-w-[340px] truncate">
                                        <MapPin size={10} className="text-[#2E5A2E] flex-shrink-0" />
                                        <p className="text-[10px] font-semibold text-gray-700 truncate">{store?.address}</p>
                                    </div>
                                )}
                            </div>
                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                <button 
                                    onClick={() => navigate('/cart')}
                                    className="w-[38px] h-[38px] flex items-center justify-center bg-white dark:bg-white/80 rounded-full text-gray-900 dark:text-gray-900 transition-transform active:scale-95 shadow-sm border border-black/5 dark:border-gray-200/50 relative"
                                >
                                    <ShoppingCart size={19} className="text-[#2E5A2E] dark:text-[#2E5A2E]" />
                                    {cartCount > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold h-[18px] w-[18px] rounded-full flex items-center justify-center shadow-sm border-2 border-white dark:border-gray-800">
                                            {cartCount}
                                        </span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-[88px]">

                {/* Ads mentioning this store - auto-scroll banner with Order Now tag */}
                {storeAds.length > 0 && (
                    <div className="max-w-2xl mx-auto px-4 mb-3 sm:mb-3.5">
                        <StoreAdsBanner ads={storeAds} t={t} />
                    </div>
                )}

                {/* Store Search & Filter (Now Below the Design) */}
                <section className="px-4 relative z-20 mb-3.5 sm:mb-4">
                    <div className="flex items-center gap-2.5 sm:gap-3 max-w-2xl mx-auto relative">
                    <div className="relative group flex-1">
                        <form onSubmit={(e) => e.preventDefault()}>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={`${t('Search in')} ${store?.name}...`}
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
                    
                    {/* Sort Dropdown */}
                    <SortDropdown currentSort={globalSortOrder} onSortChange={setGlobalSortOrder} />

                    {/* Store Search Results Dropdown (Wider/Full-container width like Home) */}
                    {searchQuery.trim() && (
                        <div className="absolute top-[calc(100%+12px)] left-0 right-0 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto z-[200] animate-in fade-in slide-in-from-top-2 duration-300 shadow-xl">
                            {(() => {
                                const q = searchQuery.toLowerCase();
                                const results = storeProducts
                                    .filter(p =>
                                        p.title?.toLowerCase().includes(q) ||
                                        p.title_ta?.toLowerCase().includes(q)
                                    )
                                    .sort((a, b) => {
                                        const aOpen = checkProductOpen(a, store);
                                        const bOpen = checkProductOpen(b, store);
                                        
                                        // 1. Available products first
                                        if (aOpen && !bOpen) return -1;
                                        if (!aOpen && bOpen) return 1;
                                        
                                        // 2. Starts with query prioritization
                                        const aTitle = a.title?.toLowerCase() || '';
                                        const bTitle = b.title?.toLowerCase() || '';
                                        
                                        const aStarts = aTitle.startsWith(q);
                                        const bStarts = bTitle.startsWith(q);
                                        
                                        if (aStarts && !bStarts) return -1;
                                        if (!aStarts && bStarts) return 1;
                                        return 0;
                                    })
                                    .slice(0, 10);

                                if (results.length === 0) {
                                    return (
                                        <div className="p-8 text-center text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap overflow-hidden">
                                            {t('No products found')}
                                        </div>
                                    );
                                }

                                return results.map(product => {
                                    const productId = product._id || product.id;
                                    const productOpen = checkProductOpen(product, store);
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
                                            className={`flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50/80 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-50 dark:border-gray-700 last:border-b-0 ${isClosed ? 'cursor-not-allowed opacity-80' : ''}`}
                                        >
                                            <div className="relative flex-shrink-0">
                                                <div className={`w-12 h-12 rounded-lg bg-gray-50 dark:bg-gray-700 p-1 flex items-center justify-center overflow-hidden border border-gray-100 dark:border-gray-600 ${isClosed ? 'blur-[1px]' : ''}`}>
                                                    <img
                                                        src={product.image || `${API_BASE_URL}/products/${productId}/image`}
                                                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/100x100?text=No+Image'; }}
                                                        alt={product.title}
                                                        className="w-full h-full object-contain"
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
                                                    <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg px-2 py-0.5 shadow-sm">
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

            {subcategoryData.length > 0 && (
                <div className="max-w-7xl mx-auto px-4 mb-3 sm:mb-3.5">
                    <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide border-b border-gray-100/50">
                        <button
                            onClick={() => setSelectedSubcategory(null)}
                            className={`pb-2 text-sm font-medium transition-all relative whitespace-nowrap ${
                                !selectedSubcategory 
                                ? 'text-black dark:text-white' 
                                : 'text-gray-400 hover:text-black dark:hover:text-white'
                            }`}
                        >
                            {t('All')}
                            {!selectedSubcategory && (
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[1.5px] w-[80%] bg-[#2E5A2E] dark:bg-[#CBF9B2] rounded-full animate-in fade-in zoom-in-75 duration-200"></div>
                            )}
                        </button>
                        
                        {subcategoryData.map(({ name }) => (
                            <button
                                key={name}
                                onClick={() => setSelectedSubcategory(name)}
                                className={`pb-2 text-sm font-medium transition-all relative whitespace-nowrap ${
                                    selectedSubcategory === name 
                                    ? 'text-black dark:text-white' 
                                    : 'text-gray-400 hover:text-black dark:hover:text-white'
                                }`}
                            >
                                {getCleanCategoryName(name, language)}
                                {selectedSubcategory === name && (
                                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[1.5px] w-[80%] bg-[#2E5A2E] dark:bg-[#CBF9B2] rounded-full animate-in fade-in zoom-in-75 duration-200"></div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}



            {/* Store Closed Banner (Moved here) */}
            {!storeIsOpen && (
                <div className="max-w-7xl mx-auto px-4 mb-2">
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 flex items-center gap-3">
                        <AlertCircle className="text-red-600 dark:text-red-400 flex-shrink-0" size={20} />
                        <div>
                            <p className="font-semibold text-red-900 dark:text-red-200 text-sm">{t('Store Closed')}</p>
                            {store.timingType !== 'permanent' && (
                                <p className="text-xs text-red-700 dark:text-red-300">
                                    {t('Opens')} {store.openingTime || '9:00 AM'}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}



            {/* Content Area */}
            <div className="max-w-7xl mx-auto px-4 pt-1 sm:pt-2 pb-4">
                {/* Loading State Skeleton */}
                {loading.products ? (
                    <div className={`grid gap-3 sm:gap-4 ${fastMode ? 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'}`}>
                        {[...Array(10)].map((_, i) => (
                            <ProductSkeleton key={i} fastMode={fastMode} />
                        ))}
                    </div>
                ) : sections.length > 0 ? (
                    <div className="space-y-3.5 sm:space-y-4">
                        {sections.map(([groupName, groupProducts]) => (
                            <div key={groupName}>
                                {groupName !== '_all_' && !selectedSubcategory && (
                                    <div className="flex justify-between items-center mb-3.5 bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm -mx-4 px-4 py-2.5">
                                        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                            <div className="w-1.5 h-6 bg-[#2E5A2E] dark:bg-[#8bc910] rounded-full"></div>
                                            {(() => {
                                                const fullTitle = t(groupName);
                                                if (language !== 'ta') return fullTitle;
                                                
                                                const bracketIndex = fullTitle.indexOf('(');
                                                if (bracketIndex === -1) return fullTitle;

                                                const part1 = fullTitle.substring(0, bracketIndex).trim();
                                                const part2 = fullTitle.substring(bracketIndex + 1, fullTitle.length - 1).trim();
                                                
                                                const isPart1Tamil = /[\u0B80-\u0BFF]/.test(part1);
                                                const isPart2Tamil = /[\u0B80-\u0BFF]/.test(part2);
                                                
                                                if (isPart1Tamil && !isPart2Tamil) return `${part1} (${part2})`;
                                                if (isPart2Tamil && !isPart1Tamil) return `${part2} (${part1})`;
                                                return fullTitle;
                                            })()}
                                        </h2>
                                    </div>
                                )}
                                <div className={`grid gap-3 sm:gap-4 ${fastMode ? 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'}`}>
                                    {groupProducts.map((product) => (
                                        (fastMode) ? (
                                            <SimpleProductCard key={product._id || product.id} product={product} isFastPurchase={fastMode} />
                                        ) : (
                                            <ProductCard key={product._id || product.id} product={product} showCartControls={true} />
                                        )
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <div className="bg-white dark:bg-gray-800 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-sm">
                            <Search className="text-gray-400 dark:text-gray-500" size={32} />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            {searchQuery.trim() || selectedSubcategory ? t('No matches found') : t('Store is Empty')}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                            {searchQuery.trim() || selectedSubcategory 
                                ? t('Try adjusting your search or category filter.')
                                : t('This store has no products yet.')}
                        </p>
                        {(searchQuery.trim() || selectedSubcategory) && (
                            <button
                                onClick={() => { setSearchQuery(''); setSelectedSubcategory(null); }}
                                className="px-6 py-2 bg-[#2E5A2E] dark:bg-[#CBF9B2] text-white dark:text-gray-900 rounded-xl font-bold text-sm active:scale-95 transition-all shadow-sm"
                            >
                                {t('Clear All')}
                            </button>
                        )}
                    </div>
                )}
                    </div>
                </div>
            </div>
        </PullToRefreshLayout>
    );
};

export default StoreProducts;
