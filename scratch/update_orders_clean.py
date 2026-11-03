import os

orders_path = r'src\pages\Orders.jsx'
with open(orders_path, 'r', encoding='utf-8') as f:
    c = f.read().replace('\r\n', '\n')

# 1. Tabs
old_tabs = """                        {/* Tabs */}
                        <div className="flex overflow-x-auto pb-4 mb-4 scrollbar-hide gap-3 w-full">
                            {tabs.map(tab => (
                                <button
                                    key={tab}
                                    id={activeTab === tab ? "active-order-tab" : undefined}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-5 py-2.5 rounded-full text-[13px] font-bold whitespace-nowrap transition-colors duration-300 ${activeTab === tab
                                        ? 'bg-[#2E5A2E] dark:bg-[#CBF9B2] text-white dark:text-gray-900'
                                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-transparent'
                                        }`}
                                >
                                    {t(tab)}
                                </button>
                            ))}
                        </div>"""

new_tabs = """                        {/* Tabs - perfectly fit mobile screen left to right */}
                        <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mb-3.5 w-full">
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

if old_tabs in c:
    c = c.replace(old_tabs, new_tabs)
    print("Tabs replaced!")
else:
    print("WARNING: old_tabs not found")

# 2. Date in order card
old_date = """                                                            <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 truncate">
                                                                {formatOrderDateTime(order.createdAt || order.date)}
                                                                {order.scheduledDeliveryTime && (
                                                                    <span className="text-[#2E5A2E] dark:text-[#CBF9B2] ml-1">
                                                                        • {formatDeliveryTime(order.scheduledDeliveryTime)}
                                                                    </span>
                                                                )}
                                                            </p>"""

new_date = """                                                            <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 truncate">
                                                                {formatOrderDateTime(order.createdAt || order.date)}
                                                            </p>"""

if old_date in c:
    c = c.replace(old_date, new_date)
    print("Date line replaced!")
else:
    print("WARNING: old_date not found")

# 3. Product image size and remove tags
old_img_block = """                                                            <div className="h-16 w-16 rounded-2xl bg-gray-50 border border-gray-100 dark:border-gray-700 overflow-hidden flex-shrink-0 relative">
                                                                <img
                                                                    src={item.image && (item.image.startsWith('http') || item.image.startsWith('data:'))
                                                                        ? item.image
                                                                        : ((item.product?._id || item.product)
                                                                            ? `${API_BASE_URL}/products/${item.product._id || item.product}/image`
                                                                            : "https://via.placeholder.com/150?text=No+Image")}
                                                                    alt={item.adTitle || item.name}
                                                                    className="h-full w-full object-cover"
                                                                    loading="lazy"
                                                                    onError={(e) => { e.target.onerror = null; e.target.src = "https://via.placeholder.com/150?text=No+Image"; }}
                                                                />
                                                                <div className="absolute top-0 left-0 flex flex-col items-start gap-0 z-10">
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
                                                                </div>
                                                            </div>"""

new_img_block = """                                                            <div className="h-14 w-14 rounded-xl bg-gray-50 border border-gray-100 dark:border-gray-700 overflow-hidden flex-shrink-0 relative">
                                                                <img
                                                                    src={item.image && (item.image.startsWith('http') || item.image.startsWith('data:'))
                                                                        ? item.image
                                                                        : ((item.product?._id || item.product)
                                                                            ? `${API_BASE_URL}/products/${item.product._id || item.product}/image`
                                                                            : "https://via.placeholder.com/150?text=No+Image")}
                                                                    alt={item.adTitle || item.name}
                                                                    className="h-full w-full object-cover"
                                                                    loading="lazy"
                                                                    onError={(e) => { e.target.onerror = null; e.target.src = "https://via.placeholder.com/150?text=No+Image"; }}
                                                                />
                                                            </div>"""

if old_img_block in c:
    c = c.replace(old_img_block, new_img_block)
    print("Img block and tags updated!")
else:
    print("WARNING: old_img_block not found")

# 4. Card padding and spacing
c = c.replace(
    '<div className="p-6">',
    '<div className="p-4 sm:p-5">'
)
c = c.replace(
    '<div className="flex justify-between items-start gap-2 mb-4">',
    '<div className="flex justify-between items-start gap-2 mb-3 pb-2 border-b border-gray-100/60 dark:border-gray-700/40">'
)
c = c.replace(
    '<div key={idx} className="py-4 flex items-center gap-4 first:pt-0">',
    '<div key={idx} className="py-2.5 flex items-center gap-3">'
)
c = c.replace(
    '<div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-end mb-1">',
    '<div className="mt-2.5 pt-2.5 border-t border-gray-100 dark:border-gray-700/80 flex justify-between items-center">'
)

with open(orders_path, 'w', encoding='utf-8') as f:
    f.write(c)
print("Orders.jsx fully updated!")

