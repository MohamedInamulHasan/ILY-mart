import re

# 1. Update SwipeActionButton.jsx: Remove shake and shine effects
swipe_path = 'src/components/SwipeActionButton.jsx'
with open(swipe_path, 'r', encoding='utf-8') as f:
    swipe_content = f.read()

# Remove shine effect motion.div
shine_pattern = r'\{\s*/\*\s*Continuous sliding light sheen animation from left to right\s*\*/\s*\}[\s\S]*?<motion\.div[\s\S]*?/>'
swipe_content = re.sub(shine_pattern, '', swipe_content)

# Remove shake animation on knob:
old_animate = """                animate={
                    isLoading || isCompleted
                        ? { x: maxDrag }
                        : isDragging
                        ? undefined
                        : {
                            x: [0, 9, -2, 7, 0, 0, 0, 0]
                        }
                }
                transition={
                    isLoading || isCompleted
                        ? { type: 'spring', damping: 25, stiffness: 200 }
                        : isDragging
                        ? undefined
                        : {
                            repeat: Infinity,
                            repeatDelay: 1.8,
                            duration: 1.1,
                            ease: 'easeInOut'
                        }
                }"""

new_animate = """                animate={
                    isLoading || isCompleted
                        ? { x: maxDrag }
                        : { x: 0 }
                }
                transition={
                    isLoading || isCompleted
                        ? { type: 'spring', damping: 25, stiffness: 200 }
                        : { type: 'spring', damping: 30, stiffness: 350 }
                }"""

if old_animate in swipe_content:
    swipe_content = swipe_content.replace(old_animate, new_animate)
    print("SUCCESS: Removed shake and shine from SwipeActionButton.jsx")
else:
    print("Could not find old_animate in SwipeActionButton.jsx")

with open(swipe_path, 'w', encoding='utf-8') as f:
    f.write(swipe_content)


# 2. Update DeliveryOrdersFeedModal.jsx
feed_path = 'src/components/DeliveryOrdersFeedModal.jsx'
with open(feed_path, 'r', encoding='utf-8') as f:
    feed_lines = f.readlines()

start_f = -1
end_f = -1
for i, l in enumerate(feed_lines):
    if 'Upper Header Bar matching button color' in l or 'Upper Black Header Bar' in l:
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
    modal_lines = f.readlines()

# Compact view
start_m1 = -1
end_m1 = -1
for i, l in enumerate(modal_lines):
    if ('Upper Black Header Bar with Order ID' in l or 'Upper Header Bar' in l) and i < 250:
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
    if ('Upper Black Header Bar with Order ID' in l or 'Upper Header Bar' in l) and i > 250:
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
print("ALL DONE FAST!")

