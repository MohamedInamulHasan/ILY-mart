import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useProducts } from '../hooks/queries/useProducts';
import { ArrowLeft, ShoppingCart, Search, MapPin, Store, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';
import SortDropdown from '../components/SortDropdown';
import { isStoreOpen, isProductScheduled } from '../utils/storeHelpers';
import PullToRefreshLayout from '../components/PullToRefreshLayout';
import { API_BASE_URL } from '../utils/api';
import { groupProducts } from '../utils/productGrouping';

const CategoryProducts = () => {
    const { categoryName } = useParams();
    const navigate = useNavigate();
    const { stores, globalSortOrder, setGlobalSortOrder } = useData();
    const { t, language } = useLanguage();
    const { data: rawProductsInCategory = [], isLoading } = useProducts({ category: categoryName });
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSubcategory, setSelectedSubcategory] = useState(null);

    // Normalize for consistent comparison
    const normalizeSub = (val) => String(val || '').toLowerCase().trim();

    // 1. Initial Filtering (Search + Category)
    const categoryProducts = useMemo(() => {
        const products = Array.isArray(rawProductsInCategory) ? rawProductsInCategory : (rawProductsInCategory?.data || []);
        return products.filter(p => {
            const matchesSearch = p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.title_ta?.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesSearch;
        });
    }, [rawProductsInCategory, searchQuery]);

    // 2. Filter only orphan products (STRICTLY WITHOUT store association)
    const orphanProducts = useMemo(() => {
        return categoryProducts.filter(product => {
            // Check all possible ways a store association might be stored
            const storeId = product.storeId?._id || product.storeId;
            const hasStoreId = storeId && storeId !== '' && storeId !== 'null';
            const hasStoreName = product.storeName || (product.storeId && typeof product.storeId === 'object' && product.storeId.name);
            
            return !hasStoreId && !hasStoreName;
        });
    }, [categoryProducts]);

    // 3. Identify Subcategories from AVAILABLE products
    const subcategories = useMemo(() => {
        const subs = new Set();
        orphanProducts.forEach(p => {
            if (p.subcategory) {
                if (Array.isArray(p.subcategory)) {
                    p.subcategory.forEach(s => {
                        if (s && String(s).trim()) subs.add(String(s).trim());
                    });
                } else if (String(p.subcategory).trim()) {
                    subs.add(String(p.subcategory).trim());
                }
            }
        });
        return Array.from(subs).sort();
    }, [orphanProducts]);

    // 4. Group and Sort the filtered products
    const sections = useMemo(() => {
        if (orphanProducts.length === 0) return [];
        
        let sorted = groupProducts(orphanProducts, stores, { exactMatch: true });
        
        // Filter by selected subcategory if one is active
        if (selectedSubcategory) {
            const normalizedSelected = normalizeSub(selectedSubcategory);
            sorted = sorted.filter(p => {
                const rawSubs = Array.isArray(p.subcategory) ? p.subcategory : (p.subcategory ? [p.subcategory] : []);
                return rawSubs.some(sub => normalizeSub(sub) === normalizedSelected);
            });
        }

        // Apply price sorting
        if (globalSortOrder !== 'none') {
            sorted.sort((a, b) => {
                const priceA = Number(a.price || 0);
                const priceB = Number(b.price || 0);
                return globalSortOrder === 'lowToHigh' ? priceA - priceB : priceB - priceA;
            });
        }

        return [{
            id: 'orphan_list',
            name: '', // Hide "Other Stores" header as requested
            type: 'other',
            products: sorted
        }];
    }, [orphanProducts, globalSortOrder, selectedSubcategory, stores]);

    const displayProducts = orphanProducts;

    useEffect(() => {
        const activePill = document.getElementById('active-cat-sub-pill');
        if (activePill) {
            activePill.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }, [selectedSubcategory]);

    const { cartCount } = useCart();

    return (
        <PullToRefreshLayout>
            <div className="flex-1 bg-[#E8EAEF] dark:bg-gray-900 pb-8 transition-colors duration-200 w-full relative">
                {/* Premium Header Card */}
                <div className="w-full bg-[#CBF9B2] dark:bg-[#CBF9B2] rounded-b-[2.5rem] px-4 pt-4 pb-4 shadow-sm relative overflow-hidden mb-3.5 sm:mb-4">
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/30 dark:bg-[#2E5A2E]/20 rounded-full blur-3xl pointer-events-none"></div>
                    
                    <div className="relative z-10">
                        <div className="w-full px-4 relative flex items-center justify-center min-h-[42px]">
                            <div className="absolute left-2 top-1/2 -translate-y-1/2">
                                <button
                                    onClick={() => navigate(-1)}
                                    className="w-[42px] h-[42px] flex items-center justify-center bg-white dark:bg-white/80 rounded-full text-gray-900 dark:text-gray-900 transition-transform active:scale-95 shadow-sm border border-gray-100/50 dark:border-gray-200/50"
                                >
                                    <ArrowLeft size={22} />
                                </button>
                            </div>
                            <div className="flex flex-col items-center text-center px-14 min-w-0">
                                <h1 className="text-gray-900 dark:text-gray-900 text-[16px] font-bold tracking-tight truncate w-full leading-tight">
                                    {(() => {
                                        const fullName = t(categoryName);
                                        const bracketIndex = fullName.indexOf('(');
                                        if (bracketIndex !== -1) {
                                            const mainName = fullName.substring(0, bracketIndex).trim();
                                            const bracketPart = fullName.substring(bracketIndex).trim();
                                            return `${mainName} ${bracketPart}`;
                                        }
                                        return fullName;
                                    })()}
                                </h1>
                                <p className="text-[11px] text-gray-700 dark:text-gray-700 font-semibold truncate w-full mt-0.5">{displayProducts.length} {t('Products Available')}</p>
                            </div>
                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                <Link 
                                    to="/cart"
                                    className="w-[42px] h-[42px] flex items-center justify-center bg-white dark:bg-white/80 rounded-full text-gray-900 dark:text-gray-900 transition-transform active:scale-95 shadow-sm border border-gray-100/50 dark:border-gray-200/50 relative"
                                >
                                    <ShoppingCart size={22} className="text-[#2E5A2E] dark:text-[#2E5A2E]" />
                                    {cartCount > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center shadow-sm border-2 border-white dark:border-gray-800">
                                            {cartCount}
                                        </span>
                                    )}
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-1 pb-6">
                    <div className="max-w-7xl mx-auto px-4">
                        <div className="flex items-center gap-2.5 sm:gap-3 relative z-[100] mb-3.5 sm:mb-4">
                            <div className="relative flex-1 group">
                                <form onSubmit={(e) => e.preventDefault()}>
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder={t('Search products...')}
                                        className="w-full pl-11 sm:pl-12 pr-11 py-3.5 sm:py-4 text-[14.5px] sm:text-[15.5px] font-medium rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:outline-none focus-visible:outline-none ring-0 focus:ring-0 focus-visible:ring-0 shadow-none transition-colors duration-200"
                                    />
                                    <Search className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#2E5A2E] stroke-[2.2] transition-colors" size={20} />
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
                            <SortDropdown currentSort={globalSortOrder} onSortChange={setGlobalSortOrder} />
                        </div>

                        {/* Subcategory Navigation Bar */}
                        {subcategories.length > 0 && (
                            <div className="max-w-7xl mx-auto px-4 mb-4">
                                <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide border-b border-gray-100/50">
                                    <button
                                        onClick={() => setSelectedSubcategory(null)}
                                        className={`pb-3 text-sm font-bold transition-all relative whitespace-nowrap ${
                                            !selectedSubcategory 
                                            ? 'text-black dark:text-white' 
                                            : 'text-gray-400 hover:text-black dark:hover:text-white'
                                        }`}
                                    >
                                        {t('All')}
                                        {!selectedSubcategory && (
                                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black dark:bg-white rounded-full"></div>
                                        )}
                                    </button>
                                    
                                    {subcategories.map((sub) => (
                                        <button
                                            key={sub}
                                            id={selectedSubcategory === sub ? 'active-cat-sub-pill' : undefined}
                                            onClick={() => setSelectedSubcategory(sub)}
                                            className={`pb-3 text-sm font-bold transition-all relative whitespace-nowrap uppercase tracking-wide ${
                                                selectedSubcategory === sub 
                                                ? 'text-black dark:text-white' 
                                                : 'text-gray-400 hover:text-black dark:hover:text-white'
                                            }`}
                                        >
                                            {t(sub)}
                                            {selectedSubcategory === sub && (
                                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black dark:bg-white rounded-full"></div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Product Grid */}
                        {isLoading ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                    <div key={i} className="aspect-[3/4] bg-white dark:bg-gray-800 rounded-2xl p-3 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col space-y-3">
                                        <div className="aspect-square w-full rounded-xl blinkit-shimmer"></div>
                                        <div className="h-3.5 w-full rounded-lg blinkit-shimmer"></div>
                                        <div className="flex items-center justify-between pt-1">
                                            <div className="h-5 w-12 rounded-md blinkit-shimmer"></div>
                                            <div className="h-8 w-8 rounded-full blinkit-shimmer"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : sections.length > 0 ? (
                            <div className="space-y-12">
                                {sections.map((section) => (
                                    <div key={section.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                            {section.products.map((product) => (
                                                <ProductCard 
                                                    key={product._id || product.id} 
                                                    product={product} 
                                                    showCartControls={true}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 flex flex-col items-center gap-4">
                                <div className="w-20 h-20 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-sm">
                                    <Search size={32} className="text-gray-300" />
                                </div>
                                <p className="text-gray-500 dark:text-gray-400 font-medium">
                                    {t('No general products found in this category')}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PullToRefreshLayout>
    );
};

export default CategoryProducts;
