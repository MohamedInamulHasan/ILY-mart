import re

# 1. Update DeliveryDashboard.jsx
dash_path = 'src/pages/admin/DeliveryDashboard.jsx'
with open(dash_path, 'r', encoding='utf-8') as f:
    dash = f.read()

pattern_dash = r'\{/\* Upper Header Bar matching button color with Order ID[\s\S]*?</div>'
match_dash = re.search(r'\{/\* Upper Header Bar matching button color[\s\S]*?</div>\s*</div>', dash)

# Let's inspect lines in dash around 540-575
dash_lines = dash.splitlines(True)
start_d = -1
end_d = -1
for i, l in enumerate(dash_lines):
    if 'Upper Header Bar matching button color' in l:
        start_d = i
        break

if start_d != -1:
    for j in range(start_d, start_d + 40):
        if '</div>' in dash_lines[j] and 'Card Content' in dash_lines[j+2]:
            end_d = j + 1
            break

print(f"DeliveryDashboard range: {start_d} to {end_d}")

new_dash_header = """                                            {/* Top Header Row: Clean text in black, X in black, and a black line below */}
                                            <div className="px-5 pt-4 pb-3 flex items-center justify-between text-black dark:text-white border-b border-black dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0">
                                                {/* Left: #Order ID | 🕒 Nov 6, 8.00 PM */}
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className="text-sm sm:text-[15px] font-black tracking-wide text-black dark:text-white font-mono shrink-0">
                                                        #{orderIdShort}
                                                    </span>
                                                    <span className="text-gray-400 dark:text-gray-500 text-sm font-normal shrink-0">|</span>
                                                    <Clock size={16} className="text-black dark:text-white shrink-0" />
                                                    <span className="text-sm sm:text-[15px] font-bold text-black dark:text-white tracking-wide truncate">
                                                        {formatOrderBannerTime(order.createdAt || order.date) || orderTimeStr || t('New Order')}
                                                    </span>
                                                </div>

                                                {/* Right: X in Black */}
                                                {!isCancelled && !isDelivered && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleCancelOrderClick(order);
                                                        }}
                                                        className="p-1 -mr-1 hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-90 rounded-full text-black dark:text-white transition-all flex items-center justify-center cursor-pointer shrink-0 ml-2"
                                                        title={t('Cancel')}
                                                    >
                                                        <X size={18} className="text-black dark:text-white stroke-[2.5]" />
                                                    </button>
                                                )}
                                            </div>
"""

if start_d != -1 and end_d != -1:
    dash_lines[start_d:end_d] = [new_dash_header]
    with open(dash_path, 'w', encoding='utf-8') as f:
        f.writelines(dash_lines)
    print("SUCCESS: Updated DeliveryDashboard.jsx")
else:
    print("FAILED: Could not find indices in DeliveryDashboard.jsx")


# 2. Update DeliveryOrdersFeedModal.jsx
feed_path = 'src/components/DeliveryOrdersFeedModal.jsx'
with open(feed_path, 'r', encoding='utf-8') as f:
    feed_lines = f.splitlines(True)

start_f = -1
end_f = -1
for i, l in enumerate(feed_lines):
    if 'Upper Header Bar matching button color' in l:
        start_f = i
        break

if start_f != -1:
    for j in range(start_f, start_f + 40):
        if '</div>' in feed_lines[j] and 'Card Content' in feed_lines[j+2]:
            end_f = j + 1
            break

print(f"DeliveryOrdersFeedModal range: {start_f} to {end_f}")

new_feed_header = """                                    {/* Top Header Row: Clean text in black, X in black, and a black line below */}
                                    <div className="px-5 pt-4 pb-3 flex items-center justify-between text-black dark:text-white border-b border-black dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0">
                                        {/* Left: #Order ID | 🕒 Nov 6, 8.00 PM */}
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="text-sm sm:text-[15px] font-black tracking-wide text-black dark:text-white font-mono shrink-0">
                                                #{orderIdShort}
                                            </span>
                                            <span className="text-gray-400 dark:text-gray-500 text-sm font-normal shrink-0">|</span>
                                            <Clock size={16} className="text-black dark:text-white shrink-0" />
                                            <span className="text-sm sm:text-[15px] font-bold text-black dark:text-white tracking-wide truncate">
                                                {formatOrderBannerTime(order.createdAt || order.date) || orderTimeStr || t('New Order')}
                                            </span>
                                        </div>

                                        {/* Right: Action button in black */}
                                        {isProcessing && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOrderToCancel(order);
                                                    setShowCancelPopup(true);
                                                }}
                                                title={t('Cancel Order')}
                                                className="p-1 -mr-1 hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-90 rounded-full text-black dark:text-white transition-all flex items-center justify-center cursor-pointer shrink-0 ml-2"
                                            >
                                                <X size={18} className="text-black dark:text-white stroke-[2.5]" />
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
                                                className="p-1 -mr-1 hover:bg-red-50 dark:hover:bg-red-950/40 active:scale-90 rounded-full text-red-500 transition-all flex items-center justify-center cursor-pointer shrink-0 ml-2"
                                            >
                                                <Trash2 size={18} className="stroke-[2.2]" />
                                            </button>
                                        )}
                                    </div>
"""

if start_f != -1 and end_f != -1:
    feed_lines[start_f:end_f] = [new_feed_header]
    with open(feed_path, 'w', encoding='utf-8') as f:
        f.writelines(feed_lines)
    print("SUCCESS: Updated DeliveryOrdersFeedModal.jsx")
else:
    print("FAILED: Could not find indices in DeliveryOrdersFeedModal.jsx")


# 3. Update IncomingOrderModal.jsx
modal_path = 'src/components/IncomingOrderModal.jsx'
with open(modal_path, 'r', encoding='utf-8') as f:
    modal_lines = f.splitlines(True)

# Compact view
start_m1 = -1
end_m1 = -1
for i, l in enumerate(modal_lines):
    if 'Upper Black Header Bar with Order ID' in l and i < 250:
        start_m1 = i
        break

if start_m1 != -1:
    for j in range(start_m1, start_m1 + 30):
        if '</div>' in modal_lines[j] and 'Delivery Charge Header' in modal_lines[j+2]:
            end_m1 = j + 1
            break

print(f"IncomingOrderModal compact range: {start_m1} to {end_m1}")

new_modal_compact_header = """                    {/* Top Header Row: Clean text in black, X in black, and a black line below */}
                    <div className="px-5 pt-3 pb-3 flex items-center justify-between text-black dark:text-white border-b border-black dark:border-gray-700 -mx-6 -mt-6 mb-4 rounded-t-[2.5rem] bg-white dark:bg-gray-800">
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm sm:text-[15px] font-black tracking-wide text-black dark:text-white font-mono shrink-0">
                                #{orderIdShort}
                            </span>
                            <span className="text-gray-400 dark:text-gray-500 text-sm font-normal shrink-0">|</span>
                            <Clock size={16} className="text-black dark:text-white shrink-0" />
                            <span className="text-sm sm:text-[15px] font-bold text-black dark:text-white tracking-wide truncate">
                                {formatOrderBannerTime(order.createdAt || order.date) || formattedOrderTime || t('New Order')}
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={handleDismissView}
                            title={t('Close')}
                            className="p-1 -mr-1 hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-90 rounded-full text-black dark:text-white transition-all flex items-center justify-center cursor-pointer shrink-0 ml-2"
                        >
                            <X size={18} className="text-black dark:text-white stroke-[2.5]" />
                        </button>
                    </div>
"""

if start_m1 != -1 and end_m1 != -1:
    modal_lines[start_m1:end_m1] = [new_modal_compact_header]

# Full accept view
start_m2 = -1
end_m2 = -1
for i, l in enumerate(modal_lines):
    if 'Upper Black Header Bar with Order ID' in l and i > 250:
        start_m2 = i
        break

if start_m2 != -1:
    for j in range(start_m2, start_m2 + 30):
        if '</div>' in modal_lines[j] and 'Top Delivery Charge Section' in modal_lines[j+2]:
            end_m2 = j + 1
            break

print(f"IncomingOrderModal accept range: {start_m2} to {end_m2}")

new_modal_accept_header = """                {/* Top Header Row: Clean text in black, X in black, and a black line below */}
                <div className="px-5 pt-4 pb-3 flex items-center justify-between text-black dark:text-white border-b border-black dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0">
                    <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm sm:text-[15px] font-black tracking-wide text-black dark:text-white font-mono shrink-0">
                            #{orderIdShort}
                        </span>
                        <span className="text-gray-400 dark:text-gray-500 text-sm font-normal shrink-0">|</span>
                        <Clock size={16} className="text-black dark:text-white shrink-0" />
                        <span className="text-sm sm:text-[15px] font-bold text-black dark:text-white tracking-wide truncate">
                            {formatOrderBannerTime(order.createdAt || order.date) || formattedOrderTime || t('New Order')}
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={handleDismissView}
                        title={t('Close')}
                        className="p-1 -mr-1 hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-90 rounded-full text-black dark:text-white transition-all flex items-center justify-center cursor-pointer shrink-0 ml-2"
                    >
                        <X size={18} className="text-black dark:text-white stroke-[2.5]" />
                    </button>
                </div>
"""

if start_m2 != -1 and end_m2 != -1:
    modal_lines[start_m2:end_m2] = [new_modal_accept_header]

with open(modal_path, 'w', encoding='utf-8') as f:
    f.writelines(modal_lines)
print("SUCCESS: Updated IncomingOrderModal.jsx")

