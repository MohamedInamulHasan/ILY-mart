import { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Search } from 'lucide-react';
import { API_BASE_URL } from '../utils/api';
import { useCart } from '../context/CartContext';
import PullToRefreshLayout from '../components/PullToRefreshLayout';

const Categories = () => {
    const { categories, products, loading } = useData();
    const { t, language } = useLanguage();
    const { cartCount } = useCart();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');

    const featuredCategories = useMemo(() => {
        // First filter by visibility
        let filtered = categories.filter(cat => !cat.isHidden);
        
        // Filter by product availability
        const productCategories = new Set(products.map(p => p.category?.toLowerCase()));
        filtered = filtered.filter(cat => productCategories.has(cat.name?.toLowerCase()));

        if (!searchQuery.trim()) return filtered;
        
        const q = searchQuery.toLowerCase();
        return filtered.filter(cat => 
            cat.name?.toLowerCase().includes(q) || 
            t(cat.name).toLowerCase().includes(q)
        );
    }, [categories, products, searchQuery, t]);

    return (
        <PullToRefreshLayout>
            <div className="min-h-screen bg-[#E8EAEF] dark:bg-gray-900 pb-20 transition-colors duration-200">
                {/* Premium Header Card (Matched to StoreProducts) */}
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
                            <div className="flex flex-col items-center text-center px-12 min-w-0">
                                <h1 className="text-gray-900 dark:text-gray-900 text-[16px] font-bold tracking-tight truncate w-full">{t('All Categories')}</h1>
                                <p className="text-[10px] text-gray-500 dark:text-gray-600 font-medium truncate w-full uppercase tracking-wider">{featuredCategories.length} {t('Categories Available')}</p>
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

                {/* Category Search (Matched to StoreProducts layout) */}
                <section className="px-4 relative z-20 mb-8">
                    <div className="flex items-center gap-3 max-w-2xl mx-auto relative">
                        <div className="relative group flex-1">
                            <form onSubmit={(e) => e.preventDefault()}>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={t('Search categories...')}
                                    className="w-full pl-12 pr-6 py-3.5 sm:py-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:outline-none focus-visible:outline-none ring-0 focus:ring-0 shadow-none transition-colors duration-200" style={{ outline: "none", WebkitTapHighlightColor: "transparent" }}
                                />
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#2E5A2E] transition-colors" size={20} />
                            </form>
                        </div>
                    </div>
                </section>

                <div className="max-w-7xl mx-auto px-4 pt-1 pb-4">
                    {loading.categories ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-x-2 gap-y-6">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                                <div key={i} className="flex flex-col items-center gap-2">
                                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse"></div>
                                    <div className="h-3 w-16 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
                                </div>
                            ))}
                        </div>
                    ) : featuredCategories.length > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-x-2 gap-y-8">
                            {featuredCategories.map((category) => (
                                <Link
                                    key={category._id || category.id}
                                    to={`/category/${category.name}`}
                                    className="flex flex-col items-center gap-2 group"
                                >
                                    <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 aspect-square rounded-2xl flex items-center justify-center bg-transparent transition-transform group-hover:scale-105">
                                        <img
                                            src={category.image || `${API_BASE_URL}/categories/${category._id || category.id}/image`}
                                            alt={category.name}
                                            className="w-full h-full object-contain rounded-2xl transition-transform"
                                            loading="lazy"
                                            onError={(e) => { e.target.onerror = null; e.target.style.opacity = '0'; }}
                                        />
                                    </div>
                                    <div className="flex flex-col items-center justify-center text-center w-full transition-colors text-gray-600 dark:text-gray-400">
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

                                            return (
                                                <>
                                                    <span className="text-xs md:text-sm font-semibold truncate w-full">{mainPart}</span>
                                                    {bracketPart && (
                                                        <span className="text-[10px] md:text-xs truncate w-full opacity-80 font-medium">{bracketPart}</span>
                                                    )}
                                                </>
                                            );
                                        })()}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
                             <div className="w-20 h-20 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                                <Search size={32} className="text-gray-400" />
                             </div>
                             <p className="text-gray-500 dark:text-gray-400 font-medium">{t('No categories found')}</p>
                        </div>
                    )}
                </div>
            </div>
        </PullToRefreshLayout>
    );
};

export default Categories;
