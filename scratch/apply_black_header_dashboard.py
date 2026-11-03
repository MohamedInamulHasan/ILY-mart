with open('src/pages/admin/DeliveryDashboard.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_header = """                                            {/* Upper Black Header Bar with Order ID, |, Clock Icon, Time, and X on right in white */}
                                            <div className="bg-black px-5 py-3 flex items-center justify-between text-white shrink-0">
                                                {/* Left: #Order ID | 🕒 Nov 6, 8.00 PM */}
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className="text-sm sm:text-[15px] font-black tracking-wide text-white font-mono shrink-0">
                                                        #{orderIdShort}
                                                    </span>
                                                    <span className="text-white/40 text-sm font-normal shrink-0">|</span>
                                                    <Clock size={16} className="text-white shrink-0" />
                                                    <span className="text-sm sm:text-[15px] font-bold text-white tracking-wide truncate">
                                                        {formatOrderBannerTime(order.createdAt || order.date) || orderTimeStr || t('New Order')}
                                                    </span>
                                                </div>

                                                {/* Right: X in White */}
                                                {!isCancelled && !isDelivered && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleCancelOrderClick(order);
                                                        }}
                                                        className="p-1 -mr-1 hover:bg-white/20 active:scale-90 rounded-full text-white transition-all flex items-center justify-center cursor-pointer shrink-0 ml-2"
                                                        title={t('Cancel')}
                                                    >
                                                        <X size={18} className="text-white stroke-[2.5]" />
                                                    </button>
                                                )}
                                            </div>
"""

# Replace lines 541 to 566 (inclusive)
# Find the start index:
start_idx = -1
end_idx = -1
for i, line in enumerate(lines):
    if 'bg-[#0284c7] px-5 py-2.5' in line:
        start_idx = i - 1 # including the comment line
        break

if start_idx != -1:
    for j in range(start_idx, start_idx + 35):
        if '</div>' in lines[j] and 'Card Content' in lines[j+2]:
            end_idx = j + 1
            break

print(f"Found indices: {start_idx} to {end_idx}")
if start_idx != -1 and end_idx != -1:
    lines[start_idx:end_idx] = [new_header]

    # Ensure import formatOrderBannerTime
    for i, l in enumerate(lines[:50]):
        if 'formatOrderDateTime' in l and 'formatOrderBannerTime' not in l:
            lines[i] = l.replace('formatOrderDateTime,', 'formatOrderDateTime, formatOrderBannerTime,')
            break

    with open('src/pages/admin/DeliveryDashboard.jsx', 'w', encoding='utf-8') as f:
        f.writelines(lines)
    print("SUCCESSFULLY APPLIED BLACK HEADER TO DeliveryDashboard.jsx")
else:
    print("Indices not found")

