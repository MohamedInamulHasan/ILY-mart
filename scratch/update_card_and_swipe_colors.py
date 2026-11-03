# 1. Update SwipeActionButton.jsx
with open('src/components/SwipeActionButton.jsx', 'r', encoding='utf-8') as f:
    btn_code = f.read()

# Update getColors to support outline-white and black-shine
old_get_colors = """    // Color definitions based on variant
    const getColors = () => {
        switch (variant) {
            case 'yellow':
            case 'amber':
                return {
                    track: 'bg-amber-500 hover:bg-amber-600 border-amber-500',
                    knob: 'text-amber-600'
                };
            case 'blue':
            case 'sky':
                return {
                    track: 'bg-[#0284c7] hover:bg-[#0369a1] border-[#0284c7]',
                    knob: 'text-[#0284c7]'
                };
            case 'red':
            case 'rose':
                return {
                    track: 'bg-rose-600 hover:bg-rose-700 border-rose-600',
                    knob: 'text-rose-600'
                };
            case 'green':
            default:
                return {
                    track: 'bg-emerald-600 hover:bg-emerald-700 border-emerald-600',
                    knob: 'text-emerald-600'
                };
        }
    };"""

new_get_colors = """    // Color definitions based on variant
    const getColors = () => {
        switch (variant) {
            case 'outline-white':
            case 'white':
                return {
                    track: 'bg-white border-2 border-black',
                    text: 'text-black',
                    knob: 'text-black',
                    knobBg: 'bg-white border border-gray-300 shadow-sm',
                    sheen: 'via-gray-400/20'
                };
            case 'black-shine':
            case 'black':
                return {
                    track: 'bg-black border-2 border-black shadow-lg',
                    text: 'text-white',
                    knob: 'text-black',
                    knobBg: 'bg-white shadow-md',
                    sheen: 'via-white/40'
                };
            case 'yellow':
            case 'amber':
                return {
                    track: 'bg-amber-500 hover:bg-amber-600 border-amber-500',
                    text: 'text-white',
                    knob: 'text-amber-600',
                    knobBg: 'bg-white',
                    sheen: 'via-white/25'
                };
            case 'blue':
            case 'sky':
                return {
                    track: 'bg-[#0284c7] hover:bg-[#0369a1] border-[#0284c7]',
                    text: 'text-white',
                    knob: 'text-[#0284c7]',
                    knobBg: 'bg-white',
                    sheen: 'via-white/25'
                };
            case 'red':
            case 'rose':
                return {
                    track: 'bg-rose-600 hover:bg-rose-700 border-rose-600',
                    text: 'text-white',
                    knob: 'text-rose-600',
                    knobBg: 'bg-white',
                    sheen: 'via-white/25'
                };
            case 'green':
            default:
                return {
                    track: 'bg-emerald-600 hover:bg-emerald-700 border-emerald-600',
                    text: 'text-white',
                    knob: 'text-emerald-600',
                    knobBg: 'bg-white',
                    sheen: 'via-white/25'
                };
        }
    };"""

btn_code = btn_code.replace(old_get_colors, new_get_colors)

# Update track div, sheen, knob, label in SwipeActionButton
btn_code = btn_code.replace(
    'className={`relative w-full ${heightClass} rounded-full ${colors.track} text-white flex items-center p-1.5 overflow-hidden select-none border shadow-xs ${className}`}',
    'className={`relative w-full ${heightClass} rounded-full ${colors.track} ${colors.text || "text-white"} flex items-center p-1 overflow-hidden select-none shadow-xs ${className}`}'
)

btn_code = btn_code.replace(
    'className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none"',
    'className={`absolute inset-0 bg-gradient-to-r from-transparent ${colors.sheen || "via-white/25"} to-transparent pointer-events-none`}'
)

btn_code = btn_code.replace(
    'className={`${knobSizeClass} rounded-full bg-white ${colors.knob} flex items-center justify-center shrink-0 z-20 cursor-grab active:cursor-grabbing select-none shadow-md`}',
    'className={`${knobSizeClass} rounded-full ${colors.knobBg || "bg-white"} ${colors.knob} flex items-center justify-center shrink-0 z-20 cursor-grab active:cursor-grabbing select-none shadow-md`}'
)

btn_code = btn_code.replace(
    '<span className={`font-black ${textSizeClass} tracking-wider uppercase text-white text-center select-none truncate`}>',
    '<span className={`font-black ${textSizeClass} tracking-wider uppercase ${colors.text || "text-white"} text-center select-none truncate`}>'
)

with open('src/components/SwipeActionButton.jsx', 'w', encoding='utf-8') as f:
    f.write(btn_code)
print("Updated SwipeActionButton.jsx with outline-white and black-shine!")


# 2. Update DeliveryDashboard.jsx
with open('src/pages/admin/DeliveryDashboard.jsx', 'r', encoding='utf-8') as f:
    dd_code = f.read()

# Update card content
old_card_content = """                                            {/* Card Content: Ordered time in top-left, Delivery Charge in top-right, Customer & address on left */}
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

new_card_content = """                                            {/* Card Content: Ordered time in top-left, Delivery Charge in center thick, Customer & address on left */}
                                            <div className="pt-3.5 pb-3 px-5">
                                                {/* Ordered Time & Date in Upper Left Corner */}
                                                {orderTimeStr && (
                                                    <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 text-left">
                                                        <Clock size={13} className="text-gray-400 dark:text-gray-500 shrink-0" />
                                                        <span>{orderTimeStr}</span>
                                                    </div>
                                                )}

                                                {/* Delivery Charge and Price in Center Thick */}
                                                <div className="text-center py-1.5 my-1 border-b border-gray-100 dark:border-gray-700/60">
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

dd_code = dd_code.replace(old_card_content, new_card_content)

# Update footer button variants: 'black-shine' for isFloatingEnabled, 'outline-white' for disabled
dd_code = dd_code.replace(
    "variant={isFloatingEnabled ? 'red' : 'amber'}",
    "variant={isFloatingEnabled ? 'black-shine' : 'outline-white'}"
)

with open('src/pages/admin/DeliveryDashboard.jsx', 'w', encoding='utf-8') as f:
    f.write(dd_code)
print("Updated DeliveryDashboard.jsx with center thick charge and outline-white/black-shine button!")

