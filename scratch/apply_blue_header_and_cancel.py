with open('src/pages/admin/DeliveryDashboard.jsx', 'r', encoding='utf-8') as f:
    dd_code = f.read()

# 1. Add handleCancelOrderClick if not present
if "handleCancelOrderClick" not in dd_code:
    old_update = """    const updateStatus = async (id, newStatus) => {"""
    new_update = """    const handleCancelOrderClick = async (order) => {
        const orderIdShort = String(order._id || order.id || '000000').slice(-6).toUpperCase();
        const confirmed = window.confirm(`${t('Are you sure you want to cancel order')} #${orderIdShort}?`);
        if (!confirmed) return;

        try {
            await updateOrderStatus({ id: order._id || order.id, status: 'Cancelled' });
        } catch (error) {
            console.error('Error cancelling order:', error);
            alert(t('Failed to cancel order'));
        }
    };

    const updateStatus = async (id, newStatus) => {"""
    dd_code = dd_code.replace(old_update, new_update)

# 2. Update Card to include the Upper Blue Header Bar
old_card_header = """                                            {/* Card Content: Ordered time in top-left, Delivery Charge in center thick, Customer & address on left */}
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
                                                    </span>"""

new_card_header = """                                            {/* Upper Blue Header Bar like Image 1 with Date, Order Time and X on right in white */}
                                            <div className="bg-[#0284c7] px-5 py-2.5 flex items-center justify-between text-white shrink-0">
                                                {/* Date & Order Time in White on Left */}
                                                <div className="flex items-center gap-2">
                                                    <Clock size={14} className="text-white/95 shrink-0" />
                                                    <span className="text-xs sm:text-[13px] font-bold text-white tracking-wide">
                                                        {orderTimeStr || t('New Delivery Order')}
                                                    </span>
                                                </div>

                                                {/* X in White on Right */}
                                                {!isCancelled && !isDelivered && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleCancelOrderClick(order);
                                                        }}
                                                        className="p-1 -mr-1 hover:bg-white/20 active:scale-90 rounded-full text-white transition-all flex items-center justify-center cursor-pointer"
                                                        title={t('Cancel')}
                                                    >
                                                        <X size={17} className="text-white stroke-[2.5]" />
                                                    </button>
                                                )}
                                            </div>

                                            {/* Card Content: Delivery Charge in center thick, Customer & address on left */}
                                            <div className="pt-3.5 pb-3 px-5">
                                                {/* Delivery Charge and Price in Center Thick */}
                                                <div className="text-center py-1.5 mb-2 border-b border-gray-100 dark:border-gray-700/60">
                                                    <span className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-gray-600 dark:text-gray-300 block mb-0.5">
                                                        {t('Delivery Charge')}
                                                    </span>"""

if old_card_header in dd_code:
    dd_code = dd_code.replace(old_card_header, new_card_header)
    print("Replaced card header with upper blue header successfully!")
else:
    print("old_card_header not found, checking...")

with open('src/pages/admin/DeliveryDashboard.jsx', 'w', encoding='utf-8') as f:
    f.write(dd_code)
print("Saved DeliveryDashboard.jsx!")

