import os

# 1. Update Orders.jsx
orders_path = r'src\pages\Orders.jsx'
with open(orders_path, 'r', encoding='utf-8') as f:
    orders = f.read().replace('\r\n', '\n')

# 1A. Make tabs grid grid-cols-4 fitting edge-to-edge
old_tabs_block = """                    {/* Tabs */}
                    <div className="flex overflow-x-auto pb-2 mb-3 scrollbar-hide gap-2 sm:gap-2.5 w-full">
                        {tabs.map(tab => (
                            <button
                                key={tab}
                                id={activeTab === tab ? "active-order-tab" : undefined}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-1.5 sm:px-5 sm:py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-300 shadow-sm ${
                                    activeTab === tab
                                    ? 'bg-[#2E5A2E] dark:bg-[#CBF9B2] text-white dark:text-gray-900'
                                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-700/60'
                                }`}
                            >
                                {t(tab)}
                            </button>
                        ))}
                    </div>"""

new_tabs_block = """                    {/* Tabs - Perfectly fit screen left to right */}
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

if old_tabs_block in orders:
    orders = orders.replace(old_tabs_block, new_tabs_block)
    print("Orders tabs replaced with edge-to-edge grid!")
else:
    print("WARNING: old_tabs_block not found!")

# 1B. Remove extra scheduled timeNov 3 (11PM / 5PM...)
old_date_block = """                                                    <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 truncate">
                                                        {formatOrderDateTime(order.createdAt || order.date)}
                                                        {order.scheduledDeliveryTime && (
                                                            <span className="text-[#2E5A2E] dark:text-[#CBF9B2] ml-1">
                                                                • {formatDeliveryTime(order.scheduledDeliveryTime)}
                                                            </span>
                                                        )}
                                                    </p>"""

new_date_block = """                                                    <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 truncate">
                                                        {formatOrderDateTime(order.createdAt || order.date)}
                                                    </p>"""

if old_date_block in orders:
    orders = orders.replace(old_date_block, new_date_block)
    print("Orders date block cleaned (extra scheduled time removed)!")
else:
    print("WARNING: old_date_block not found!")

# 1C. Ensure getStatusText shows Processing without being overridden
old_status_text = """    const getStatusText = (status) => {
        if (status === 'Out for Delivery' || status === 'Shipped') {
            return t('Accepted');
        }
        return t(status);
    };"""

new_status_text = """    const getStatusText = (status) => {
        return t(status);
    };"""

if old_status_text in orders:
    orders = orders.replace(old_status_text, new_status_text)
    print("getStatusText updated to show true status including Processing!")

# 1D. Remove overlay tags (Free Delivery / Special Offer) on order product images
old_img_tags = """                                                        <div className="absolute top-0 left-0 flex flex-col items-start gap-0 z-10">
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

if old_img_tags in orders:
    orders = orders.replace(old_img_tags, "")
    print("Orders product image tags removed!")

with open(orders_path, 'w', encoding='utf-8') as f:
    f.write(orders)

# 2. Update Cart.jsx padding and card sizing
cart_path = r'src\pages\Cart.jsx'
with open(cart_path, 'r', encoding='utf-8') as f:
    cart = f.read().replace('\r\n', '\n')

# Ensure card padding is p-3 sm:p-3.5 with clean gap
cart = cart.replace('rounded-2xl p-2.5 sm:p-3 flex gap-3', 'rounded-2xl p-3 sm:p-3.5 flex gap-3.5')
cart = cart.replace('h-[74px] w-[78px]', 'h-[78px] w-[82px]')
cart = cart.replace('h-[74px] sm:h-[80px]', 'h-[78px] sm:h-[82px]')

# Also remove overlay tags from Cart product images
cart_tags = """                                  <div className="absolute top-0 left-0 flex flex-col items-start gap-0 z-10">
                                      {item.isGold && (
                                          <span className="bg-[#16A34A] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-br-lg shadow-sm mb-[1px]">
                                              {t('Free Delivery')}
                                          </span>
                                      )}
                                      {item.isFromAd && (
                                          <span className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-br-lg shadow-sm">
                                              {t('Special Offer')}
                                          </span>
                                      )}
                                  </div>"""
if cart_tags in cart:
    cart = cart.replace(cart_tags, "")
    print("Cart product image tags removed!")

with open(cart_path, 'w', encoding='utf-8') as f:
    f.write(cart)

