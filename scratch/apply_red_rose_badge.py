with open('src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = """            {/* Floating Delivery Charge Card - right side (Leaf Green) */}
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

replacement = """            {/* Floating Delivery Charge Card - right side (Red Rose Gradient Shine) */}
            {showFloatingDeliveryBadge && (
                <Link
                    to="/cart"
                    className="fixed right-0 top-[25%] -translate-y-1/2 z-[90] active:scale-95 transition-transform"
                    title={t('View Cart')}
                >
                    <div
                        className="rounded-l-2xl py-2 px-3 flex flex-col items-center shadow-xl border-2 border-r-0 border-white text-center bg-gradient-to-br from-[#E11D48] via-[#BE123C] to-[#881337] relative overflow-hidden animate-shine"
                    >
                        {/* Top edge glossy highlight */}
                        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-white/70 via-white/30 to-transparent pointer-events-none" />
                        
                        <span className="text-[10px] font-black text-white/95 uppercase tracking-wider mb-0.5 select-none leading-none drop-shadow-xs relative z-10">
                            {t('Delivery')}
                        </span>
                        <span className="text-[14px] font-black text-white select-none leading-none drop-shadow-sm relative z-10">
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
    print('Successfully applied red rose gradient shine look in App.jsx!')
else:
    print('Target not found in content!')

