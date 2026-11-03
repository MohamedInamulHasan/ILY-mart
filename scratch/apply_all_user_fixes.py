import sys
import re

print("Starting fixes...")

# 1. src/pages/Orders.jsx: Fix pills to grid grid-cols-4 w-full
orders_path = r'src/pages/Orders.jsx'
with open(orders_path, 'r', encoding='utf-8') as f:
    orders_content = f.read()

# Replace flex overflow tabs with grid cols 4
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

new_tabs_block = """                    {/* Tabs - perfectly fit mobile screen left to right */}
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

if old_tabs_block in orders_content:
    orders_content = orders_content.replace(old_tabs_block, new_tabs_block)
    print("Replaced tabs in Orders.jsx")
else:
    print("WARN: Could not find exact tabs block in Orders.jsx, using regex")
    orders_content = re.sub(
        r'\{\/\* Tabs \*\/\}\s*<div className="flex overflow-x-auto[^>]*>.*?<\/div>',
        new_tabs_block.strip(),
        orders_content,
        flags=re.DOTALL
    )

with open(orders_path, 'w', encoding='utf-8') as f:
    f.write(orders_content)

# 2. src/App.jsx: Hide floating delivery badge on cart, checkout, orders, order confirmation
app_path = r'src/App.jsx'
with open(app_path, 'r', encoding='utf-8') as f:
    app_content = f.read()

old_badge_calc = "const showFloatingDeliveryBadge = cartItems && cartItems.length > 0 && !isAdminRoute && !isAuthPage;"
new_badge_calc = """const hideFloatingBadgeRoutes = ['/cart', '/checkout', '/order-confirmation'];
    const showFloatingDeliveryBadge = cartItems && cartItems.length > 0 && !isAdminRoute && !isAuthPage && !hideFloatingBadgeRoutes.includes(location.pathname) && !location.pathname.startsWith('/order');"""

if old_badge_calc in app_content:
    app_content = app_content.replace(old_badge_calc, new_badge_calc)
    print("Updated showFloatingDeliveryBadge in App.jsx")
else:
    print("showFloatingDeliveryBadge already modified or not found")

with open(app_path, 'w', encoding='utf-8') as f:
    f.write(app_content)

# 3. src/pages/Cart.jsx: Compact card gaps and inner padding
cart_path = r'src/pages/Cart.jsx'
with open(cart_path, 'r', encoding='utf-8') as f:
    cart_content = f.read()

# Replace padding and spacing in Cart.jsx
cart_content = cart_content.replace(
    'px-4 sm:px-5 pt-[88px] pb-10',
    'px-3.5 sm:px-4 pt-[80px] pb-8'
)
cart_content = cart_content.replace(
    'space-y-2.5 sm:space-y-3 mb-3.5 sm:mb-4',
    'space-y-2 sm:space-y-2.5 mb-3'
)
cart_content = cart_content.replace(
    'rounded-2xl p-3 sm:p-3.5 flex gap-3.5 items-center',
    'rounded-2xl p-2.5 sm:p-3 flex gap-3 items-center'
)
cart_content = cart_content.replace(
    'h-[78px] w-[82px] sm:h-[80px] sm:w-[84px]',
    'h-[70px] w-[72px] sm:h-[74px] sm:w-[76px]'
)
cart_content = cart_content.replace(
    'h-[78px] sm:h-[82px]',
    'h-[70px] sm:h-[74px]'
)
cart_content = cart_content.replace(
    'p-4 sm:p-5 shadow-sm border border-gray-100 dark:border-gray-700',
    'p-3.5 sm:p-4 shadow-sm border border-gray-100 dark:border-gray-700'
)
cart_content = cart_content.replace(
    'mb-3.5 pb-2.5 border-b',
    'mb-2.5 pb-2 border-b'
)
cart_content = cart_content.replace(
    'space-y-2.5 mb-4 sm:mb-5',
    'space-y-2 mb-3 sm:mb-4'
)
cart_content = cart_content.replace(
    'py-3 sm:py-3.5 flex items-center justify-center font-normal text-sm active:scale-[0.98] transition-transform gap-2',
    'py-2.5 sm:py-3 flex items-center justify-center font-normal text-sm active:scale-[0.98] transition-transform gap-2'
)

with open(cart_path, 'w', encoding='utf-8') as f:
    f.write(cart_content)
print("Updated Cart.jsx spacing and padding")

# 4. src/pages/Checkout.jsx: Remove tags from items, tighten spacing
checkout_path = r'src/pages/Checkout.jsx'
with open(checkout_path, 'r', encoding='utf-8') as f:
    checkout_content = f.read()

# Remove overlay tag badge block in Checkout.jsx
tags_block_checkout = """                                                <div className="absolute top-0 left-0 flex flex-col items-start gap-0 z-10">
                                                    {(item.isGold || (item.product && item.product.isGold)) && (
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

if tags_block_checkout in checkout_content:
    checkout_content = checkout_content.replace(tags_block_checkout, "")
    print("Removed overlay tags from Checkout.jsx items")

# Compact card padding in Checkout.jsx
checkout_content = checkout_content.replace(
    'className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5"',
    'className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4"'
)
checkout_content = checkout_content.replace(
    'className="lg:col-span-2 space-y-3.5 sm:space-y-4"',
    'className="lg:col-span-2 space-y-3 sm:space-y-3.5"'
)
checkout_content = checkout_content.replace(
    'rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-5',
    'rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-3.5 sm:p-4'
)

with open(checkout_path, 'w', encoding='utf-8') as f:
    f.write(checkout_content)
print("Updated Checkout.jsx")

# 5. src/pages/OrderConfirmation.jsx: Remove tags from items, tighten spacing
order_conf_path = r'src/pages/OrderConfirmation.jsx'
with open(order_conf_path, 'r', encoding='utf-8') as f:
    order_conf_content = f.read()

tags_block_conf = """                                        <div className="absolute top-0 left-0 flex flex-col items-start gap-0 z-10">
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

if tags_block_conf in order_conf_content:
    order_conf_content = order_conf_content.replace(tags_block_conf, "")
    print("Removed overlay tags from OrderConfirmation.jsx items")

order_conf_content = order_conf_content.replace(
    'max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3.5 sm:space-y-4',
    'max-w-3xl mx-auto px-3.5 sm:px-5 lg:px-6 space-y-3 sm:space-y-3.5'
)
order_conf_content = order_conf_content.replace(
    'p-3.5 sm:p-4',
    'p-3 sm:p-3.5'
)

with open(order_conf_path, 'w', encoding='utf-8') as f:
    f.write(order_conf_content)
print("Updated OrderConfirmation.jsx")

print("All updates applied cleanly!")

