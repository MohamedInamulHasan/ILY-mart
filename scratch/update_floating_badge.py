with open('src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = """            {/* Floating Quick-Commerce Speed Pill - right side */}
            {showFloatingDeliveryBadge && (
                <Link
                    to="/cart"
                    className="fixed right-0 top-[26%] -translate-y-1/2 z-[90] group active:scale-95 transition-transform"
                    title={t('View Cart')}
                >
                    <div className="relative flex items-center pl-3.5 pr-2.5 py-2 bg-gradient-to-l from-black via-gray-950 to-gray-900 text-white rounded-l-full shadow-[-4px_6px_20px_rgba(0,0,0,0.35)] border-y border-l border-white/20 dark:border-white/10 overflow-hidden">
                        {/* Speed Sheen Highlight */}
                        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-[#CBF9B2]/60 via-white/20 to-transparent" />
                        
                        {/* Bike Icon with pulsing green status dot */}
                        <div className="relative mr-2.5 flex items-center justify-center shrink-0">
                            <div className="w-7 h-7 rounded-full bg-white/10 dark:bg-white/15 flex items-center justify-center text-[#CBF9B2]">
                                <Bike size={15} className="stroke-[2.2]" />
                            </div>
                            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#CBF9B2] opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#CBF9B2]"></span>
                            </span>
                        </div>

                        {/* Delivery Info */}
                        <div className="flex flex-col items-start select-none pr-1">
                            <span className="text-[9px] font-bold tracking-wider text-gray-400 uppercase leading-none mb-1">
                                {t('Delivery')}
                            </span>
                            {deliveryCharge === 0 ? (
                                <span className="text-[13px] font-black tracking-tight text-[#CBF9B2] leading-none">
                                    {t('FREE')}
                                </span>
                            ) : (
                                <span className="text-[14px] font-black tracking-tight text-white leading-none">
                                    ₹{deliveryCharge}
                                </span>
                            )}
                        </div>
                    </div>
                </Link>
            )}"""

replacement = """            {/* Floating Delivery Charge Card - right side (Leaf Green) */}
            {showFloatingDeliveryBadge && (
                <Link
                    to="/cart"
                    className="fixed right-0 top-[25%] -translate-y-1/2 z-[90] active:scale-95 transition-transform"
                    title={t('View Cart')}
                >
                    <div
                        className="rounded-l-2xl py-2 px-3 flex flex-col items-center shadow-lg border-2 border-r-0 border-white text-center bg-[#2E5A2E]"
                    >
                        <span className="text-[10px] font-bold text-white/90 uppercase tracking-wider mb-0.5 select-none leading-none">
                            {t('Delivery')}
                        </span>
                        <span className="text-[14px] font-black text-white select-none leading-none">
                            {deliveryCharge === 0 ? t('Free') : `₹${deliveryCharge}`}
                        </span>
                    </div>
                </Link>
            )}"""

content_norm = content.replace('\r\n', '\n')
target_norm = target.replace('\r\n', '\n')
if target_norm in content_norm:
    new_content = content_norm.replace(target_norm, replacement)
    with open('src/App.jsx', 'w', encoding='utf-8', newline='\r\n') as f:
        f.write(new_content)
    print('Successfully reverted to old design with leaf green in App.jsx!')
else:
    print('Target not found in content!')
