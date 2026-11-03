path = 'src/components/DeliveryOrdersFeedModal.jsx'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_header = """                                    {/* Top Header Row: Clean text in black, X in black, and a black line below */}
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

start_f = -1
end_f = -1
for i, l in enumerate(lines):
    if 'Upper Header Bar matching button color' in l:
        start_f = i
        break

if start_f != -1:
    for j in range(start_f, start_f + 60):
        if '</div>' in lines[j] and 'Card Content' in lines[j+2]:
            end_f = j + 1
            break

print(f'{start_f} to {end_f}')
if start_f != -1 and end_f != -1:
    lines[start_f:end_f] = [new_header]
    with open(path, 'w', encoding='utf-8') as f:
        f.writelines(lines)
    print('SUCCESS FEED')
else:
    print('Indices not found in feed')

