import { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { MapPin, Search, Star, Clock, Phone, Store, Wrench, ArrowRight, X, ArrowLeft } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { useCategories } from '../hooks/queries/useCategories';
import { useStores } from '../hooks/queries/useStores';
import { getCleanCategoryName, stripEmojis, extractEmojis } from '../utils/categoryHelpers';
import { isStoreOpen, formatTime12h } from '../utils/storeHelpers';
import StoreCard from '../components/StoreCard';
import { API_BASE_URL } from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import HomeHeader from '../components/home/HomeHeader';
import CartHeaderButton from '../components/CartHeaderButton';
import useTypewriterPlaceholder, { cleanSearchTitle } from '../hooks/useTypewriterPlaceholder';

const ShopCategoryItem = ({ category, isActive, onClick, dbCategories, settings }) => {
    const [imgError, setImgError] = useState(false);
    const isAll = (category?.name || '').toLowerCase() === 'all';

    const dbCat = useMemo(() => {
        if (isAll) return null;
        const nKey = stripEmojis(String(category?.name || '')).trim().toLowerCase();
        return (dbCategories || []).find(c => {
            const cName = stripEmojis(String(c?.name || '')).trim().toLowerCase();
            const cNameTa = stripEmojis(String(c?.name_ta || '')).trim().toLowerCase();
            return cName === nKey || cNameTa === nKey || (c?._id && String(c._id) === String(category._id || category.id));
        });
    }, [category, dbCategories, isAll]);

    const targetCat = dbCat || category;

    // Full English name without truncation or Tamil brackets
    const englishName = useMemo(() => {
        if (isAll) {
            const rawAll = settings?.allCategoryName || 'All';
            return stripEmojis(rawAll).split('(')[0].trim() || 'All';
        }
        const raw = targetCat?.name || category?.name || '';
        const cleaned = stripEmojis(raw).split('(')[0].trim();
        return cleaned || raw;
    }, [targetCat, category, isAll, settings]);

    const emoji = useMemo(() => {
        if (isAll) return '';
        return targetCat?.emoji || targetCat?.icon || extractEmojis(targetCat?.name) || extractEmojis(category?.name) || '';
    }, [targetCat, category, isAll]);

    const imageUrl = useMemo(() => {
        if (isAll) {
            return settings?.allStoreCategoryImage || settings?.allCategoryImage || null;
        }
        if (targetCat?.storeImage) return targetCat.storeImage;
        if (targetCat?.image) return targetCat.image;
        const catId = targetCat?._id || targetCat?.id;
        if (catId) {
            return `${API_BASE_URL}/categories/${catId}/store-image?t=${Math.floor((targetCat.updatedAt ? new Date(targetCat.updatedAt).getTime() : Date.now()) / 60000)}`;
        }
        return null;
    }, [targetCat, isAll, settings]);

    return (
        <button
            id={isActive ? "active-category-pill" : undefined}
            type="button"
            onClick={onClick}
            className="flex flex-col items-center justify-start flex-shrink-0 relative pb-2 pt-0.5 px-1 cursor-pointer select-none min-w-[62px] sm:min-w-[70px] max-w-[80px] sm:max-w-[88px] transition-all group outline-none"
        >
            {/* Image above - Clean transparent container without card background */}
            <div className="w-11 h-11 sm:w-12 sm:h-12 aspect-square flex items-center justify-center bg-transparent mb-1 transition-transform group-hover:scale-105 pointer-events-none">
                {imageUrl && !imgError ? (
                    <img
                        src={imageUrl}
                        alt={englishName}
                        draggable={false}
                        className="w-full h-full object-contain filter drop-shadow-[0_2px_3px_rgba(0,0,0,0.06)] pointer-events-none select-none transition-transform"
                        onError={() => setImgError(true)}
                    />
                ) : emoji ? (
                    <span className="text-2xl sm:text-[26px] leading-none select-none pointer-events-none">{emoji}</span>
                ) : (
                    <Store size={22} className={isActive ? "text-[#2E5A2E] dark:text-[#CBF9B2]" : "text-gray-600 dark:text-gray-400"} />
                )}
            </div>

            {/* Name below - Full English name in one single line */}
            <span 
                className={`text-[12px] sm:text-[13px] text-center leading-tight whitespace-nowrap truncate block w-full px-0.5 transition-colors pointer-events-none ${
                    isActive 
                        ? 'font-bold text-gray-950 dark:text-white' 
                        : 'font-semibold text-gray-700 dark:text-gray-300 group-hover:text-gray-950 dark:group-hover:text-white'
                }`}
                title={englishName}
            >
                {englishName}
            </span>

            {/* Line effect 50% */}
            {isActive && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-1/2 bg-[#2E5A2E] dark:bg-[#CBF9B2] rounded-full animate-in fade-in zoom-in-75 duration-200" />
            )}
        </button>
    );
};

const Shop = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [viewType, setViewType] = useState('store'); // 'store' or 'service'
    const [searchParams, setSearchParams] = useSearchParams();
    const { stores: dataStores, categories: dataCategories, loading, initialLoading, settings } = useData();
    const { data: rawCategories = [], refetch: refetchCategories } = useCategories();
    const { data: rawStores = [], refetch: refetchStores } = useStores();

    const dbCategories = useMemo(() => {
        if (Array.isArray(rawCategories) && rawCategories.length > 0) return rawCategories;
        return Array.isArray(dataCategories) ? dataCategories : [];
    }, [rawCategories, dataCategories]);

    const stores = useMemo(() => {
        if (Array.isArray(rawStores) && rawStores.length > 0) return rawStores;
        return Array.isArray(dataStores) ? dataStores : [];
    }, [rawStores, dataStores]);

    useEffect(() => {
        refetchCategories?.();
        refetchStores?.();
    }, []);

    const services = [];
    const servicesLoading = false;
    const { t, language } = useLanguage();

    // Zepto-style typewriter animated placeholder (Store names only)
    const searchWords = useMemo(() => {
        const storeNames = (stores || []).map(s => {
            const raw = (language === 'ta' && s.name_ta) ? s.name_ta : s.name;
            return cleanSearchTitle(raw, language);
        }).filter(w => w && w.length > 1);

        const fallbackEn = ['Aman Foods', 'Star Supermarket', 'City Bakers', 'Fresh Meat Stall'];
        const fallbackTa = ['அமான் உணவகம்', 'ஸ்டார் சூப்பர் மார்க்கெட்', 'சிட்டி பேக்கர்ஸ்'];
        const fallbacks = language === 'ta' ? fallbackTa : fallbackEn;

        return storeNames.length > 0 ? Array.from(new Set(storeNames)) : fallbacks;
    }, [stores, language]);

    const searchPlaceholder = useTypewriterPlaceholder(
        searchWords,
        language === 'ta' ? 'தேடுக' : 'Search'
    );

    const normKey = (s) => stripEmojis(String(s || '')).trim().toLowerCase();

    // Create a Set of valid category names for filtering store tags
    const validCategoryNames = useMemo(() => new Set((dbCategories || []).map(c => normKey(c.name))), [dbCategories]);
    const navigate = useNavigate();

    const categoryFilter = searchParams.get('category') || 'All';

    // Safety check for stores array to prevent crash if undefined & filter active only
    const safeStores = useMemo(() => (stores || []).filter(s => s.isActive !== false), [stores]);

    // Calculate store counts per category using normalized key matching
    const categoryData = useMemo(() => {
        const counts = {};
        safeStores.forEach(store => {
            const types = Array.isArray(store.type) ? store.type : (store.type ? [store.type] : []);
            types.forEach(t => {
                const nKey = normKey(t);
                if (nKey) {
                    counts[nKey] = (counts[nKey] || 0) + 1;
                }
            });
        });

        const isGeneral = (name) => {
            if (!name) return false;
            const clean = normKey(name).replace(/[\s_-]+/g, '');
            return clean === 'generalstore' || clean === 'generalstores' || clean.includes('generalstore');
        };

        const result = [{ name: 'All', count: safeStores.length }];

        // Map categories from database with uploaded emojis (filter out General Stores)
        (dbCategories || []).forEach(cat => {
            if (!cat || !cat.name) return;
            if (isGeneral(cat.name) || isGeneral(cat.name_ta)) return;
            const nKey = normKey(cat.name);
            const count = counts[nKey] || 0;
            if (count > 0) {
                result.push({
                    ...cat,
                    name: cat.name,
                    count
                });
            }
        });

        // Also check if any store type is not in dbCategories but has stores
        Object.entries(counts).forEach(([nKey, count]) => {
            if (isGeneral(nKey)) return;
            if (count > 0 && !result.some(r => normKey(r.name) === nKey)) {
                let originalName = '';
                for (const store of safeStores) {
                    const types = Array.isArray(store.type) ? store.type : (store.type ? [store.type] : []);
                    const found = types.find(t => normKey(t) === nKey);
                    if (found) { originalName = found; break; }
                }
                if (originalName && !isGeneral(originalName)) {
                    result.push({ name: originalName, count });
                }
            }
        });

        return result;
    }, [safeStores, dbCategories]);

    const getCategoryDisplay = (category) => {
        if (!category) return '';
        if (normKey(category.name) === 'all') {
            return getCleanCategoryName('All', language, null, { keepEmoji: true });
        }
        const nKey = normKey(category.name);
        const found = (dbCategories || []).find(c => {
            return normKey(c?.name) === nKey ||
                   normKey(c?.name_ta) === nKey ||
                   (c?._id && String(c._id) === String(category._id || category.id));
        });
        const target = found || category;
        return getCleanCategoryName(target, language, null, { keepEmoji: true });
    };

    const filteredStores = safeStores.filter(store => {
        const matchesSearch = store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (store.address && store.address.toLowerCase().includes(searchQuery.toLowerCase()));
        
        const normFilter = normKey(categoryFilter);
        const matchesCategory = normFilter === 'all' ||
            (Array.isArray(store.type)
                ? store.type.some(t => normKey(t) === normFilter)
                : store.type && normKey(store.type) === normFilter);

        return matchesSearch && matchesCategory;
    }).sort((a, b) => {
        const isOpenA = isStoreOpen(a);
        const isOpenB = isStoreOpen(b);
        // Open stores (true) come first (-1), Closed (false) come last (1)
        if (isOpenA === isOpenB) return 0;
        return isOpenA ? -1 : 1;
    });

    const handleCategoryClick = (categoryName) => {
        setSearchParams({ category: normKey(categoryName) === 'all' ? 'All' : categoryName });
    };

    useEffect(() => {
        const activePill = document.getElementById('active-category-pill');
        if (activePill) {
            activePill.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }, [categoryFilter]);

    const isStoresLoading = loading?.stores || initialLoading;
    const isCategoriesLoading = loading?.categories || initialLoading;

    return (
        <div className="flex-1 bg-[#E8EAEF] dark:bg-gray-900 pb-8 transition-colors duration-200 w-full">
            {/* Premium Light Green Header Card (Matching Store Products Page Header) */}
            <div className="fixed top-0 left-0 right-0 z-[100] w-full bg-[#CBF9B2] dark:bg-[#CBF9B2] rounded-b-[2.5rem] px-4 pt-3.5 pb-3.5 shadow-sm overflow-hidden">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/30 dark:bg-[#CBF9B2]/20 rounded-full blur-3xl pointer-events-none"></div>
                <div className="relative z-10">
                    <div className="w-full px-4 relative flex items-center justify-center min-h-[38px]">
                        <div className="absolute left-2 top-1/2 -translate-y-1/2">
                            <button 
                                onClick={() => navigate(-1)} 
                                className="w-[38px] h-[38px] flex items-center justify-center bg-white dark:bg-white/80 rounded-full text-gray-900 dark:text-gray-900 transition-transform active:scale-95 shadow-sm border border-gray-100/50 dark:border-gray-200/50"
                                aria-label="Go back"
                            >
                                <ArrowLeft size={19} />
                            </button>
                        </div>
                        <div className="flex flex-col items-center text-center px-10 min-w-0">
                            <h1 className="text-[14.5px] font-bold text-gray-900 tracking-tight leading-tight truncate">
                                {t('Stores list')}
                            </h1>
                            <p className="text-[10px] font-semibold text-gray-700 mt-0.5">{t('Explore products')}</p>
                        </div>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            <CartHeaderButton className="w-[38px] h-[38px] flex items-center justify-center bg-white dark:bg-white/80 rounded-full text-gray-900 dark:text-gray-900 transition-transform active:scale-95 shadow-sm border border-black/5 dark:border-gray-200/50 relative" />
                        </div>
                    </div>
                </div>
            </div>
            
            
                <div className="pt-[88px]">
                <div className="max-w-7xl mx-auto px-4 mt-0 pb-12 sm:pb-16">
                    <div className="mb-2">
                        {/* Removed Store/Service toggle for a cleaner experience */}
                        <div className="relative group mb-3.5 sm:mb-4">
                            <input
                                type="text"
                                placeholder={searchPlaceholder}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
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

                            {/* Search Results Dropdown (Wider/Full-container width) */}
                            {searchQuery.trim() && viewType === 'store' && (
                                <div className="absolute top-[calc(100%+12px)] left-0 right-0 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto z-[200] animate-in fade-in slide-in-from-top-2 duration-300 shadow-xl">
                                    {(() => {
                                        const q = searchQuery.toLowerCase();
                                        const results = safeStores
                                            .filter(store =>
                                                store.name?.toLowerCase().includes(q) ||
                                                store.address?.toLowerCase().includes(q)
                                            )
                                            .sort((a, b) => {
                                                const isOpenA = isStoreOpen(a);
                                                const isOpenB = isStoreOpen(b);
                                                
                                                // 1. Open first
                                                if (isOpenA && !isOpenB) return -1;
                                                if (!isOpenA && isOpenB) return 1;
                                                
                                                // 2. Starts with query prioritization
                                                const aName = a.name?.toLowerCase() || '';
                                                const bName = b.name?.toLowerCase() || '';
                                                
                                                const aStarts = aName.startsWith(q);
                                                const bStarts = bName.startsWith(q);
                                                
                                                if (aStarts && !bStarts) return -1;
                                                if (!aStarts && bStarts) return 1;
                                                return 0;
                                            })
                                            .slice(0, 10);

                                        if (results.length === 0) {
                                            return (
                                                <div className="p-8 text-center text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap overflow-hidden">
                                                    {t('No stores found')}
                                                </div>
                                            );
                                        }

                                        return results.map((store) => {
                                            const storeId = store._id || store.id;
                                            const isOpen = isStoreOpen(store);
                                            const isClosed = !isOpen;
                                            const name = t(store, 'name');

                                            return (
                                                <div
                                                    key={storeId}
                                                    onClick={() => {
                                                        if (isClosed) {
                                                            alert(t('This store is currently closed. Please check back later.'));
                                                            return;
                                                        }
                                                        navigate(`/store/${storeId}`);
                                                        setSearchQuery('');
                                                    }}
                                                    className={`flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50/80 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-50 dark:border-gray-700 last:border-b-0 text-left ${isClosed ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
                                                >
                                                    <div className="relative flex-shrink-0">
                                                        <div className={`w-12 h-12 rounded-lg bg-gray-50 dark:bg-gray-700 p-1 flex items-center justify-center overflow-hidden border border-gray-100 dark:border-gray-600 ${isClosed ? 'blur-[1px]' : ''}`}>
                                                            <img
                                                                src={store.image || `${API_BASE_URL}/stores/${storeId}/image`}
                                                                onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/100x100?text=Store'; }}
                                                                alt={store.name}
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
                                                        <div className={`font-normal text-gray-800 dark:text-gray-200 truncate text-[13px] tracking-tight leading-tight ${isClosed ? 'opacity-60' : ''}`}>
                                                            {name}
                                                        </div>
                                                        <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate mt-0.5 font-normal">
                                                            {t(store, 'address')}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            )}

                            {/* Service Search Results Dropdown */}
                            {searchQuery.trim() && viewType === 'service' && (
                                <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto z-[200] animate-in fade-in slide-in-from-top-2 duration-300 shadow-xl">
                                    {(() => {
                                        const q = searchQuery.toLowerCase();
                                        const results = services
                                            .filter(service =>
                                                service.name?.toLowerCase().includes(q) ||
                                                service.category?.toLowerCase().includes(q)
                                            )
                                            .sort((a, b) => {
                                                const aName = t(a, 'name').toLowerCase();
                                                const bName = t(b, 'name').toLowerCase();
                                                const aStarts = aName.startsWith(q);
                                                const bStarts = bName.startsWith(q);
                                                if (aStarts && !bStarts) return -1;
                                                if (!aStarts && bStarts) return 1;
                                                return 0;
                                            })
                                            .slice(0, 10);

                                        if (results.length === 0) {
                                            return (
                                                <div className="p-8 text-center text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap overflow-hidden">
                                                    {t('No services found')}
                                                </div>
                                            );
                                        }

                                        return results.map((service) => {
                                            const serviceId = service._id || service.id;
                                            const isOpen = isServiceOpen(service);
                                            const isClosed = !isOpen;
                                            const name = t(service, 'name');

                                            return (
                                                <div
                                                    key={serviceId}
                                                    onClick={() => {
                                                        if (isClosed) {
                                                            alert(t('This service is currently closed. Please check back later.'));
                                                            return;
                                                        }
                                                        navigate(`/services?id=${serviceId}`);
                                                        setSearchQuery('');
                                                    }}
                                                    className={`flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50/80 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-50 dark:border-gray-700 last:border-b-0 text-left ${isClosed ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
                                                >
                                                    <div className="relative flex-shrink-0">
                                                        <div className={`w-12 h-12 rounded-lg bg-gray-50 dark:bg-gray-700 p-1 flex items-center justify-center overflow-hidden border border-gray-100 dark:border-gray-600 ${isClosed ? 'blur-[1px] grayscale' : ''}`}>
                                                            <img
                                                                src={service.image || `${API_BASE_URL}/services/${serviceId}/image`}
                                                                onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/100x100?text=Service'; }}
                                                                alt={service.name}
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
                                                        <div className={`font-normal text-gray-800 dark:text-gray-200 truncate text-[13px] tracking-tight leading-tight ${isClosed ? 'opacity-60' : ''}`}>
                                                            {name}
                                                        </div>
                                                        <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate mt-0.5 font-normal">
                                                            {service.category || t('Service')}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            )}
                        </div>


                        {/* Categories Horizontal Scroller with Image Above, Name Below & 50% Line Indicator */}
                        {viewType === 'store' && (
                            isCategoriesLoading ? (
                                <div className="max-w-7xl mx-auto mb-3 px-1 border-b border-gray-200/50 dark:border-gray-800/60 pb-1.5">
                                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
                                        {[1, 2, 3, 4, 5, 6].map((i) => (
                                            <div key={i} className="flex flex-col items-center flex-shrink-0 min-w-[62px] gap-1.5 pb-2">
                                                <div className="w-11 h-11 rounded-2xl blinkit-shimmer"></div>
                                                <div className="h-3 w-10 rounded-full blinkit-shimmer"></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="max-w-7xl mx-auto mb-3 px-1 border-b border-gray-200/50 dark:border-gray-800/60 pb-1.5">
                                    <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide py-1">
                                        {categoryData.map((category) => {
                                            const isActive = normKey(category.name) === normKey(categoryFilter);
                                            return (
                                                <ShopCategoryItem
                                                    key={category.name}
                                                    category={category}
                                                    isActive={isActive}
                                                    dbCategories={dbCategories}
                                                    settings={settings}
                                                    language={language}
                                                    onClick={(e) => {
                                                        handleCategoryClick(category.name);
                                                        e.currentTarget.scrollIntoView({
                                                            behavior: 'smooth',
                                                            block: 'nearest',
                                                            inline: 'center'
                                                        });
                                                    }}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            )
                        )}
                    </div>
 
                    <AnimatePresence mode="wait">
                        {viewType === 'store' ? (
                            <motion.div
                                key="stores"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                {isStoresLoading ? (
                                    /* Store cards skeleton matching StoreCard layout */
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
                                        {[...Array(6)].map((_, i) => (
                                            <div
                                                key={i}
                                                className="group relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden aspect-[16/9] md:aspect-[3/2] lg:aspect-[4/3] w-full shadow-xs border border-gray-100 dark:border-gray-700/60 blinkit-shimmer"
                                            >
                                                <div className="absolute bottom-0 left-0 right-0 p-3 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                                    <div className="space-y-1.5 flex-1 pr-2">
                                                        <div className="h-4 w-32 rounded-md bg-gray-200 dark:bg-gray-700" />
                                                        <div className="h-3 w-24 rounded-md bg-gray-100 dark:bg-gray-600" />
                                                    </div>
                                                    <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : filteredStores.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
                                        {filteredStores.map((store) => (
                                            <StoreCard key={store._id || store.id} store={store} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="bg-white dark:bg-gray-800 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-sm">
                                            <Search className="text-gray-400 dark:text-gray-500" size={32} />
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t('No stores found')}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t('Try adjusting your search terms or category filter.')}</p>
                                        {(searchQuery.trim() || categoryFilter !== 'All') && (
                                            <button
                                                onClick={() => { setSearchQuery(''); setSearchParams({ category: 'All' }); }}
                                                className="px-6 py-2 bg-[#2E5A2E] dark:bg-[#CBF9B2] text-white dark:text-gray-900 rounded-xl font-bold text-sm active:scale-95 transition-all shadow-sm"
                                            >
                                                {t('Clear All')}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="services"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                {servicesLoading ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
                                        {[1, 2, 3, 4, 5, 6].map((i) => (
                                            <div
                                                key={i}
                                                className="group relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden aspect-[16/9] md:aspect-[3/2] lg:aspect-[4/3] w-full shadow-sm border border-gray-100/80 dark:border-gray-700/60"
                                            >
                                                <div className="absolute inset-0 blinkit-shimmer" />
                                                <div className="absolute top-3 left-3 z-10">
                                                    <div className="h-5 w-20 rounded-full bg-white/30 dark:bg-white/10 backdrop-blur-sm" />
                                                </div>
                                                <div className="absolute bottom-0 left-0 right-0 py-2 px-3.5 z-10 bg-white dark:bg-gray-800 border-t border-gray-50 dark:border-gray-700 flex items-center justify-between">
                                                    <div className="space-y-1.5 flex-1 min-w-0 pr-3">
                                                        <div className="h-4 w-36 rounded-md blinkit-shimmer" />
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="w-2.5 h-2.5 rounded-full blinkit-shimmer flex-shrink-0" />
                                                            <div className="h-3 w-28 rounded-md blinkit-shimmer" />
                                                        </div>
                                                    </div>
                                                    <div className="w-7 h-7 rounded-full blinkit-shimmer flex-shrink-0" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (() => {
                                    const filteredServices = services.filter(service =>
                                        service.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        service.category?.toLowerCase().includes(searchQuery.toLowerCase())
                                    );
 
                                    if (filteredServices.length === 0) {
                                        return (
                                            <div className="text-center py-12">
                                                <div className="bg-white dark:bg-gray-800 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-sm">
                                                    <Store className="text-gray-400 dark:text-gray-500" size={32} />
                                                </div>
                                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t('No services found')}</h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t('Try searching for something else.')}</p>
                                                {(searchQuery.trim() || categoryFilter !== 'All') && (
                                                    <button
                                                        onClick={() => { setSearchQuery(''); setSearchParams({ category: 'All' }); }}
                                                        className="px-6 py-2 bg-[#2E5A2E] dark:bg-[#CBF9B2] text-white dark:text-gray-900 rounded-xl font-bold text-sm active:scale-95 transition-all shadow-sm"
                                                    >
                                                        {t('Clear All')}
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    }
 
                                    return (
                                        <div className="grid grid-cols-1 gap-4">
                                            {filteredServices.map((service, index) => {
                                                const isOpen = isServiceOpen(service);
                                                const isClosed = !isOpen;
                                                return (
                                                    <div
                                                        key={service._id || index}
                                                        onClick={() => {
                                                            if (isClosed) {
                                                                alert(t('This service is currently closed. Please check back later.'));
                                                                return;
                                                            }
                                                            navigate(`/services?id=${service._id || service.id}`);
                                                        }}
                                                        className={`group flex items-center gap-4 bg-white dark:bg-gray-800 rounded-2xl p-3 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 dark:border-gray-700/50 ${isClosed ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                                    >
                                                        {/* Left Side: Square Image */}
                                                        <div className={`w-20 h-20 flex-shrink-0 relative ${isClosed ? 'opacity-60' : ''}`}>
                                                            <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                                                            <img
                                                                src={service.image || `${API_BASE_URL}/services/${service._id || service.id}/image`}
                                                                alt={service.name}
                                                                className={`absolute inset-0 w-full h-full object-cover rounded-xl z-10 ${isClosed ? '' : ''}`}
                                                                onError={(e) => { e.target.src = 'https://placehold.co/200x200?text=Service'; }}
                                                            />
                                                            {isClosed && (
                                                                <div className="absolute inset-0 z-20 bg-black/10 flex items-center justify-center rounded-xl backdrop-blur-[1px]">
                                                                    <span className="bg-gray-800 text-white px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest shadow-lg animate-in fade-in zoom-in-95 duration-500 border border-white/10">
                                                                        {t('Closed')}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Middle: Details */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-1.5 mb-1">
                                                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${isClosed ? 'bg-gray-100 text-gray-400' : 'bg-[#CBF9B2]/20 text-[#2E5A2E] dark:text-[#CBF9B2]'}`}>
                                                                    {service.category || t('Service')}
                                                                </span>
                                                            </div>
                                                            <h3 className={`text-gray-900 dark:text-white text-[15px] font-semibold truncate mb-1 ${isClosed ? 'opacity-60' : ''}`}>
                                                                {service.name}
                                                            </h3>
                                                            <div className="flex items-center gap-1 opacity-60">
                                                                <MapPin size={12} className="text-[#2E5A2E] dark:text-[#CBF9B2]" />
                                                                <p className="text-gray-600 dark:text-gray-400 text-[11px] truncate">
                                                                    {service.address || t('Available Locally')}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Right Side: Simple Arrow Icon */}
                                                        <div className={`flex-shrink-0 pr-1 ${isClosed ? 'opacity-0' : ''}`}>
                                                            <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-gray-400 group-hover:text-[#2E5A2E] dark:group-hover:text-[#CBF9B2] transition-colors">
                                                                <ArrowRight size={16} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })()}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                </div>
            
        </div>
    );
};

export default Shop;
