import { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { MapPin, Search, Star, Clock, Phone, Store, Wrench, ArrowRight, X } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { isStoreOpen, formatTime12h } from '../utils/storeHelpers';
import PullToRefreshLayout from '../components/PullToRefreshLayout';
import StoreCard from '../components/StoreCard';
import { API_BASE_URL } from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import HomeHeader from '../components/home/HomeHeader';

const Shop = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [viewType, setViewType] = useState('store'); // 'store' or 'service'
    const [searchParams, setSearchParams] = useSearchParams();
    const { stores, categories: dbCategories, loading, initialLoading } = useData();
    const services = [];
    const servicesLoading = false;
    const { t, language } = useLanguage();

    // Create a Set of valid category names for filtering store tags
    const validCategoryNames = useMemo(() => new Set((dbCategories || []).map(c => c.name.toLowerCase())), [dbCategories]);
    const navigate = useNavigate();

    const categoryFilter = searchParams.get('category') || 'All';

    // Create categories array with "All" option first, then add categories from database
    const categoriesList = [
        { name: 'All' },
        ...(dbCategories || []).map(cat => ({ name: cat.name }))
    ];

    // Safety check for stores array to prevent crash if undefined & filter active only
    const safeStores = useMemo(() => (stores || []).filter(s => s.isActive !== false), [stores]);

    // Calculate store counts per category
    const categoryData = useMemo(() => {
        const counts = {};
        safeStores.forEach(store => {
            const types = Array.isArray(store.type) ? store.type : (store.type ? [store.type] : []);
            types.forEach(t => {
                const typeName = t.toLowerCase();
                counts[typeName] = (counts[typeName] || 0) + 1;
            });
        });

        return categoriesList.map(cat => {
            const name = cat.name;
            let count = 0;
            if (name === 'All') {
                count = safeStores.length;
            } else {
                count = counts[name.toLowerCase()] || 0;
            }
            return { name, count };
        }).filter(cat => cat.count > 0);
    }, [safeStores, dbCategories]);

    const filteredStores = safeStores.filter(store => {
        const matchesSearch = store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (store.address && store.address.toLowerCase().includes(searchQuery.toLowerCase()));
        
        // Flexible matching for category/type (Handle Array or String)
        const matchesCategory = categoryFilter === 'All' ||
            (Array.isArray(store.type)
                ? store.type.some(t => t.toLowerCase() === categoryFilter.toLowerCase())
                : store.type && store.type.toLowerCase() === categoryFilter.toLowerCase());

        return matchesSearch && matchesCategory;
    }).sort((a, b) => {
        const isOpenA = isStoreOpen(a);
        const isOpenB = isStoreOpen(b);
        // Open stores (true) come first (-1), Closed (false) come last (1)
        if (isOpenA === isOpenB) return 0;
        return isOpenA ? -1 : 1;
    });

    const handleCategoryClick = (categoryName) => {
        setSearchParams({ category: categoryName });
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
        <div className="min-h-screen bg-[#E8EAEF] dark:bg-gray-900 pb-24 transition-colors duration-200">
            {/* Premium Light Green Header Card / Dark Mode Adjusted */}
            <div className="fixed top-0 left-0 right-0 z-50 w-full bg-[#CBF9B2] dark:bg-[#CBF9B2] rounded-b-[2.5rem] px-2 pt-2 pb-3 shadow-sm overflow-hidden">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/30 dark:bg-[#CBF9B2]/20 rounded-full blur-3xl pointer-events-none"></div>
                <div className="relative z-10">
                    <HomeHeader />
                </div>
            </div>
            
            <PullToRefreshLayout>
                <div className="pt-[95px]">
                <div className="max-w-7xl mx-auto px-4 mt-2">
                    <div className="mb-2">
                        {/* Removed Store/Service toggle for a cleaner experience */}
                        <div className="relative group mb-8">
                            <input
                                type="text"
                                placeholder={t('Search by store name or location...')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-6 py-4 rounded-full border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none transition-all duration-300 shadow-sm"
                            />
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#2E5A2E] dark:group-focus-within:text-[#CBF9B2] transition-colors" size={20} />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-red-500 transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            )}

                            {/* Search Results Dropdown (Wider/Full-container width) */}
                            {searchQuery.trim() && viewType === 'store' && (
                                <div className="absolute top-[calc(100%+12px)] left-0 right-0 bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 max-h-96 overflow-y-auto z-[200] animate-in fade-in slide-in-from-top-2 duration-300 shadow-sm">
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
                                                        <div className={`w-12 h-12 rounded-[1rem] bg-gray-50 dark:bg-gray-700 p-1 flex items-center justify-center overflow-hidden border border-gray-100 dark:border-gray-600 ${isClosed ? 'blur-[1px]' : ''}`}>
                                                            <img
                                                                src={store.image || `${API_BASE_URL}/stores/${storeId}/image`}
                                                                onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/100x100?text=Store'; }}
                                                                alt={store.name}
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
                                <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 max-h-96 overflow-y-auto z-[200] animate-in fade-in slide-in-from-top-2 duration-300 shadow-sm">
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
                                                        <div className={`w-12 h-12 rounded-[1rem] bg-gray-50 dark:bg-gray-700 p-1 flex items-center justify-center overflow-hidden border border-gray-100 dark:border-gray-600 ${isClosed ? 'blur-[1px] grayscale' : ''}`}>
                                                            <img
                                                                src={service.image || `${API_BASE_URL}/services/${serviceId}/image`}
                                                                onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/100x100?text=Service'; }}
                                                                alt={service.name}
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


                        {/* Category Tabs - Only show for stores */}
                        {viewType === 'store' && (
                            isCategoriesLoading ? (
                                <div className="max-w-7xl mx-auto mb-6">
                                    <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide border-b border-gray-100/50 pb-2">
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <div key={i} className="flex-shrink-0 bg-gray-200 dark:bg-gray-700 animate-pulse w-16 h-4 rounded"></div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="max-w-7xl mx-auto mb-6 mt-2">
                                    <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide border-b border-gray-100/50">
                                        {categoryData.map((category) => {
                                            const isActive = category.name === categoryFilter;
                                            return (
                                                <button
                                                    key={category.name}
                                                    id={isActive ? "active-category-pill" : undefined}
                                                    onClick={() => {
                                                        handleCategoryClick(category.name);
                                                        document.getElementById("active-category-pill")?.scrollIntoView({
                                                            behavior: 'smooth',
                                                            block: 'nearest',
                                                            inline: 'center'
                                                        });
                                                    }}
                                                    className={`pb-3 text-sm font-medium transition-all relative whitespace-nowrap ${isActive
                                                        ? 'text-black dark:text-white'
                                                        : 'text-gray-400 hover:text-black dark:hover:text-white'
                                                        }`}
                                                >
                                                    {(() => {
                                                        const fullTitle = t(category.name);
                                                        let mainPart = fullTitle;
                                                        let bracketPart = null;

                                                        const bracketIndex = fullTitle.indexOf('(');
                                                        if (bracketIndex !== -1) {
                                                            const part1 = fullTitle.substring(0, bracketIndex).trim();
                                                            const part2 = fullTitle.substring(bracketIndex + 1, fullTitle.length - 1).trim();
                                                            
                                                            const isPart1Tamil = /[\u0B80-\u0BFF]/.test(part1);
                                                            const isPart2Tamil = /[\u0B80-\u0BFF]/.test(part2);
                                                            
                                                            let tamStr = '';
                                                            let engStr = '';
                                                            
                                                            if (isPart1Tamil && !isPart2Tamil) {
                                                                tamStr = part1;
                                                                engStr = part2;
                                                            } else if (isPart2Tamil && !isPart1Tamil) {
                                                                tamStr = part2;
                                                                engStr = part1;
                                                            } else {
                                                                engStr = part1;
                                                                tamStr = part2;
                                                            }

                                                            if (language === 'ta') {
                                                                mainPart = tamStr || engStr;
                                                                bracketPart = tamStr && engStr ? `(${engStr})` : null;
                                                            } else {
                                                                mainPart = engStr || tamStr;
                                                                bracketPart = engStr && tamStr ? `(${tamStr})` : null;
                                                            }
                                                        }

                                                        return bracketPart ? `${mainPart} ${bracketPart}` : mainPart;
                                                    })()}
                                                    {isActive && (
                                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black dark:bg-white rounded-full"></div>
                                                    )}
                                                </button>
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
                                    // Blinkit style store card skeleton
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                                        {[1, 2, 3, 4, 5, 6].map((i) => (
                                            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-3 shadow-sm border border-gray-100 dark:border-gray-700/50 flex flex-col space-y-3">
                                                <div className="aspect-[16/9] w-full rounded-xl blinkit-shimmer"></div>
                                                <div className="flex items-center justify-between pt-1">
                                                    <div className="space-y-1.5 flex-1 pr-3">
                                                        <div className="h-4 w-3/4 rounded-lg blinkit-shimmer"></div>
                                                        <div className="h-3 w-1/2 rounded-md blinkit-shimmer"></div>
                                                    </div>
                                                    <div className="w-8 h-8 rounded-full blinkit-shimmer flex-shrink-0"></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : filteredStores.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
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
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
                                        {[1, 2, 3, 4, 5, 6].map((i) => (
                                            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl aspect-[16/9] md:aspect-[3/2] lg:aspect-[4/3] w-full shadow-sm border border-gray-100 dark:border-gray-700/50 overflow-hidden animate-pulse" />
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
                                                                    <span className="bg-gray-800 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg animate-in fade-in zoom-in-95 duration-500">
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
            </PullToRefreshLayout>
        </div>
    );
};

export default Shop;
