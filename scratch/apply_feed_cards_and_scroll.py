import re

file_path = 'src/components/DeliveryOrdersFeedModal.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update imports
if 'formatOrderBannerTime' not in content:
    content = content.replace(
        "import { formatDeliveryRangeFromDate } from '../utils/storeHelpers';",
        "import { formatDeliveryRangeFromDate } from '../utils/storeHelpers';\nimport { formatOrderBannerTime } from '../utils/dateUtils';"
    )

# 2. Replace the scrollable container and card rendering:
# Find start of scrollable container: <div className="flex-1 overflow-hidden flex flex-col">
old_scroll_start = '<div className="flex-1 overflow-hidden flex flex-col">'
new_scroll_start = '<div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4 max-w-2xl mx-auto w-full pb-36" style={{ WebkitOverflowScrolling: "touch" }}>'

# We will replace from <div className="flex-1 overflow-hidden flex flex-col"> to the matching </div></PullToRefreshLayout></div>
# Let's inspect the exact lines around 205-402
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

start_idx = -1
end_idx = -1
for i, line in enumerate(lines):
    if 'Scrollable Order Cards List' in line:
        start_idx = i
        break

for i, line in enumerate(lines):
    if 'POPUP: Cancel Order Confirmation' in line:
        end_idx = i - 1
        break

print(f"Scrollable section indices: {start_idx} to {end_idx}")

new_section = """                {/* Scrollable Order Cards List filling full page with fluid mobile touch scroll */}
                <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4 max-w-2xl mx-auto w-full pb-36" style={{ WebkitOverflowScrolling: 'touch' }}>
                    {feedOrders.length === 0 ? (
                        <div className="text-center py-16 px-4 bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700">
                            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400">
                                {showDeliveredOnly ? <CheckCircle size={30} className="text-emerald-500" /> : <Package size={30} />}
                            </div>
                            <h3 className="font-bold text-gray-800 dark:text-gray-200 text-base">
                                {showDeliveredOnly ? t('No delivered orders yet') : t('No orders right now')}
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">
                                {showDeliveredOnly
                                    ? t('Delivered customer orders will appear here.')
                                    : t('New customer orders will automatically appear here.')}
                            </p>
                        </div>
                    ) : (
                        feedOrders.map((order) => {
                            const orderIdShort = String(order._id || order.id || '000000').slice(-6).toUpperCase();
                            const deliveryCharge = order.shipping !== undefined && order.shipping !== null
                                ? order.shipping
                                : (order.deliveryCharge !== undefined ? order.deliveryCharge : 20);
                            const isFreeDelivery = Number(deliveryCharge) <= 0;
                            const orderTimeStr = formatOrderTime(order);
                            const customerName = order.shippingAddress?.name || '';
                            const street = order.shippingAddress?.street || '';
                            const city = order.shippingAddress?.city || 'Ilayangudi';
                            const locationSnippet = street ? `${street}, ${city}` : city;
                            const isCancelled = order.status === 'Cancelled';
                            const isProcessing = order.status === 'Processing' || order.status === 'Pending';
                            const isDelivered = order.status === 'Delivered' || order.status === 'Completed';

                            return (
                                <div
                                    key={order._id || order.id}
                                    className={`${
                                        isCancelled
                                            ? 'bg-gray-100/90 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700/80'
                                            : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'
                                    } rounded-[2rem] border overflow-hidden flex flex-col justify-between transition-all duration-200 shadow-xs hover:shadow-sm`}
                                >
                                    {/* Upper Black Header Bar with Order ID, |, Clock Icon, Time, and X on right in white */}
                                    <div className="bg-black px-5 py-3 flex items-center justify-between text-white shrink-0">
                                        {/* Left: #Order ID | 🕒 Nov 6, 8.00 PM */}
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="text-sm sm:text-[15px] font-black tracking-wide text-white font-mono shrink-0">
                                                #{orderIdShort}
                                            </span>
                                            <span className="text-white/40 text-sm font-normal shrink-0">|</span>
                                            <Clock size={16} className="text-white shrink-0" />
                                            <span className="text-sm sm:text-[15px] font-bold text-white tracking-wide truncate">
                                                {formatOrderBannerTime(order.createdAt || order.date) || orderTimeStr || t('New Order')}
                                            </span>
                                        </div>

                                        {/* Right: Action button (X for processing, Trash for cancelled) */}
                                        {isProcessing && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOrderToCancel(order);
                                                    setShowCancelPopup(true);
                                                }}
                                                title={t('Cancel Order')}
                                                className="p-1 -mr-1 hover:bg-white/20 active:scale-90 rounded-full text-white transition-all flex items-center justify-center cursor-pointer shrink-0 ml-2"
                                            >
                                                <X size={18} className="text-white stroke-[2.5]" />
                                            </button>
                                        )}
                                        {isCancelled && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOrderToDelete(order);
                                                    setShowDeletePopup(true);
                                                }}
                                                title={t('Delete Cancelled Order')}
                                                className="p-1 -mr-1 hover:bg-white/20 active:scale-90 rounded-full text-red-400 transition-all flex items-center justify-center cursor-pointer shrink-0 ml-2"
                                            >
                                                <Trash2 size={18} className="stroke-[2.2]" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Card Content: Delivery Charge in center thick, Customer & address on left */}
                                    <div className="pt-3.5 pb-3 px-5">
                                        {/* Delivery Charge and Price in Center Thick */}
                                        <div className="text-center py-1.5 mb-2 border-b border-gray-100 dark:border-gray-700/60">
                                            <span className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-gray-600 dark:text-gray-300 block mb-0.5">
                                                {t('Delivery Charge')}
                                            </span>
                                            {isFreeDelivery ? (
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

                                        {/* Left-Aligned Details with Route Timeline: Green dot before Name -> Light Grey line -> Green dot before Time */}
                                        <div className="flex gap-3 text-left mt-3">
                                            {/* Timeline Track: Green Dot -> Vertical Light Grey Line -> Green Dot */}
                                            <div className="flex flex-col items-center pt-1.5 shrink-0">
                                                {/* Green dot before Name */}
                                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-100 dark:ring-emerald-950/80 shrink-0" />

                                                {/* Light grey line joining the two dots */}
                                                <div className="w-[2px] flex-1 bg-gray-300 dark:bg-gray-600 my-1 min-h-[36px]" />

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
                                        </div>
                                    </div>

                                    {/* Action Button: Swipe to View Order or Delivered Successfully */}
                                    <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-750">
                                        {isDelivered ? (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    onSelectOrder(order);
                                                }}
                                                className="relative overflow-hidden w-full py-3.5 rounded-full bg-[#00C988] hover:bg-[#00b57a] active:scale-95 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all select-none"
                                            >
                                                {/* Animated sheen shine effect */}
                                                <motion.div
                                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none"
                                                    animate={{ x: ['-100%', '200%'] }}
                                                    transition={{
                                                        repeat: Infinity,
                                                        duration: 2,
                                                        ease: 'easeInOut',
                                                        repeatDelay: 0.5
                                                    }}
                                                />
                                                <CheckCircle size={17} className="text-white stroke-[2.8] relative z-10" />
                                                <span className="relative z-10">{t('Delivered Successfully')}</span>
                                            </button>
                                        ) : isCancelled ? (
                                            <div className="w-full py-3.5 text-center text-xs font-bold text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-full">
                                                {t('Cancelled')}
                                            </div>
                                        ) : (
                                            <SwipeActionButton
                                                variant="yellow"
                                                label={t('VIEW ORDER')}
                                                autoReset={true}
                                                heightClass="h-[50px]"
                                                knobSizeClass="w-[38px] h-[38px]"
                                                onSuccess={() => {
                                                    onSelectOrder(order);
                                                }}
                                            />
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
"""

if start_idx != -1 and end_idx != -1:
    lines[start_idx:end_idx] = [new_section]
    # Check imports
    joined = "".join(lines)
    if 'formatOrderBannerTime' not in joined:
        joined = joined.replace(
            "import { formatDeliveryRangeFromDate } from '../utils/storeHelpers';",
            "import { formatDeliveryRangeFromDate } from '../utils/storeHelpers';\nimport { formatOrderBannerTime } from '../utils/dateUtils';"
        )
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(joined)
    print("SUCCESSFULLY APPLIED TO DeliveryOrdersFeedModal.jsx")
else:
    print("Could not find indices in DeliveryOrdersFeedModal.jsx")

