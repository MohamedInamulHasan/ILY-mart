path = 'src/components/DeliveryOrdersFeedModal.jsx'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_header = """                                    {/* Top Header Row: Time Left, ID Right, no X, grey line not touching edges */}
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
for i, l in enumerate(lines):
    if 'Top Header Row:' in l:
        start_f = i
        break

if start_f != -1:
    for j in range(start_f, start_f + 50):
        if 'Card Content:' in lines[j]:
            end_f = j - 1
            break

print(f'{start_f} to {end_f}')
if start_f != -1 and end_f != -1:
    lines[start_f:end_f] = [new_header]
    with open(path, 'w', encoding='utf-8') as f:
        f.writelines(lines)
    print("SUCCESS: Updated DeliveryOrdersFeedModal.jsx")

