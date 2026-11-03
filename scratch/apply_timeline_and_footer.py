with open('src/pages/admin/DeliveryDashboard.jsx', 'r', encoding='utf-8') as f:
    dd_code = f.read()

# 1. Update Card content with timeline (green dot at name -> black line -> green dot at time)
old_card_details = """                                                {/* Left-Aligned Details: Name, Address, City, Items */}
                                                <div className="text-left space-y-1 mt-3">
                                                    {/* Name */}
                                                    {customerName && (
                                                        <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate">
                                                            {customerName}
                                                        </h3>
                                                    )}

                                                    {/* Address (Street) below Name */}
                                                    {street && (
                                                        <p className="text-xs sm:text-[13px] text-gray-700 dark:text-gray-300 font-medium truncate">
                                                            {street}
                                                        </p>
                                                    )}

                                                    {/* City below Address */}
                                                    {city && (
                                                        <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium truncate">
                                                            {city}
                                                        </p>
                                                    )}

                                                    {/* Items below City */}
                                                    {order.items?.length > 0 && (
                                                        <p className="text-[11px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1.5 pt-0.5">
                                                            <Package size={13} className="text-gray-400 shrink-0" />
                                                            <span>{order.items.length} {order.items.length === 1 ? t('item') : t('items')}</span>
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Scheduled Delivery Time on Left Side */}
                                                {(() => {
                                                    const rawTime = order.scheduledDeliveryTime || order.deliveryTime || order.shippingAddress?.deliveryTime;
                                                    if (!rawTime) return null;
                                                    const strTime = String(rawTime).toLowerCase();
                                                    if (strTime.includes('instant')) return null;

                                                    const formattedRange = formatDeliveryRangeFromDate(rawTime);
                                                    if (!formattedRange || formattedRange.toLowerCase().includes('instant')) return null;

                                                    return (
                                                        <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-700/60 flex items-center gap-2 text-left">
                                                            <div className="w-6 h-6 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                                                                <Clock size={13} className="text-amber-600 dark:text-amber-400" />
                                                            </div>
                                                            <div className="text-left">
                                                                <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 leading-tight">
                                                                    {t('Scheduled Delivery')}
                                                                </p>
                                                                <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                                                                    {formattedRange}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    );
                                                })()}"""

new_card_details = """                                                {/* Left-Aligned Details with Route Timeline: Green dot before Name -> Black line -> Green dot before Time */}
                                                <div className="flex gap-3 text-left mt-3">
                                                    {/* Timeline Track: Green Dot -> Vertical Black Line -> Green Dot */}
                                                    <div className="flex flex-col items-center pt-1.5 shrink-0">
                                                        {/* Green dot before Name */}
                                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-100 dark:ring-emerald-950/80 shrink-0" />

                                                        {/* Black line joining the two dots */}
                                                        <div className="w-[2px] flex-1 bg-black dark:bg-gray-400 my-1 min-h-[36px]" />

                                                        {/* Green dot before Time */}
                                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-100 dark:ring-emerald-950/80 shrink-0" />
                                                    </div>

                                                    {/* Content: Customer details on top, Delivery time on bottom */}
                                                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                                                        {/* Customer Details */}
                                                        <div className="space-y-0.5">
                                                            {/* Customer Name */}
                                                            {customerName && (
                                                                <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate leading-tight">
                                                                    {customerName}
                                                                </h3>
                                                            )}

                                                            {/* Address (Street) below Name */}
                                                            {street && (
                                                                <p className="text-xs sm:text-[13px] text-gray-700 dark:text-gray-300 font-medium truncate">
                                                                    {street}
                                                                </p>
                                                            )}

                                                            {/* City below Address */}
                                                            {city && (
                                                                <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium truncate">
                                                                    {city}
                                                                </p>
                                                            )}

                                                            {/* Items below City */}
                                                            {order.items?.length > 0 && (
                                                                <p className="text-[11px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1.5 pt-0.5">
                                                                    <Package size={13} className="text-gray-400 shrink-0" />
                                                                    <span>{order.items.length} {order.items.length === 1 ? t('item') : t('items')}</span>
                                                                </p>
                                                            )}
                                                        </div>

                                                        {/* Scheduled Delivery Time (or Delivery Time) aligned with bottom green dot */}
                                                        {(() => {
                                                            const rawTime = order.scheduledDeliveryTime || order.deliveryTime || order.shippingAddress?.deliveryTime;
                                                            const isScheduled = rawTime && !String(rawTime).toLowerCase().includes('instant');
                                                            const timeLabel = isScheduled ? t('Scheduled Delivery') : t('Delivery Time');
                                                            const timeRange = isScheduled ? formatDeliveryRangeFromDate(rawTime) : (orderTimeStr || t('Standard Delivery'));

                                                            return (
                                                                <div className="mt-3 pt-1">
                                                                    <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 leading-tight">
                                                                        {timeLabel}
                                                                    </p>
                                                                    <p className="text-xs sm:text-[13px] font-bold text-gray-900 dark:text-white">
                                                                        {timeRange}
                                                                    </p>
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>
                                                </div>"""

dd_code = dd_code.replace(old_card_details, new_card_details)

# 2. Update Footer size to match Accept and Delivered footer button size
old_footer = """            {/* Attached Bottom Rectangle Footer */}
            <div 
                className="fixed bottom-0 inset-x-0 z-40 w-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200/80 dark:border-gray-800 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pointer-events-auto select-none"
                style={{ paddingBottom: 'calc(0.65rem + env(safe-area-inset-bottom, 10px))', paddingTop: '0.45rem' }}
            >
                <div className="max-w-xs sm:max-w-sm mx-auto px-4">
                    <SwipeActionButton
                        key={isFloatingEnabled ? 'disable-floating' : 'enable-floating'}
                        variant={isFloatingEnabled ? 'black-shine' : 'outline-white'}
                        label={isFloatingEnabled ? t('Swipe to Disable') : t('Swipe to Enable')}
                        loadingLabel={isFloatingEnabled ? t('Disabling...') : t('Enabling...')}
                        onSuccess={toggleFloatingOverlay}
                        autoReset={true}
                        heightClass="h-[44px]"
                        knobSizeClass="w-[34px] h-[34px]"
                        textSizeClass="text-xs sm:text-[13px]"
                        iconSize={18}
                    />
                </div>
            </div>"""

new_footer = """            {/* Attached Bottom Rectangle Footer - Matches Accept & Delivered Footer Size */}
            <div 
                className="fixed bottom-0 inset-x-0 z-40 w-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200/80 dark:border-gray-800 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] pointer-events-auto select-none"
                style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 16px))', paddingTop: '0.85rem' }}
            >
                <div className="max-w-md mx-auto px-4">
                    <SwipeActionButton
                        key={isFloatingEnabled ? 'disable-floating' : 'enable-floating'}
                        variant={isFloatingEnabled ? 'black-shine' : 'outline-white'}
                        label={isFloatingEnabled ? t('Swipe to Disable') : t('Swipe to Enable')}
                        loadingLabel={isFloatingEnabled ? t('Disabling...') : t('Enabling...')}
                        onSuccess={toggleFloatingOverlay}
                        autoReset={true}
                        heightClass="h-[58px] sm:h-[62px]"
                        knobSizeClass="w-[46px] h-[46px] sm:w-[50px] sm:h-[50px]"
                        textSizeClass="text-sm sm:text-base font-black"
                        iconSize={22}
                    />
                </div>
            </div>"""

dd_code = dd_code.replace(old_footer, new_footer)

# Update page bottom padding for comfortable scrolling above the footer
dd_code = dd_code.replace('pb-28', 'pb-44')
dd_code = dd_code.replace('pb-24', 'pb-40')

with open('src/pages/admin/DeliveryDashboard.jsx', 'w', encoding='utf-8') as f:
    f.write(dd_code)
print("Updated DeliveryDashboard.jsx with timeline (green dots + black line) and accept/delivered sized footer!")

