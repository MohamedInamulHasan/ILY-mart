import React, { memo } from 'react';
import { getThumbnailUrl } from '../utils/imageOptimizer';
import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { isStoreOpen, getStoreTimeLabel } from '../utils/storeHelpers';
import { API_BASE_URL } from '../utils/api';

const StoreCard = ({ store }) => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const isOpen = isStoreOpen(store);
    const timeLabel = getStoreTimeLabel(store);

    const handleVisit = () => {
        if (isOpen) {
            navigate(`/store/${store._id || store.id}`);
        }
    };

    return (
        <div 
            onClick={handleVisit}
            className={`group relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden transition-all duration-300 aspect-[16/9] md:aspect-[3/2] lg:aspect-[4/3] w-full cursor-pointer shadow-sm hover:shadow-md ${!isOpen ? 'cursor-not-allowed' : ''}`}
        >
            {/* Full Background Image */}
            <div className={`absolute inset-0 z-0 ${!isOpen ? 'opacity-60' : ''}`}>
                <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700" />
                <img
                    src={store.image || `${API_BASE_URL}/stores/${store._id || store.id}/image`}
                    alt={store.name}
                    className="absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-110 z-10"
                    loading="lazy" decoding="async"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://placehold.co/800x450?text=Store";
                    }}
                />
                
                {/* Dark Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-300 z-10" />
            </div>

            {/* Category Tag Overlay (Top Left) like service card */}
            {store.category && (
                <div className="absolute top-3 left-3 z-20">
                    <span className="px-2.5 py-1 bg-white/20 backdrop-blur-md border border-white/30 text-white text-[9.5px] font-bold rounded-full uppercase tracking-[0.15em] shadow-lg">
                        {store.category}
                    </span>
                </div>
            )}

            {/* Timing Badge (Top Right) */}
            {timeLabel && (
                <div className="absolute top-3 right-3 z-20 flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-full shadow-md">
                    <Clock size={9} className="flex-shrink-0 opacity-80" />
                    <span className="text-[9px] font-bold tracking-tight leading-none">{timeLabel}</span>
                </div>
            )}

            {/* Closed Status Overlay */}
            {!isOpen && (
                <div className="absolute inset-0 z-30 bg-black/10 flex items-center justify-center backdrop-blur-[1px]">
                    <span className="bg-gray-800 text-white px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg animate-in fade-in zoom-in-95 duration-500">
                        {t('Closed')}
                    </span>
                </div>
            )}

            {/* Content Section - White Banner Strip at Bottom */}
            <div className="absolute bottom-0 left-0 right-0 py-2 px-3.5 z-20 overflow-hidden">
                {/* Solid White Banner Strip */}
                <div className="absolute inset-0 bg-white dark:bg-gray-800 border-t border-gray-50 dark:border-gray-700" />
                
                <div className="relative z-10">
                    <h3 className={`text-gray-900 dark:text-white text-[15px] font-semibold tracking-tight leading-tight mb-0.5 truncate pr-8 ${!isOpen ? 'opacity-60' : ''}`}>
                        {t(store, 'name')}
                    </h3>
                    <div className="flex items-center gap-1.5 opacity-90">
                        <MapPin size={10} className="text-[#2E5A2E] dark:text-[#CBF9B2] flex-shrink-0" />
                        <p className="text-gray-500 dark:text-gray-400 text-[11px] font-normal truncate">
                            {store.address || t('No address')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Action Arrow in bottom strip */}
            <div className={`absolute bottom-2.5 right-3 z-30 transition-all duration-300 ${!isOpen ? 'opacity-0 scale-50' : ''}`}>
                <div className="w-7 h-7 rounded-full bg-[#2E5A2E] dark:bg-[#CBF9B2] text-white dark:text-gray-900 flex items-center justify-center scale-90 group-hover:scale-105 active:scale-90 transition-all shadow-sm">
                    <ArrowRight size={15} />
                </div>
            </div>
        </div>
    );
};

export default memo(StoreCard);
