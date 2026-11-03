# 1. Update DeliveryDashboard.jsx
dash_path = 'src/pages/admin/DeliveryDashboard.jsx'
with open(dash_path, 'r', encoding='utf-8') as f:
    dash_lines = f.readlines()

new_dash_header = """                                            {/* Top Header Row: Time Left, ID Right, no X, grey line not touching edges */}
                                            <div className="px-5 pt-4 pb-2.5 flex items-center justify-between text-black dark:text-white bg-white dark:bg-gray-800 shrink-0">
                                                {/* Left: 🕒 Nov 6, 8.00 PM */}
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <Clock size={16} className="text-gray-900 dark:text-white shrink-0" />
                                                    <span className="text-sm sm:text-[15px] font-bold text-gray-900 dark:text-white tracking-wide truncate">
                                                        {formatOrderBannerTime(order.createdAt || order.date) || orderTimeStr || t('New Order')}
                                                    </span>
                                                </div>

                                                {/* Right: #Order ID (No X) */}
                                                <span className="text-sm sm:text-[15px] font-black tracking-wide text-gray-900 dark:text-white font-mono shrink-0">
                                                    #{orderIdShort}
                                                </span>
                                            </div>
                                            {/* Grey line not touching left and right edges */}
                                            <div className="mx-5 h-[1px] bg-gray-200 dark:bg-gray-700 shrink-0" />
"""

start_d = -1
end_d = -1
for i, l in enumerate(dash_lines):
    if 'Top Header Row:' in l:
        start_d = i
        break

if start_d != -1:
    for j in range(start_d, start_d + 40):
        if '</div>' in dash_lines[j] and 'Card Content' in dash_lines[j+2]:
            end_d = j + 1
            break

print(f"DeliveryDashboard: {start_d} to {end_d}")
if start_d != -1 and end_d != -1:
    dash_lines[start_d:end_d] = [new_dash_header]
    with open(dash_path, 'w', encoding='utf-8') as f:
        f.writelines(dash_lines)
    print("SUCCESS: Updated DeliveryDashboard.jsx")


# 2. Update DeliveryOrdersFeedModal.jsx
feed_path = 'src/components/DeliveryOrdersFeedModal.jsx'
with open(feed_path, 'r', encoding='utf-8') as f:
    feed_lines = f.readlines()

new_feed_header = """                                    {/* Top Header Row: Time Left, ID Right, no X, grey line not touching edges */}
                                    <div className="px-5 pt-4 pb-2.5 flex items-center justify-between text-black dark:text-white bg-white dark:bg-gray-800 shrink-0">
                                        {/* Left: 🕒 Nov 6, 8.00 PM */}
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <Clock size={16} className="text-gray-900 dark:text-white shrink-0" />
                                            <span className="text-sm sm:text-[15px] font-bold text-gray-900 dark:text-white tracking-wide truncate">
                                                {formatOrderBannerTime(order.createdAt || order.date) || orderTimeStr || t('New Order')}
                                            </span>
                                        </div>

                                        {/* Right: #Order ID (and optional trash for cancelled, no X) */}
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="text-sm sm:text-[15px] font-black tracking-wide text-gray-900 dark:text-white font-mono shrink-0">
                                                #{orderIdShort}
                                            </span>
                                            {isCancelled && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOrderToDelete(order);
                                                        setShowDeletePopup(true);
                                                    }}
                                                    title={t('Delete Cancelled Order')}
                                                    className="p-1 -mr-1 hover:bg-red-50 dark:hover:bg-red-950/40 active:scale-90 rounded-full text-red-500 transition-all flex items-center justify-center cursor-pointer"
                                                >
                                                    <Trash2 size={16} className="stroke-[2.2]" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    {/* Grey line not touching left and right edges */}
                                    <div className="mx-5 h-[1px] bg-gray-200 dark:bg-gray-700 shrink-0" />
"""

start_f = -1
end_f = -1
for i, l in enumerate(feed_lines):
    if 'Top Header Row:' in l:
        start_f = i
        break

if start_f != -1:
    for j in range(start_f, start_f + 40):
        if '</div>' in feed_lines[j] and 'Card Content' in feed_lines[j+2]:
            end_f = j + 1
            break

print(f"DeliveryOrdersFeedModal: {start_f} to {end_f}")
if start_f != -1 and end_f != -1:
    feed_lines[start_f:end_f] = [new_feed_header]
    with open(feed_path, 'w', encoding='utf-8') as f:
        f.writelines(feed_lines)
    print("SUCCESS: Updated DeliveryOrdersFeedModal.jsx")


# 3. Update IncomingOrderModal.jsx
modal_path = 'src/components/IncomingOrderModal.jsx'
with open(modal_path, 'r', encoding='utf-8') as f:
    modal_lines = f.readlines()

# Compact view: When app is closed and delivery boy receives order: ID Left, X Right, Grey line below
new_modal_compact_header = """                    {/* Compact View when app closed: ID Left, X Right, grey line not touching edges */}
                    <div className="px-5 pt-3 pb-2.5 flex items-center justify-between text-black dark:text-white -mx-6 -mt-6 rounded-t-[2.5rem] bg-white dark:bg-gray-800">
                        {/* Left: #Order ID */}
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm sm:text-[15px] font-black tracking-wide text-gray-900 dark:text-white font-mono shrink-0">
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
                    <div className="mx-2 h-[1px] bg-gray-200 dark:bg-gray-700 mb-3 shrink-0" />
"""

start_m1 = -1
end_m1 = -1
for i, l in enumerate(modal_lines):
    if 'Top Header Row:' in l and i < 250:
        start_m1 = i
        break

if start_m1 != -1:
    for j in range(start_m1, start_m1 + 30):
        if '</div>' in modal_lines[j] and 'Delivery Charge Header' in modal_lines[j+2]:
            end_m1 = j + 1
            break

print(f"IncomingOrderModal compact: {start_m1} to {end_m1}")
if start_m1 != -1 and end_m1 != -1:
    modal_lines[start_m1:end_m1] = [new_modal_compact_header]

# Accept view: Time Left, ID Right, NO X, Grey line below
new_modal_accept_header = """                {/* Full Accept View: Time Left, ID Right, no X, grey line not touching edges */}
                <div className="px-5 pt-4 pb-2.5 flex items-center justify-between text-black dark:text-white bg-white dark:bg-gray-800 shrink-0">
                    {/* Left: 🕒 Nov 6, 8.00 PM */}
                    <div className="flex items-center gap-1.5 min-w-0">
                        <Clock size={16} className="text-gray-900 dark:text-white shrink-0" />
                        <span className="text-sm sm:text-[15px] font-bold text-gray-900 dark:text-white tracking-wide truncate">
                            {formatOrderBannerTime(order.createdAt || order.date) || formattedOrderTime || t('New Order')}
                        </span>
                    </div>

                    {/* Right: #Order ID (No X) */}
                    <span className="text-sm sm:text-[15px] font-black tracking-wide text-gray-900 dark:text-white font-mono shrink-0">
                        #{orderIdShort}
                    </span>
                </div>
                {/* Grey line not touching left and right edges */}
                <div className="mx-5 h-[1px] bg-gray-200 dark:bg-gray-700 shrink-0" />
"""

start_m2 = -1
end_m2 = -1
for i, l in enumerate(modal_lines):
    if 'Top Header Row:' in l and i > 250:
        start_m2 = i
        break

if start_m2 != -1:
    for j in range(start_m2, start_m2 + 30):
        if '</div>' in modal_lines[j] and 'Top Delivery Charge Section' in modal_lines[j+2]:
            end_m2 = j + 1
            break

print(f"IncomingOrderModal accept: {start_m2} to {end_m2}")
if start_m2 != -1 and end_m2 != -1:
    modal_lines[start_m2:end_m2] = [new_modal_accept_header]

with open(modal_path, 'w', encoding='utf-8') as f:
    f.writelines(modal_lines)
print("SUCCESS: Updated IncomingOrderModal.jsx")
print("ALL DONE FAST!")

