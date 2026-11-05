import React, { useMemo } from 'react';
import { MapPin, Navigation, Sparkles } from 'lucide-react';
import { optimizeDeliveryRoute } from '../utils/deliveryRouteHelper';

/**
 * Porter-style Delivery Route Timeline Component
 * Automatically calculates shortest path from Driver -> Store 1 -> Store 2 -> Customer
 * Displays red circles for stores with distance, grey connecting lines, and green circle for customer
 */
const DeliveryRouteTimeline = ({
    order,
    stores = [],
    driverCoords = null,
    compact = false,
    showMapButtons = true,
    t = (s) => s
}) => {
    const route = useMemo(() => {
        return optimizeDeliveryRoute(driverCoords, order, stores);
    }, [driverCoords, order, stores]);

    const { sortedStores, customer, formattedTotalDistance, hasMultipleStores } = route;

    if (!sortedStores || sortedStores.length === 0) {
        return null;
    }

    return (
        <div className={`w-full ${compact ? 'mt-2' : 'mt-1'}`}>
            {/* Optional Route Badge / Summary */}
            {!compact && formattedTotalDistance && (
                <div className="flex items-center justify-between gap-2 mb-3 px-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#2E5A2E] dark:text-[#CBF9B2]">
                        <Navigation size={13} className="shrink-0" />
                        <span>{t('Shortest Path Route')}</span>
                    </div>
                    <span className="text-[11px] font-extrabold bg-[#2E5A2E]/10 dark:bg-[#CBF9B2]/15 text-[#2E5A2E] dark:text-[#CBF9B2] px-2.5 py-0.5 rounded-full border border-[#2E5A2E]/20">
                        {t('Total')}: {formattedTotalDistance}
                    </span>
                </div>
            )}

            {/* Timeline structure */}
            <div className="space-y-0 relative text-left">
                {/* 1. Stores (Pickups) */}
                {sortedStores.map((store, idx) => {
                    const isFirst = idx === 0;
                    return (
                        <div key={store.id || idx} className="relative flex items-start gap-2.5">
                            {/* Left Column: Red Dot + Vertical Grey Line */}
                            <div className="flex flex-col items-center pt-1 shrink-0 w-3">
                                <div
                                    className="w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-red-100 dark:ring-red-950/80 shrink-0"
                                    title={t('Store Pickup')}
                                />
                                {/* Grey Connecting Line */}
                                <div className="w-[2px] bg-gray-300 dark:bg-gray-600 my-1 min-h-[28px] shrink-0" />
                            </div>

                            {/* Right Column: Store info + distance badge */}
                            <div className="flex-1 min-w-0 pb-1.5 flex items-center justify-between gap-1.5">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="text-xs sm:text-[13px] font-bold text-gray-900 dark:text-white truncate">
                                            {store.name}
                                        </span>
                                        {hasMultipleStores && (
                                            <span className="text-[10px] text-gray-400 font-mono font-medium">
                                                (Stop {idx + 1})
                                            </span>
                                        )}
                                        {store.formattedDistance && (
                                            <span className="text-[10px] sm:text-[11px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 px-2 py-0.5 rounded-full border border-red-200/60 dark:border-red-900/40 shrink-0">
                                                {store.formattedDistance} {isFirst && driverCoords ? t('from you') : ''}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[10px] sm:text-[11px] text-gray-400 dark:text-gray-500 truncate mt-0.5">
                                        {t('Pickup')}
                                    </p>
                                </div>

                                {/* Map Link for Store */}
                                {showMapButtons && store.location && (
                                    <a
                                        href={store.location}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="shrink-0 p-1.5 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/50 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 active:scale-95 transition-transform"
                                        title={t('Open Store in Google Maps')}
                                    >
                                        <MapPin size={13} />
                                    </a>
                                )}
                            </div>
                        </div>
                    );
                })}

                {/* 2. Customer Drop Location */}
                <div className="relative flex items-start gap-2.5">
                    {/* Left Column: Green Dot */}
                    <div className="flex flex-col items-center pt-1 shrink-0 w-3">
                        <div
                            className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-100 dark:ring-emerald-950/80 shrink-0"
                            title={t('Customer Drop')}
                        />
                    </div>

                    {/* Right Column: Customer info + distance badge */}
                    <div className="flex-1 min-w-0 flex items-center justify-between gap-1.5">
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs sm:text-[13px] font-bold text-gray-900 dark:text-white truncate">
                                    {customer?.name || t('Customer')}
                                </span>
                                {customer?.formattedDistance && (
                                    <span className="text-[10px] sm:text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-900/40 shrink-0">
                                        {customer.formattedDistance} {t('to drop')}
                                    </span>
                                )}
                            </div>
                            {customer?.address && (
                                <p className="text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                    {customer.address}
                                </p>
                            )}
                        </div>

                        {/* Map Link for Customer */}
                        {showMapButtons && customer?.location && (
                            <a
                                href={
                                    customer.location.startsWith('http')
                                        ? customer.location
                                        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(customer.location)}`
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="shrink-0 p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 active:scale-95 transition-transform"
                                title={t('Open Customer in Google Maps')}
                            >
                                <MapPin size={13} />
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeliveryRouteTimeline;
