import subprocess

# Get base content from commit 9116b9b
res = subprocess.run(['git', 'show', '9116b9b:src/pages/Orders.jsx'], stdout=subprocess.PIPE, text=True, encoding='utf-8')
content = res.stdout.replace('\r\n', '\n')

# 1. Update getStatusText
old_status = """    const getStatusText = (status) => {
        if (status === 'Out for Delivery' || status === 'Shipped') {
            return t('Accepted');
        }
        return t(status);
    };"""
new_status = """    const getStatusText = (status) => {
        return t(status);
    };"""
content = content.replace(old_status, new_status)

# 2. Update tabs to grid grid-cols-4
old_tabs = """                    {/* Tabs */}
                    <div className="flex overflow-x-auto pb-2 mb-3 scrollbar-hide gap-2 sm:gap-2.5 w-full">
                        {tabs.map(tab => (
                            <button
                                key={tab}
                                id={activeTab === tab ? "active-order-tab" : undefined}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-1.5 sm:px-4.5 sm:py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-300 shadow-sm ${
                                    activeTab === tab
                                    ? 'bg-[#2E5A2E] dark:bg-[#CBF9B2] text-white dark:text-gray-900'
                                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-700/60'
                                }`}
                            >
                                {t(tab)}
                            </button>
                        ))}
                    </div>"""

new_tabs = """                    {/* Tabs - perfectly fit mobile screen left to right */}
                    <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mb-3 w-full">
                        {tabs.map(tab => (
                            <button
                                key={tab}
                                id={activeTab === tab ? "active-order-tab" : undefined}
                                onClick={() => setActiveTab(tab)}
                                className={`w-full py-2 px-1 text-center rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-300 shadow-sm ${
                                    activeTab === tab
                                    ? 'bg-[#2E5A2E] dark:bg-[#CBF9B2] text-white dark:text-gray-900'
                                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-700/60'
                                }`}
                            >
                                {t(tab)}
                            </button>
                        ))}
                    </div>"""
content = content.replace(old_tabs, new_tabs)

# 3. Clean date (remove extra scheduled time)
old_date = """                                                    <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 truncate">
                                                        {formatOrderDateTime(order.createdAt || order.date)}
                                                        {order.scheduledDeliveryTime && (
                                                            <span className="text-[#2E5A2E] dark:text-[#CBF9B2] ml-1">
                                                                • {formatDeliveryTime(order.scheduledDeliveryTime)}
                                                            </span>
                                                        )}
                                                    </p>"""

new_date = """                                                    <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 truncate">
                                                        {formatOrderDateTime(order.createdAt || order.date)}
                                                    </p>"""
content = content.replace(old_date, new_date)

# 4. Remove image overlay tags
old_tags = """                                                        <div className="absolute top-0 left-0 flex flex-col items-start gap-0 z-10">
                                                            {((item.isGold) || (item.product && item.product.isGold)) && (
                                                                <span className="bg-[#16A34A] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-br-lg mb-[1px]">
                                                                    {t('Free Delivery')}
                                                                </span>
                                                            )}
                                                            {item.isFromAd && !item.isGold && !(item.product && item.product.isGold) && (
                                                                <span className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-br-lg">
                                                                    {t('Special Offer')}
                                                                </span>
                                                            )}
                                                        </div>"""
content = content.replace(old_tags, "")

with open(r'src\pages\Orders.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Orders.jsx successfully generated from clean base with all user requirements!")

