import os

# 1. Fix Checkout.jsx
checkout_path = r'src\pages\Checkout.jsx'
with open(checkout_path, 'r', encoding='utf-8') as f:
    checkout = f.read().replace('\r\n', '\n')

old_chk_img = '<div className="h-13 w-13 sm:h-14 sm:w-14 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 relative">'
new_chk_img = '<div className="w-14 h-14 rounded-xl bg-gray-50 border border-gray-100 dark:border-gray-700 overflow-hidden flex-shrink-0 relative">'

if old_chk_img in checkout:
    checkout = checkout.replace(old_chk_img, new_chk_img)
    print("Checkout.jsx image container fixed successfully!")
else:
    print("WARNING: Checkout.jsx target not found!")

with open(checkout_path, 'w', encoding='utf-8') as f:
    f.write(checkout)

# 2. Fix OrderConfirmation.jsx
conf_path = r'src\pages\OrderConfirmation.jsx'
with open(conf_path, 'r', encoding='utf-8') as f:
    conf = f.read().replace('\r\n', '\n')

old_conf_img = '<div className="h-13 w-13 sm:h-14 sm:w-14 bg-gray-50 border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden flex-shrink-0 relative">'
new_conf_img = '<div className="w-14 h-14 rounded-xl bg-gray-50 border border-gray-100 dark:border-gray-700 overflow-hidden flex-shrink-0 relative">'

if old_conf_img in conf:
    conf = conf.replace(old_conf_img, new_conf_img)
    print("OrderConfirmation.jsx image container fixed successfully!")
else:
    print("WARNING: OrderConfirmation.jsx target not found!")

with open(conf_path, 'w', encoding='utf-8') as f:
    f.write(conf)

# 3. Fix OrderDetails.jsx pl-13
details_path = r'src\pages\OrderDetails.jsx'
with open(details_path, 'r', encoding='utf-8') as f:
    details = f.read().replace('\r\n', '\n')

if '<div className="pl-13 space-y-1.5">' in details:
    details = details.replace('<div className="pl-13 space-y-1.5">', '<div className="pl-12 space-y-1.5">')
    print("OrderDetails.jsx pl-13 fixed successfully!")

with open(details_path, 'w', encoding='utf-8') as f:
    f.write(details)

