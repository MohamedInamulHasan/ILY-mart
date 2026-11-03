import os

file_path = 'src/pages/admin/DeliveryDashboard.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update import
old_import = "import { formatOrderDateTime, formatDeliveryTime } from '../../utils/dateUtils';"
new_import = "import { formatOrderDateTime, formatDeliveryTime, formatOrderBannerTime } from '../../utils/dateUtils';"
content = content.replace(old_import, new_import)

# 2. Find and replace header
old_block_part = 'bg-[#0284c7] px-5 py-2.5 flex items-center justify-between text-white shrink-0'
new_block = '''bg-black px-5 py-3 flex items-center justify-between text-white shrink-0">
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
                                            </div>'''

import re
pattern = r'bg\[#0284c7\] px-5 py-2\.5 flex items-center justify-between text-white shrink-0">[\s\S]*?</div>\s*</div>'
match = re.search(pattern, content)
if match:
    # replace up to the closing div of the header
    header_end = content.find('</div>', match.start())
    header_end = content.find('</div>', header_end + 6) # second closing div (inside header)
    header_end = content.find('</div>', header_end + 6) # outer header div
    old_full_header = content[match.start():header_end + 6]
    content = content[:match.start()] + new_block + content[header_end + 6:]
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("SUCCESSFULLY UPDATED DeliveryDashboard.jsx")
else:
    print("PATTERN NOT MATCHED")

