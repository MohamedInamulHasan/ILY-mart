# 1. Update SwipeActionButton.jsx
with open('src/components/SwipeActionButton.jsx', 'r', encoding='utf-8') as f:
    btn_code = f.read()

old_props = """const SwipeActionButton = ({
    onSuccess,
    label = 'Swipe to Accept',
    isLoading = false,
    loadingLabel = 'Processing...',
    heightClass = 'h-[60px] sm:h-[64px]',
    knobSizeClass = 'w-[48px] h-[48px] sm:w-[52px] sm:h-[52px]',
    variant = 'green', // 'yellow' | 'amber' | 'blue' | 'sky' | 'green' | 'red'
    autoReset = false,
    className = ''
}) => {"""

new_props = """const SwipeActionButton = ({
    onSuccess,
    label = 'Swipe to Accept',
    isLoading = false,
    loadingLabel = 'Processing...',
    heightClass = 'h-[60px] sm:h-[64px]',
    knobSizeClass = 'w-[48px] h-[48px] sm:w-[52px] sm:h-[52px]',
    textSizeClass = 'text-base sm:text-lg',
    iconSize = 24,
    variant = 'green', // 'yellow' | 'amber' | 'blue' | 'sky' | 'green' | 'red'
    autoReset = false,
    className = ''
}) => {"""

if old_props in btn_code:
    btn_code = btn_code.replace(old_props, new_props)

btn_code = btn_code.replace(
    '<ChevronsRight size={24} className={`stroke-[3.5] ${colors.knob}`} />',
    '<ChevronsRight size={iconSize} className={`stroke-[3.5] ${colors.knob}`} />'
)

btn_code = btn_code.replace(
    '<span className="font-black text-base sm:text-lg tracking-wider uppercase text-white text-center select-none truncate">',
    '<span className={`font-black ${textSizeClass} tracking-wider uppercase text-white text-center select-none truncate`}>'
)

with open('src/components/SwipeActionButton.jsx', 'w', encoding='utf-8') as f:
    f.write(btn_code)
print("Updated SwipeActionButton.jsx")


# 2. Update DeliveryDashboard.jsx
with open('src/pages/admin/DeliveryDashboard.jsx', 'r', encoding='utf-8') as f:
    dd_code = f.read()

old_card_content = """                                            {/* Card Top: Solid Clean Header with Centered Content */}
                                            <div className="pt-5 pb-3 px-5 text-center">
                                                {/* Delivery Charge in Dark Grey */}
                                                <div className="text-center py-1">
                                                    <span className="text-[11px] font-bold uppercase tracking-widest text-gray-600 dark:text-gray-300 block mb-0.5">
                                                        {t('Delivery Charge')}
                                                    </span>
                                                    {isFreeDelivery ? (
                                                        <div className="flex items-center justify-center gap-2 py-1">
                                                            <span className="text-3xl sm:text-4xl font-black text-black dark:text-white tracking-tight uppercase">
                                                                {t('Free Delivery')}
                                                            </span>
                                                            <CartoonCoin size={30} />
                                                        </div>
                                                    ) : (
                                                        <div className="text-4xl sm:text-5xl font-black text-black dark:text-white tracking-tight font-sans">
                                                            ₹{deliveryCharge}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Ordered Time with Clock in Dark Grey */}
                                                {orderTimeStr && (
                                                    <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 mt-1">
                                                        <Clock size={13} className="text-gray-600 dark:text-gray-400" />
                                                        <span>{orderTimeStr}</span>
                                                    </div>
                                                )}

                                                {/* Customer Name */}
                                                {customerName && (
                                                    <p className="text-center text-xs sm:text-sm text-gray-900 dark:text-white font-bold mt-2 truncate">
                                                        {customerName}
                                                    </p>
                                                )}

                                                {/* Address below Name */}
                                                {(locationSnippet || order.items?.length > 0) && (
                                                    <p className="text-center text-[11px] sm:text-xs text-gray-600 dark:text-gray-300 font-medium mt-0.5 truncate">
                                                        {[locationSnippet, order.items?.length > 0 ? `(${order.items.length} items)` : ''].filter(Boolean).join(' ')}
                                                    </p>
                                                )}

                                                {/* Scheduled Delivery Time like in OrderDetails.jsx in Dark Grey */}
                                                {(() => {
                                                    const rawTime = order.scheduledDeliveryTime || order.deliveryTime || order.shippingAddress?.deliveryTime;
                                                    if (!rawTime) return null;
                                                    const strTime = String(rawTime).toLowerCase();
                                                    if (strTime.includes('instant')) return null;

                                                    const formattedRange = formatDeliveryRangeFromDate(rawTime);
                                                    if (!formattedRange || formattedRange.toLowerCase().includes('instant')) return null;

                                                    return (
                                                        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-center gap-2 text-gray-700 dark:text-gray-300">
                                                            <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700/60 flex items-center justify-center shrink-0">
                                                                <Clock size={15} className="text-gray-600 dark:text-gray-300" />
                                                            </div>
                                                            <div className="text-left">
                                                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 leading-tight">
                                                                    {t('Scheduled Delivery')}
                                                                </p>
                                                                <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                                                                    {formattedRange}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    );
                                                })()}
                                            </div>"""

new_card_content = """                                            {/* Card Content: Ordered time in top-left, Delivery Charge in top-right, Customer & address on left */}
                                            <div className="pt-4 pb-3 px-5">
                                                {/* Upper Row: Left corner has Ordered Date & Time, Right corner has Delivery Charge */}
                                                <div className="flex items-start justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-700/60">
                                                    {/* Ordered Time & Date in Upper Left Corner */}
                                                    {orderTimeStr ? (
                                                        <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 pt-0.5">
                                                            <Clock size={13} className="text-gray-400 dark:text-gray-500 shrink-0" />
                                                            <span>{orderTimeStr}</span>
                                                        </div>
                                                    ) : <div />}

                                                    {/* Delivery Charge in Upper Right Corner */}
                                                    <div className="text-right shrink-0">
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 block leading-tight">
                                                            {t('Delivery Charge')}
                                                        </span>
                                                        {isFreeDelivery ? (
                                                            <div className="flex items-center justify-end gap-1.5 mt-0.5">
                                                                <span className="text-xl sm:text-2xl font-black text-black dark:text-white uppercase">
                                                                    {t('Free')}
                                                                </span>
                                                                <CartoonCoin size={22} />
                                                            </div>
                                                        ) : (
                                                            <div className="text-2xl sm:text-3xl font-black text-black dark:text-white tracking-tight font-sans leading-none mt-0.5">
                                                                ₹{deliveryCharge}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Left-Aligned Details: Name, Address, City, Items */}
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
                                                })()}
                                            </div>"""

if old_card_content in dd_code:
    dd_code = dd_code.replace(old_card_content, new_card_content)
    print("Replaced card content successfully!")
else:
    print("old_card_content not found directly, checking normalized")

# Update footer and bottom padding
old_footer = """            {/* Attached Bottom Rectangle Footer */}
            <div 
                className="fixed bottom-0 inset-x-0 z-40 w-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200/80 dark:border-gray-800 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] pointer-events-auto select-none"
                style={{ paddingBottom: 'calc(2.25rem + env(safe-area-inset-bottom, 20px))', paddingTop: '0.85rem' }}
            >
                <div className="max-w-md mx-auto px-4">
                    <SwipeActionButton
                        key={isFloatingEnabled ? 'disable-floating' : 'enable-floating'}
                        variant={isFloatingEnabled ? 'red' : 'amber'}
                        label={isFloatingEnabled ? t('Swipe to Disable') : t('Swipe to Enable')}
                        loadingLabel={isFloatingEnabled ? t('Disabling...') : t('Enabling...')}
                        onSuccess={toggleFloatingOverlay}
                        autoReset={true}
                        heightClass="h-[52px] sm:h-[56px]"
                        knobSizeClass="w-[42px] h-[42px] sm:w-[46px] sm:h-[46px]"
                    />
                </div>
            </div>"""

new_footer = """            {/* Attached Bottom Rectangle Footer */}
            <div 
                className="fixed bottom-0 inset-x-0 z-40 w-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200/80 dark:border-gray-800 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pointer-events-auto select-none"
                style={{ paddingBottom: 'calc(0.65rem + env(safe-area-inset-bottom, 10px))', paddingTop: '0.45rem' }}
            >
                <div className="max-w-xs sm:max-w-sm mx-auto px-4">
                    <SwipeActionButton
                        key={isFloatingEnabled ? 'disable-floating' : 'enable-floating'}
                        variant={isFloatingEnabled ? 'red' : 'amber'}
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

if old_footer in dd_code:
    dd_code = dd_code.replace(old_footer, new_footer)
    print("Replaced footer successfully!")
else:
    print("old_footer not found directly")

# Also update VIEW ORDER swipe button height and icon on card
dd_code = dd_code.replace(
    'heightClass="h-[56px] sm:h-[60px]"',
    'heightClass="h-[50px]"'
)
dd_code = dd_code.replace(
    'knobSizeClass="w-[44px] h-[44px] sm:w-[48px] sm:h-[48px]"',
    'knobSizeClass="w-[38px] h-[38px]"'
)

# Page padding
dd_code = dd_code.replace('pb-48', 'pb-28')
dd_code = dd_code.replace('pb-44', 'pb-24')

with open('src/pages/admin/DeliveryDashboard.jsx', 'w', encoding='utf-8') as f:
    f.write(dd_code)
print("Saved DeliveryDashboard.jsx")

