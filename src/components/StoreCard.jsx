import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { getThumbnailUrl } from '../utils/imageOptimizer';
import { useNavigate } from 'react-router-dom';
import { MapPin, ArrowRight, Clock } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { isStoreOpen, getStoreTimeLabel } from '../utils/storeHelpers';
import { API_BASE_URL } from '../utils/api';

const StoreCard = ({ store }) => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const isOpen = isStoreOpen(store);
    const timeLabel = getStoreTimeLabel(store) || store.timings;

    const handleVisit = () => {
        if (isOpen) {
            navigate(`/store/${store._id || store.id}`);
        }
    };

    return (
        <div 
            onClick={handleVisit}
            className={`group relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden transition-all duration-300 aspect-[16/9] md:aspect-[3/2] lg:aspect-[4/3] w-full cursor-pointer shadow-xs hover:shadow-md border border-gray-100 dark:border-gray-700/60 ${!isOpen ? 'cursor-not-allowed opacity-85' : 'active:scale-[0.99]'}`}
        >
            {/* Full Background Image */}
            <div className={`absolute inset-0 z-0 ${!isOpen ? 'opacity-60' : ''}`}>
                <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700" />
                <img
                    src={store.image || `${API_BASE_URL}/stores/${store._id || store.id}/image`}
                    alt={store.name}
                    className="absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:scale-105 z-10"
                    loading="lazy" 
                    decoding="async"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://placehold.co/800x450?text=Store";
                    }}
                />

                {/* Bottom Vignette Gradient Only */}
                <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none z-10" />
            </div>

            {/* Category Tag Overlay (Top Left) */}
            {store.category && (
                <div className="absolute top-3 left-3 z-20">
                    <span className="px-2.5 py-1 bg-white/20 backdrop-blur-md border border-white/30 text-white text-[9.5px] font-bold rounded-full uppercase tracking-wider shadow-sm truncate max-w-[120px] block">
                        {store.category}
                    </span>
                </div>
            )}

            {/* Rectangular Timing Badge (Top Right) - No pill */}
            {timeLabel && (
                <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-black/65 backdrop-blur-sm text-white px-2 py-1 rounded-md shadow-xs border border-white/10">
                    <Clock size={10} className="text-[#CBF9B2] flex-shrink-0" />
                    <span className="text-[10px] font-semibold tracking-tight leading-none">{timeLabel}</span>
                </div>
            )}

            {/* Closed Status Overlay (Rectangular Tag) */}
            {!isOpen && (
                <div className="absolute inset-0 z-30 bg-black/30 flex items-center justify-center backdrop-blur-[1px]">
                    <span className="bg-gray-900/90 text-white px-3.5 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-md border border-white/10">
                        {t('Closed')}
                    </span>
                </div>
            )}

            {/* Content Section - Compact Bottom White Banner */}
            <div className="absolute bottom-0 left-0 right-0 py-2.5 px-3.5 z-20 overflow-hidden bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between min-w-0 gap-2">
                    <div className="flex-1 min-w-0 pr-1">
                        <h3 className={`text-gray-900 dark:text-white text-[14px] sm:text-[15.5px] font-bold tracking-tight leading-tight truncate ${!isOpen ? 'opacity-60' : ''}`} title={t(store, 'name')}>
                            {t(store, 'name')}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <MapPin size={11} className="text-[#2E5A2E] dark:text-[#CBF9B2] flex-shrink-0" />
                            <p className="text-gray-800 dark:text-gray-200 text-[11px] sm:text-[12px] font-semibold truncate" title={store.address || t('No address')}>
                                {store.address || t('No address')}
                            </p>
                        </div>
                    </div>

                    {/* Right Action Arrow with Enhanced Shake Effect */}
                    <div className={`flex-shrink-0 transition-all duration-300 ${!isOpen ? 'opacity-0 scale-50' : ''}`}>
                        <motion.div
                            animate={{
                                x: [0, 6, -5, 5, -3, 2, 0],
                                rotate: [0, 8, -6, 6, -3, 0]
                            }}
                            transition={{
                                repeat: Infinity,
                                repeatDelay: 1.2,
                                duration: 0.6,
                                ease: 'easeInOut'
                            }}
                            className="w-6 h-6 rounded-full bg-[#2E5A2E] dark:bg-[#CBF9B2] text-white dark:text-gray-900 flex items-center justify-center shadow-xs group-hover:scale-110 active:scale-95 transition-transform"
                        >
                            <ArrowRight size={13} />
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default memo(StoreCard);
