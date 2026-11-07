import React from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../utils/api';
import { useLanguage } from '../../context/LanguageContext';

const CategorySection = ({ categories = [], isLoading = false }) => {
    const { t, language } = useLanguage();
    const navigate = useNavigate();

    if (isLoading && categories.length === 0) {
        return (
            <section className="pt-2 pb-3 mt-1">
                <div className="flex justify-between items-center mb-3 px-4">
                    <div className="h-5 w-36 rounded-lg blinkit-shimmer"></div>
                </div>
                
                {/* 4 items per row shimmer */}
                <div className="grid grid-cols-4 gap-x-2 gap-y-4 px-3 sm:px-4 py-1.5">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div key={i} className="flex flex-col items-center gap-2">
                            <div className="w-18 h-18 sm:w-22 sm:h-22 rounded-2xl blinkit-shimmer"></div>
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
                <h2 className="text-lg font-extrabold text-gray-900 dark:text-white tracking-tight">
                    {t('Shop By Categories')}
                </h2>
            </div>

            {/* 4 per row grid - NO white bg card, BIG category images, thick text */}
            <div className="grid grid-cols-4 gap-x-2 gap-y-4 px-2.5 sm:px-4 py-1">
                {categories.map((category) => {
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
                        <div
                            key={category._id || category.id}
                            onClick={() => navigate(`/category/${encodeURIComponent(category.name)}`)}
                            className="w-full flex flex-col items-center gap-1 group cursor-pointer select-none active:scale-95 transition-transform"
                        >
                            {/* Big category image directly on background - NO white card box */}
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

                            {/* Normal / medium text — bold removed, with bottom padding for Tamil diacritics */}
                            <div className="flex flex-col items-center justify-center text-center w-full px-0.5 pb-1">
                                <span 
                                    className="text-[11px] sm:text-[12px] font-medium text-gray-700 dark:text-gray-200 leading-normal truncate block text-center w-full"
                                    title={mainPart}
                                >
                                    {mainPart}
                                </span>
                                {bracketPart && (
                                    <span 
                                        className="text-[9.5px] sm:text-[10px] font-normal text-gray-500 dark:text-gray-400 leading-normal pb-0.5 truncate block text-center w-full mt-0.5"
                                        title={bracketPart}
                                    >
                                        {bracketPart}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

export default React.memo(CategorySection);
