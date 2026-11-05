import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { isStoreOpen, isProductScheduled } from '../../utils/storeHelpers';
import { groupProducts } from '../../utils/productGrouping';
import { useData } from '../../context/DataContext';
import ProductCard from '../ProductCard';
import { useState, useEffect, useMemo } from 'react';

const StoreSection = ({ section, products: rawProducts = [], singleStore = false, selectedCategory = 'All' }) => {
    const { t } = useLanguage();
    const { stores: contextStores, globalSortOrder } = useData();
    const [cycleIndex, setCycleIndex] = useState(0);

    // Helper to normalize strings for robust comparison
    const normalize = (str) => String(str || '').toLowerCase().replace(/\s+/g, ' ').trim();

    // 0. Filter products at the source if a category is selected
    const products = useMemo(() => {
        if (!selectedCategory || selectedCategory === 'All') return rawProducts;
        const normalizedSelected = normalize(selectedCategory);
        return rawProducts.filter(p => normalize(p.category) === normalizedSelected);
    }, [rawProducts, selectedCategory]);

    // 1. Group products by their category/subcategory
    const productsByCategory = useMemo(() => {
        const grouped = products.reduce((acc, p) => {
            const cat = p.category || 'Other';
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(p);
            return acc;
        }, {});

        // Sort categories by product count (most products first)
        return Object.entries(grouped)
            .sort((a, b) => b[1].length - a[1].length)
            .slice(0, 3); // Take top 3
    }, [products]);

    // 2. Auto-cycle timer (10 seconds)
    useEffect(() => {
        if (productsByCategory.length === 0) return;
        const interval = setInterval(() => {
            setCycleIndex(prev => prev + 1);
        }, 60000);
        return () => clearInterval(interval);
    }, [productsByCategory]);

    if (products.length === 0) return null;

    const navigateTo = section.type === 'store' 
        ? `/store/${section.id}` 
        : `/category/${encodeURIComponent(section.name)}`;

    const isOpen = section.type === 'store' ? isStoreOpen(section.data) : true;

    // 3. Logic to pick exactly 7 cards based on 2-3-2 or fallback
    const displayProducts = (() => {
        const slots = [];
        const numCats = productsByCategory.length;
        
        if (numCats === 0) return [];

        let distribution = [7];
        if (numCats === 3) distribution = [2, 3, 2];
        else if (numCats === 2) distribution = [4, 3];

        productsByCategory.forEach(([catName, catProducts], i) => {
            const slotCount = distribution[i];
            const groupedInCat = groupProducts(catProducts, contextStores, { forcedStoreId: section.type === 'store' ? section.id : null });
            
            // Apply global price sorting
            const sortedInCat = [...groupedInCat].sort((a, b) => {
                const priceA = Number(a.price || 0);
                const priceB = Number(b.price || 0);
                if (globalSortOrder === 'lowToHigh') return priceA - priceB;
                if (globalSortOrder === 'highToLow') return priceB - priceA;
                return 0;
            });

            // Pick unique products starting from an offset determined by cycleIndex
            const takeCount = Math.min(slotCount, sortedInCat.length);
            for (let j = 0; j < takeCount; j++) {
                const productIndex = (cycleIndex + j) % sortedInCat.length;
                slots.push(sortedInCat[productIndex]);
            }
        });

        // Put timing finished (not currently scheduled) products last
        return slots.sort((a, b) => {
            const isAScheduled = a.isGroup ? true : isProductScheduled(a);
            const isBScheduled = b.isGroup ? true : isProductScheduled(b);
            if (isAScheduled && !isBScheduled) return -1;
            if (!isAScheduled && isBScheduled) return 1;
            return 0;
        });
    })();

    const singleStoreProducts = useMemo(() => {
        if (!singleStore) return [];
        const grouped = groupProducts(products, contextStores, { forcedStoreId: section.type === 'store' ? section.id : null });
        
        // Put timing finished products last in single store view too
        return [...grouped].sort((a, b) => {
            const isAScheduled = a.isGroup ? true : isProductScheduled(a);
            const isBScheduled = b.isGroup ? true : isProductScheduled(b);
            if (isAScheduled && !isBScheduled) return -1;
            if (!isAScheduled && isBScheduled) return 1;
            return 0;
        });
    }, [products, singleStore, contextStores, section.type, section.id]);

    return (
        <section className={`px-4 pt-2.5 pb-4 md:py-5 dark:bg-gray-900 transition-opacity duration-300 ${!isOpen ? 'opacity-80' : ''}`}>
            {/* Header */}
            <div className="flex justify-between items-end mb-3.5 sm:mb-4 px-1">
                <div className="flex flex-col min-w-0 flex-1 pr-3">
                    <div className="flex items-center gap-2">
                        {section.id === 'free_delivery' ? (
                            <h2 className="text-[16px] sm:text-xl md:text-2xl font-bold leading-tight animate-text-shine uppercase tracking-wider">
                                {t(section.name)}
                            </h2>
                        ) : (
                            <h2 className="text-[16px] sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white leading-tight truncate w-full" title={t(section.name)}>
                                {t(section.name)}
                            </h2>
                        )}
                    </div>
                    {section.address && (
                        <p className="text-[11px] text-gray-400 font-medium mt-1 truncate w-full">
                            {section.address}
                        </p>
                    )}
                    {section.slogan && (
                        <p className="text-[11px] text-gray-400 font-medium mt-1 truncate w-full">
                            {t(section.slogan)}
                        </p>
                    )}
                </div>
                {section.id !== 'free_delivery' && (
                    isOpen ? (
                        <Link to={navigateTo} className="text-xs font-semibold text-[#2E5A2E] dark:text-[#CBF9B2] hover:opacity-70 transition-all shrink-0">
                            {t('See All')}
                        </Link>
                    ) : (
                        <span className="text-xs font-semibold text-gray-400 dark:text-gray-650 cursor-not-allowed select-none shrink-0">
                            {t('See All')}
                        </span>
                    )
                )}
            </div>

            {singleStore ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 px-1">
                    {singleStoreProducts.map((product, idx) => (
                        <div
                            key={`${product._id || product.id}-${idx}`}
                            className="animate-in fade-in duration-300"
                        >
                            <ProductCard
                                product={product}
                                showCartControls={true}
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex overflow-x-auto scrollbar-hide gap-3 md:gap-4 pb-2 px-1">
                    <div className="flex gap-3 md:gap-4">
                        {displayProducts.map((product, idx) => (
                            <div 
                                key={`${product._id || product.id}-${idx}-${cycleIndex}`} 
                                className="w-[142px] sm:w-[155px] md:w-[175px] lg:w-[195px] shrink-0 animate-in fade-in slide-in-from-right-2 duration-500"
                            >
                                <ProductCard 
                                    product={product} 
                                    showCartControls={true} 
                                 />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
};

export default React.memo(StoreSection);
