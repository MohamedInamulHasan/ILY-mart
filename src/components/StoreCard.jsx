import React, { memo } from 'react';
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
            className={`group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden transition-all duration-300 w-full cursor-pointer shadow-xs hover:shadow-md border border-gray-100 dark:border-gray-700/60 flex flex-col ${!isOpen ? 'cursor-not-allowed opacity-85' : 'active:scale-[0.99]'}`}
        >
            {/* Full 16:9 Image */}
            <div className="w-full aspect-[16/9] relative overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                <img
                    src={store.image || `${API_BASE_URL}/stores/${store._id || store.id}/image`}
                    alt={store.name}
                    className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
                    loading="lazy" 
                    decoding="async"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://placehold.co/800x450?text=Store";
                    }}
                />
                
                {/* Category Tag Overlay (Top Left) */}
                {store.category && (
                    <div className="absolute top-2.5 left-2.5 z-20">
                        <span className="px-2.5 py-1 bg-black/40 backdrop-blur-md border border-white/20 text-white text-[9.5px] font-bold rounded-full uppercase tracking-wider shadow-sm truncate max-w-[120px] block">
                            {store.category}
                        </span>
                    </div>
                )}

                {/* Closed Status Overlay */}
                {!isOpen && (
                    <div className="absolute inset-0 z-30 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
                        <span className="bg-gray-900/90 text-white px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-md">
                            {t('Closed')}
                        </span>
                    </div>
                )}
            </div>

            {/* Content Section below the 16:9 image */}
            <div className="p-3 sm:p-3.5 flex flex-col justify-between flex-1 gap-1.5 bg-white dark:bg-gray-800">
                {/* Store Name & Right Action Arrow */}
                <div className="flex items-center justify-between min-w-0 gap-2">
                    <h3 className={`text-gray-900 dark:text-white text-[15px] sm:text-[16px] font-bold tracking-tight leading-tight truncate flex-1 min-w-0 ${!isOpen ? 'opacity-60' : ''}`} title={t(store, 'name')}>
                        {t(store, 'name')}
                    </h3>
                    <div className={`flex-shrink-0 transition-all duration-300 ${!isOpen ? 'opacity-0 scale-50' : ''}`}>
                        <div className="w-6 h-6 rounded-full bg-[#2E5A2E] dark:bg-[#CBF9B2] text-white dark:text-gray-900 flex items-center justify-center shadow-xs group-hover:scale-105 active:scale-95 transition-transform">
                            <ArrowRight size={13} />
                        </div>
                    </div>
                </div>

                {/* Timing if mentioned */}
                {timeLabel && (
                    <div className="flex items-center gap-1.5 text-[11.5px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium">
                        <Clock size={12} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
                        <span className="truncate">{timeLabel}</span>
                    </div>
                )}

                {/* Location: little big and increased grey */}
                <div className="flex items-center gap-1.5 mt-0.5">
                    <MapPin size={12} className="text-[#2E5A2E] dark:text-[#CBF9B2] flex-shrink-0" />
                    <p className="text-[12px] sm:text-[13px] font-medium text-gray-600 dark:text-gray-300 truncate" title={store.address || t('No address')}>
                        {store.address || t('No address')}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default memo(StoreCard);