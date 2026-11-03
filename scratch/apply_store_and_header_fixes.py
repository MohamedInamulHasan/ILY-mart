import re

print("Applying store header, search bar gap, and tag cleanup fixes...")

# 1. Update src/pages/StoreProducts.jsx
store_products_path = r'src/pages/StoreProducts.jsx'
with open(store_products_path, 'r', encoding='utf-8') as f:
    sp_content = f.read()

# Header: reduce store name size, increase max-w
old_header_center = """                            <div className="flex flex-col items-center text-center px-14 min-w-0">
                                <h1 className="text-[18px] font-bold text-gray-900 tracking-tight leading-tight truncate max-w-[200px] sm:max-w-[300px]">{store?.name}</h1>
                                {store?.address && (
                                    <div className="flex items-center justify-center gap-1 mt-0.5 max-w-[200px] sm:max-w-[300px] truncate">
                                        <MapPin size={11} className="text-[#2E5A2E] flex-shrink-0" />
                                        <p className="text-[11px] font-semibold text-gray-700 truncate">{store?.address}</p>
                                    </div>
                                )}
                            </div>"""

new_header_center = """                            <div className="flex flex-col items-center text-center px-12 min-w-0">
                                <h1 className="text-[15px] sm:text-[16px] font-bold text-gray-900 tracking-tight leading-tight truncate max-w-[240px] sm:max-w-[340px]">{store?.name}</h1>
                                {store?.address && (
                                    <div className="flex items-center justify-center gap-1 mt-0.5 max-w-[240px] sm:max-w-[340px] truncate">
                                        <MapPin size={10} className="text-[#2E5A2E] flex-shrink-0" />
                                        <p className="text-[10px] sm:text-[11px] font-medium text-gray-700 truncate">{store?.address}</p>
                                    </div>
                                )}
                            </div>"""

if old_header_center in sp_content:
    sp_content = sp_content.replace(old_header_center, new_header_center)
    print("Updated header store name size in StoreProducts.jsx")
else:
    print("WARN: Could not find exact old_header_center in StoreProducts.jsx, using regex")
    sp_content = re.sub(
        r'<div className="flex flex-col items-center text-center px-14 min-w-0">.*?<\/div>\s*<\/div>',
        new_header_center.strip() + "\n                            </div>",
        sp_content,
        flags=re.DOTALL
    )

# Search section margin
sp_content = sp_content.replace(
    'section className="px-4 relative z-20 mb-3.5 sm:mb-4"',
    'section className="px-4 relative z-20 mb-2 sm:mb-2.5"'
)

# Subcategory margin if present
sp_content = sp_content.replace(
    'max-w-7xl mx-auto px-4 mb-3 sm:mb-4">\n                    <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide border-b border-gray-100/50">',
    'max-w-7xl mx-auto px-4 mb-2 sm:mb-2.5">\n                    <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide border-b border-gray-100/50">'
)

# Empty div removal
empty_div_old = """                <div className="max-w-7xl mx-auto px-4 -mt-4">
                    {/* The search dropdown was previously here but moved inside the relative container above */}
                </div>"""
if empty_div_old in sp_content:
    sp_content = sp_content.replace(empty_div_old, "")

# Store closed banner spacing
old_closed_banner = """            {/* Store Closed Banner (Moved here) */}
            <div className="max-w-7xl mx-auto px-4">
                {!storeIsOpen && (
                    <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 flex items-center gap-3">
                        <AlertCircle className="text-red-600 dark:text-red-400 flex-shrink-0" size={20} />
                        <div>
                            <p className="font-semibold text-red-900 dark:text-red-200 text-sm">{t('Store Closed')}</p>
                            {store.timingType !== 'permanent' && (
                                <p className="text-xs text-red-700 dark:text-red-300">
                                    {t('Opens')} {store.openingTime || '9:00 AM'}
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>"""

new_closed_banner = """            {/* Store Closed Banner (Moved here) */}
            {!storeIsOpen && (
                <div className="max-w-7xl mx-auto px-4 mb-2">
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 flex items-center gap-3">
                        <AlertCircle className="text-red-600 dark:text-red-400 flex-shrink-0" size={20} />
                        <div>
                            <p className="font-semibold text-red-900 dark:text-red-200 text-sm">{t('Store Closed')}</p>
                            {store.timingType !== 'permanent' && (
                                <p className="text-xs text-red-700 dark:text-red-300">
                                    {t('Opens')} {store.openingTime || '9:00 AM'}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}"""

if old_closed_banner in sp_content:
    sp_content = sp_content.replace(old_closed_banner, new_closed_banner)
    print("Cleaned closed banner wrapper in StoreProducts.jsx")

# Content Area padding & spacing
sp_content = sp_content.replace(
    'max-w-7xl mx-auto px-4 pt-1 pb-4',
    'max-w-7xl mx-auto px-4 pt-0 pb-4'
)
sp_content = sp_content.replace(
    'space-y-5 sm:space-y-6',
    'space-y-3.5 sm:space-y-4'
)

with open(store_products_path, 'w', encoding='utf-8') as f:
    f.write(sp_content)
print("Updated StoreProducts.jsx")

# 2. Update src/utils/titleHelpers.jsx: support hideTag option
title_helpers_path = r'src/utils/titleHelpers.jsx'
with open(title_helpers_path, 'r', encoding='utf-8') as f:
    th_content = f.read()

old_th_options = """    const {
        mainClassName = '',
        subClassName = 'opacity-80 text-xs font-normal',
        tagClassName = 'font-bold text-red-500 dark:text-red-400 ml-1 inline-block'
    } = options;"""

new_th_options = """    const {
        mainClassName = '',
        subClassName = 'opacity-80 text-xs font-normal',
        tagClassName = 'font-bold text-red-500 dark:text-red-400 ml-1 inline-block',
        hideTag = false
    } = options;"""

if old_th_options in th_content:
    th_content = th_content.replace(old_th_options, new_th_options)

th_content = th_content.replace(
    '{tagContent && <span className={tagClassName}>[{tagContent}]</span>}',
    '{(!hideTag && tagContent) && <span className={tagClassName}>[{tagContent}]</span>}'
)

with open(title_helpers_path, 'w', encoding='utf-8') as f:
    f.write(th_content)
print("Updated titleHelpers.jsx with hideTag support")

# 3. Update src/pages/Cart.jsx: pass hideTag: true
cart_path = r'src/pages/Cart.jsx'
with open(cart_path, 'r', encoding='utf-8') as f:
    cart_content = f.read()

old_cart_title = "renderBilingualTitle(t(item, 'title') || item.title || item.name, language)"
new_cart_title = "renderBilingualTitle(t(item, 'title') || item.title || item.name, language, { hideTag: true })"

if old_cart_title in cart_content:
    cart_content = cart_content.replace(old_cart_title, new_cart_title)
    with open(cart_path, 'w', encoding='utf-8') as f:
        f.write(cart_content)
    print("Updated Cart.jsx to hideTag")

# 4. Update src/App.jsx: ensure showFloatingDeliveryBadge does not show on store products
app_path = r'src/App.jsx'
with open(app_path, 'r', encoding='utf-8') as f:
    app_content = f.read()

# Only show floating delivery badge on Home page (/) so it never covers store products or other pages
old_app_badge = "const hideFloatingBadgeRoutes = ['/cart', '/checkout', '/order-confirmation'];\n    const showFloatingDeliveryBadge = cartItems && cartItems.length > 0 && !isAdminRoute && !isAuthPage && !hideFloatingBadgeRoutes.includes(location.pathname) && !location.pathname.startsWith('/order');"
new_app_badge = "const showFloatingDeliveryBadge = cartItems && cartItems.length > 0 && location.pathname === '/' && !isAdminRoute && !isAuthPage;"

if old_app_badge in app_content:
    app_content = app_content.replace(old_app_badge, new_app_badge)
    with open(app_path, 'w', encoding='utf-8') as f:
        f.write(app_content)
    print("Updated showFloatingDeliveryBadge to Home-only in App.jsx")

print("All updates done!")

