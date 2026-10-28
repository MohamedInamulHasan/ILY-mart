import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useProducts } from '../hooks/queries/useProducts';
import { ArrowLeft, ShoppingCart, Search, MapPin, Store } from 'lucide-react';
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
            <div className="min-h-screen bg-[#E8EAEF] dark:bg-gray-900 pb-20 transition-colors duration-200">
                {/* Premium Header Card */}
                <div className="w-full bg-[#CBF9B2] dark:bg-[#CBF9B2] rounded-b-[2.5rem] px-4 pt-4 pb-4 shadow-sm relative overflow-hidden mb-8">
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/30 dark:bg-[#2E5A2E]/20 rounded-full blur-3xl pointer-events-none"></div>
                    
                    <div className="relative z-10">
                        <div className="max-w-2xl mx-auto px-2 relative flex items-center justify-center min-h-[42px]">
                            <button
                                onClick={() => navigate(-1)}
                                className="absolute left-4 w-10 h-10 flex items-center justify-center bg-white dark:bg-white/80 rounded-full text-gray-900 dark:text-gray-900 transition-transform active:scale-95 shadow-sm border border-gray-100/50 dark:border-gray-200/50 flex-shrink-0 z-10"
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <div className="flex flex-col items-center text-center px-16 min-w-0">
                                <h1 className="text-gray-900 dark:text-gray-900 text-[18px] font-bold tracking-tight truncate w-full">
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
                                <p className="text-[10px] text-gray-500 dark:text-gray-600 font-medium truncate w-full uppercase tracking-wider">{displayProducts.length} {t('Products Available')}</p>
                            </div>
                            <Link 
                                to="/cart"
                                className="absolute right-4 w-10 h-10 flex items-center justify-center bg-white dark:bg-white/80 rounded-full text-gray-900 dark:text-gray-900 transition-transform active:scale-95 shadow-sm border border-gray-100/50 dark:border-gray-200/50 flex-shrink-0 z-10"
                            >
                                <ShoppingCart size={20} className="text-[#2E5A2E] dark:text-[#2E5A2E]" />
                                {cartCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center border border-white dark:border-gray-800">
                                        {cartCount}
                                    </span>
                                )}
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="pt-1 pb-6">
                    <div className="max-w-7xl mx-auto px-4">
                        <div className="flex items-center gap-3 relative z-[100] mb-8">
                            <div className="relative flex-1 group">
                                <form onSubmit={(e) => e.preventDefault()}>
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder={t('Search products...')}
                                        className="w-full pl-12 pr-4 py-4 rounded-full border-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:outline-none transition-all duration-300"
                                    />
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#2E5A2E] transition-colors" size={20} />
                                </form>
                            </div>
                            <SortDropdown currentSort={globalSortOrder} onSortChange={setGlobalSortOrder} />
                        </div>

                        {/* Subcategory Navigation Bar */}
                        {subcategories.length > 0 && (
                            <div className="max-w-7xl mx-auto px-4 mb-8">
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
