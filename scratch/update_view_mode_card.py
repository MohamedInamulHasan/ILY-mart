import os

file_path = r'c:\Users\moham\ILAYANGUDI PROJECT\src\components\IncomingOrderModal.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

old_view_block = """    // 1. Initial Step: Compact "VIEW ORDER" card (shown when app closed/minimized upon order receipt)
    if (viewMode === 'view' && isProcessing) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={handleDismissView}
                className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/75 select-none"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: 'spring', damping: 28, stiffness: 350 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-[2.5rem] p-6 border border-gray-100 dark:border-gray-700 shadow-2xl relative text-center flex flex-col"
                >
                    {/* Compact View when app closed: ID Left, X Right, grey line not touching edges */}
                    <div className="px-5 pt-3 pb-2.5 flex items-center justify-between text-black dark:text-white -mx-6 -mt-6 rounded-t-[2.5rem] bg-white dark:bg-gray-800">
                        {/* Left: #Order ID */}
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm sm:text-[15px] font-bold text-gray-500 dark:text-gray-400 font-mono shrink-0">
                                #{orderIdShort}
                            </span>
                            {formattedOrderTime && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold truncate">
                                    • {formattedOrderTime}
                                </span>
                            )}
                        </div>

                        {/* Right: X Button */}
                        <button
                            type="button"
                            onClick={handleDismissView}
                            title={t('Close')}
                            className="p-1 -mr-1 hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-90 rounded-full text-gray-900 dark:text-white transition-all flex items-center justify-center cursor-pointer shrink-0 ml-2"
                        >
                            <X size={18} className="text-gray-900 dark:text-white stroke-[2.5]" />
                        </button>
                    </div>
                    {/* Grey line not touching left and right edges */}
                    <div className="mx-2 h-[1px] bg-gray-300 dark:bg-gray-600 mb-3 shrink-0" />

                    {/* Delivery Charge Header */}
                    <div className="pt-1 pb-1 text-center">
                        <span className="text-[11px] font-black uppercase tracking-widest text-black dark:text-white block mb-0.5">
                            {t('Delivery Charge')}
                        </span>
                        {deliveryCharge > 0 ? (
                            <div className="text-5xl font-black text-black dark:text-white tracking-tight font-sans">
                                ₹{deliveryCharge}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center gap-2 py-1">
                                <span className="text-4xl font-black text-black dark:text-white tracking-tight uppercase">
                                    {t('Free Delivery')}
                                </span>
                                <CartoonCoin size={32} />
                            </div>
                        )}

                        <p className="text-xs font-bold text-gray-600 dark:text-gray-300 mt-1">
                            {t(paymentType || 'Cash on Delivery')}
                        </p>

                        {formattedOrderTime && (
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 flex items-center justify-center gap-1 font-semibold">
                                <Clock size={12} className="text-gray-400" />
                                <span>{t('Ordered at')} {formattedOrderTime}</span>
                            </p>
                        )}
                    </div>

                    {/* Customer & Location */}
                    <div className="my-3 py-3 border-y border-gray-100 dark:border-gray-700/60 text-center">
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                            {customerName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                            {[street, city].filter(Boolean).join(', ')} {items.length > 0 ? `(${items.length} items)` : ''}
                        </p>

                        {scheduledTimeDisplay && !String(scheduledTimeDisplay).toLowerCase().includes('instant') && (
                            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-full text-amber-800 dark:text-amber-300 text-[11px] font-bold">
                                <Clock size={12} />
                                <span>{t('Scheduled')}: {scheduledTimeDisplay}</span>
                            </div>
                        )}
                    </div>

                    {/* Bottom: Swipe to VIEW ORDER (moves to the full Accept Order card) */}
                    <div className="pt-1">
                        <SwipeActionButton
                            variant="yellow"
                            label={t('VIEW ORDER')}
                            autoReset={true}
                            heightClass="h-[58px] sm:h-[62px]"
                            knobSizeClass="w-[46px] h-[46px] sm:w-[50px] sm:h-[50px]"
                            onSuccess={() => {
                                setViewMode('accept');
                            }}
                        />
                    </div>
                </motion.div>
            </motion.div>
        );
    }"""

new_view_block = """    // 1. Initial Step: Compact "VIEW ORDER" card (shown when delivery boy receives order outside or app opened)
    if (viewMode === 'view' && isProcessing) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={handleDismissView}
                className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/75 select-none"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: 'spring', damping: 28, stiffness: 350 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-2xl overflow-hidden flex flex-col justify-between"
                >
                    {/* Top Header Row: Time and ID on Left, X Button on Right */}
                    <div className="px-5 pt-4 pb-2.5 flex items-center justify-between text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 shrink-0">
                        {/* Left: Time and #Order ID in grey */}
                        <div className="flex items-center gap-2 min-w-0">
                            <Clock size={16} className="text-gray-500 dark:text-gray-400 shrink-0" />
                            <span className="text-sm sm:text-[15px] font-bold text-gray-500 dark:text-gray-400 tracking-wide truncate">
                                {formatOrderBannerTime(order.createdAt || order.date) || formattedOrderTime || t('New Order')}
                            </span>
                            <span className="text-sm sm:text-[15px] font-bold text-gray-500 dark:text-gray-400 font-mono shrink-0">
                                #{orderIdShort}
                            </span>
                        </div>

                        {/* Right: X Button */}
                        <button
                            type="button"
                            onClick={handleDismissView}
                            title={t('Close')}
                            className="p-1 -mr-1 hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-90 rounded-full text-gray-900 dark:text-white transition-all flex items-center justify-center cursor-pointer shrink-0 ml-2"
                        >
                            <X size={18} className="text-gray-900 dark:text-white stroke-[2.5]" />
                        </button>
                    </div>

                    {/* Light grey line matching green dot line */}
                    <div className="mx-5 h-[2px] bg-gray-300 dark:bg-gray-600 rounded-full shrink-0" />

                    {/* Card Content: EXACT Orders List Card Structure */}
                    <div className="pt-3.5 pb-3 px-5">
                        {/* Delivery Charge and Price in Center Thick */}
                        <div className="text-center py-1.5 mb-2 border-b border-gray-100 dark:border-gray-700/60">
                            <span className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-black dark:text-white block mb-0.5">
                                {t('Delivery Charge')}
                            </span>
                            {deliveryCharge <= 0 ? (
                                <div className="flex items-center justify-center gap-2 py-0.5">
                                    <span className="text-3xl sm:text-4xl font-black text-black dark:text-white tracking-tight uppercase">
                                        {t('Free Delivery')}
                                    </span>
                                    <CartoonCoin size={28} />
                                </div>
                            ) : (
                                <div className="text-4xl sm:text-5xl font-black text-black dark:text-white tracking-tight font-sans">
                                    ₹{deliveryCharge}
                                </div>
                            )}
                        </div>

                        {/* Left-Aligned Details with Route Timeline: Green dot before Name -> Grey line -> Green dot before Time */}
                        <div className="flex gap-3 text-left mt-3">
                            {/* Timeline Track: Green Dot -> Vertical Grey Line -> Green Dot */}
                            <div className="flex flex-col items-center pt-1.5 shrink-0">
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-100 dark:ring-emerald-950/80 shrink-0" />
                                <div className="w-[2px] flex-1 bg-gray-300 dark:bg-gray-600 my-1 min-h-[36px]" />
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-100 dark:ring-emerald-950/80 shrink-0" />
                            </div>

                            {/* Content: Customer details on top, Delivery time on bottom */}
                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                                {/* Customer Details */}
                                <div className="space-y-0.5">
                                    {customerName && (
                                        <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate leading-tight">
                                            {customerName}
                                        </h3>
                                    )}
                                    {street && (
                                        <p className="text-xs sm:text-[13px] text-gray-500 dark:text-gray-400 font-medium truncate">
                                            {street}
                                        </p>
                                    )}
                                    {city && (
                                        <p className="text-xs sm:text-[13px] text-gray-500 dark:text-gray-400 font-medium truncate">
                                            {city}
                                        </p>
                                    )}
                                    {items?.length > 0 && (
                                        <p className="text-[11px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1.5 pt-0.5">
                                            <Package size={13} className="text-gray-400 shrink-0" />
                                            <span>{items.length} {items.length === 1 ? t('item') : t('items')}</span>
                                        </p>
                                    )}
                                </div>

                                {/* Scheduled Delivery Time aligned with bottom green dot */}
                                {(() => {
                                    const rawTime = order.scheduledDeliveryTime || order.deliveryTime || order.shippingAddress?.deliveryTime;
                                    const isScheduled = rawTime && !String(rawTime).toLowerCase().includes('instant');
                                    const timeLabel = isScheduled ? t('Scheduled Delivery') : t('Delivery Time');
                                    const timeRange = isScheduled ? formatDeliveryRangeFromDate(rawTime) : (formattedOrderTime || t('Standard Delivery'));

                                    return (
                                        <div className="mt-2.5 pt-1">
                                            <p className="text-xs sm:text-[13px] font-medium text-gray-500 dark:text-gray-400 leading-tight">
                                                {timeLabel}
                                            </p>
                                            <p className="text-sm sm:text-base font-bold text-gray-900 dark:text-white leading-tight mt-0.5">
                                                {timeRange}
                                            </p>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>

                    {/* Bottom: Swipe to VIEW ORDER (redirects into full accept details modal) */}
                    <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-750">
                        <SwipeActionButton
                            variant="yellow"
                            label={t('VIEW ORDER')}
                            autoReset={true}
                            heightClass="h-[52px]"
                            knobSizeClass="w-[40px] h-[40px]"
                            onSuccess={() => {
                                setViewMode('accept');
                            }}
                        />
                    </div>
                </motion.div>
            </motion.div>
        );
    }"""

if old_view_block in content:
    content = content.replace(old_view_block, new_view_block)
    print("Replaced viewMode === 'view' with orders list card structure!")
else:
    print("Exact old_view_block not found, using regex...")
    import re
    # Replace from // 1. Initial Step to // 2. Full "ACCEPT ORDER"
    pattern = r'// 1\. Initial Step:.*?// 2\. Full "ACCEPT ORDER"'
    replacement = new_view_block + "\n\n    // 2. Full \"ACCEPT ORDER\""
    content = re.sub(pattern, replacement, content, flags=re.DOTALL)
    print("Replaced via regex!")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Saved IncomingOrderModal.jsx successfully!")

