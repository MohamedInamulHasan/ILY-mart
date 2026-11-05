import { getThumbnailUrl } from '../../utils/imageOptimizer';
import React, { useState } from 'react';
import { API_BASE_URL } from '../../utils/api';
import { useLanguage } from '../../context/LanguageContext';
import { useData } from '../../context/DataContext';

const CategorySection = ({ categories = [], isLoading = false, selectedCategory = 'All', onSelectCategory }) => {
    const { t, language } = useLanguage();
    const { settings } = useData();
    const [isExpanded, setIsExpanded] = useState(false);
    const allCategoryImage = settings?.allCategoryImage || '';
    const allCategoryName = settings?.allCategoryName || '';

    if (isLoading && categories.length === 0) {
        return (
            <section className="pt-2 pb-3.5 mt-1 sm:mt-1.5">
                <div className="flex justify-between items-center mb-3 px-4">
                    <div className="h-5 w-36 rounded-lg blinkit-shimmer"></div>
                    <div className="h-4 w-12 rounded-full blinkit-shimmer"></div>
                </div>
                
                {/* Horizontal Category Items list - Blinkit shimmer */}
                <div className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide py-1.5 px-4">
                    {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                        <div key={i} className="flex flex-col items-center gap-2 min-w-[72px] md:min-w-[88px]">
                            {/* Circle shape placeholder with Blinkit shimmer */}
                            <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-2xl blinkit-shimmer"></div>
                            {/* Text label placeholder with Blinkit shimmer */}
                            <div className="h-3 w-12 rounded-full blinkit-shimmer"></div>
                        </div>
                    ))}
                </div>
            </section>
        );
    }

    if (categories.length === 0) return null;

    return (
        <section className="pt-2 pb-3.5 mt-1 sm:mt-1.5">
            <div className="flex justify-between items-center mb-3 px-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    {t('Shop By Categories')}
                </h2>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-xs font-semibold text-[#2E5A2E] dark:text-[#CBF9B2] hover:opacity-80 transition-all"
                >
                    {isExpanded ? t('Show Less') : t('See All')}
                </button>
            </div>

            <div className={isExpanded
                ? "grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-x-2 gap-y-6 px-4 py-2"
                : "flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide py-1.5 px-4 scroll-smooth"
            }>

                {/* All Categories Option — styled like other category items */}
                <div
                    onClick={() => onSelectCategory('All')}
                    className={`${isExpanded ? 'w-full' : 'shrink-0 min-w-[84px] sm:min-w-[96px] md:min-w-[110px]'} flex flex-col items-center gap-1.5 md:gap-2 group cursor-pointer select-none transition-all duration-200 ${selectedCategory === 'All' ? 'scale-105 filter brightness-125 contrast-105' : 'scale-100 opacity-100 hover:scale-105'}`}
                >
                    <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 aspect-square rounded-2xl flex items-center justify-center bg-transparent transition-transform">
                        {allCategoryImage ? (
                            <img
                                src={allCategoryImage}
                                alt="All Categories"
                                className="w-full h-full object-contain rounded-2xl transition-transform"
                            />
                        ) : (
                            <img
                                src="https://cdn-icons-png.flaticon.com/512/2311/2311524.png"
                                alt="All Categories"
                                className="w-full h-full object-contain transition-transform p-1.5"
                            />
                        )}
                    </div>
                    {(() => {
                        const fullTitle = allCategoryName || t('All');
                        let mainPart = fullTitle;
                        let bracketPart = null;
                        const bracketIndex = fullTitle.indexOf('(');
                        if (bracketIndex !== -1) {
                            const part1 = fullTitle.substring(0, bracketIndex).trim();
                            const part2 = fullTitle.substring(bracketIndex).replace(/^\(/, '').replace(/\)$/, '').trim();
                            const isPart1Tamil = /[\u0B80-\u0BFF]/.test(part1);
                            const isPart2Tamil = /[\u0B80-\u0BFF]/.test(part2);
                            let tamStr = '', engStr = '';
                            if (isPart1Tamil && !isPart2Tamil) { tamStr = part1; engStr = part2; }
                            else if (isPart2Tamil && !isPart1Tamil) { tamStr = part2; engStr = part1; }
                            else { engStr = part1; tamStr = part2; }
                            if (language === 'ta') {
                                mainPart = tamStr || engStr;
                                bracketPart = tamStr && engStr ? `(${engStr})` : null;
                            } else {
                                mainPart = engStr || tamStr;
                                bracketPart = engStr && tamStr ? `(${tamStr})` : null;
                            }
                        }
                        return (
                            <div className={`flex flex-col items-center justify-center text-center w-full max-w-[88px] sm:max-w-[100px] md:max-w-[116px] transition-colors ${selectedCategory === 'All' ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                                <span className={`text-[11px] md:text-xs leading-tight w-full whitespace-nowrap overflow-hidden block text-center ${selectedCategory === 'All' ? 'font-bold' : 'font-medium'}`} title={mainPart}>
                                    {mainPart}
                                </span>
                                {bracketPart && (
                                    <span className={`text-[9.5px] md:text-[10.5px] leading-tight w-full line-clamp-1 block text-center mt-0.5 ${selectedCategory === 'All' ? 'font-semibold' : 'font-normal'}`} title={bracketPart}>
                                        {bracketPart}
                                    </span>
                                )}
                            </div>
                        );
                    })()}
                </div>

                {categories.map((category) => {
                    const isSelected = selectedCategory === category.name;
                    return (
                        <div
                            key={category._id || category.id}
                            onClick={() => onSelectCategory(category.name)}
                            className={`${isExpanded ? 'w-full' : 'shrink-0 min-w-[84px] sm:min-w-[96px] md:min-w-[110px]'} flex flex-col items-center gap-1.5 md:gap-2 group cursor-pointer select-none transition-all duration-200 ${isSelected ? 'scale-105 filter brightness-125 contrast-105' : 'scale-100 opacity-100 hover:scale-105'}`}
                        >
                            <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 aspect-square rounded-2xl flex items-center justify-center bg-transparent transition-transform">
                                <img
                                    src={`${category.image || `${API_BASE_URL}/categories/${category._id || category.id}/image`}?t=${Math.floor((category.updatedAt ? new Date(category.updatedAt).getTime() : Date.now()) / 60000)}`}
                                    alt={category.name}
                                    className="w-full h-full object-contain rounded-2xl transition-transform" style={{ mixBlendMode: "multiply" }}
                                    loading="lazy" decoding="async"
                                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://cdn-icons-png.flaticon.com/512/2311/2311524.png'; }}
                                />
                            </div>
                            <div className={`flex flex-col items-center justify-center text-center w-full max-w-[88px] sm:max-w-[100px] md:max-w-[116px] transition-colors ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                                {(() => {
                                    const fullTitle = t(category.name);
                                    let mainPart = fullTitle;
                                    let bracketPart = null;

                                    const bracketIndex = fullTitle.indexOf('(');
                                    if (bracketIndex !== -1) {
                                        const part1 = fullTitle.substring(0, bracketIndex).trim();
                                        const part2 = fullTitle.substring(bracketIndex).trim();
                                        const cleanPart2 = part2.replace(/^\(/, '').replace(/\)$/, '').trim();

                                        const isPart1Tamil = /[\u0B80-\u0BFF]/.test(part1);
                                        const isPart2Tamil = /[\u0B80-\u0BFF]/.test(cleanPart2);

                                        let tamStr = '';
                                        let engStr = '';

                                        if (isPart1Tamil && !isPart2Tamil) {
                                            tamStr = part1;
                                            engStr = cleanPart2;
                                        } else if (isPart2Tamil && !isPart1Tamil) {
                                            tamStr = cleanPart2;
                                            engStr = part1;
                                        } else {
                                            engStr = part1;
                                            tamStr = cleanPart2;
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
                                            <span 
                                                className={`text-[11px] md:text-xs leading-tight w-full whitespace-nowrap overflow-hidden block text-center ${isSelected ? 'font-bold' : 'font-medium'}`}
                                                title={mainPart}
                                            >
                                                {mainPart}
                                            </span>
                                            {bracketPart && (
                                                <span 
                                                    className={`text-[9.5px] md:text-[10.5px] leading-tight w-full line-clamp-1 block text-center mt-0.5 ${isSelected ? 'font-semibold' : 'font-normal'}`}
                                                    title={bracketPart}
                                                >
                                                    {bracketPart}
                                                </span>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

export default React.memo(CategorySection);
