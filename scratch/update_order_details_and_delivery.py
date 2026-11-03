import re

print("Starting update for Order Details and Delivery Panel Order Details...")

# ==========================================
# 1. src/pages/OrderDetails.jsx
# ==========================================
od_path = r'src/pages/OrderDetails.jsx'
with open(od_path, 'r', encoding='utf-8') as f:
    od = f.read()

# Reduce outer card gap from space-y-5 to space-y-3 sm:space-y-3.5
od = od.replace('className="space-y-5"', 'className="space-y-3 sm:space-y-3.5"')

# Status Card Banner: p-6 -> p-3.5 sm:p-4, text-2xl font-black -> text-xl sm:text-2xl font-bold
od = od.replace(
    'rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden',
    'rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden'
)
od = od.replace(
    'flex items-center justify-between`}>',
    'flex items-center justify-between`}>\n'
)

# Status banner padding
od = re.sub(r'className=\{`p-6 (order\.status === [^`]+)`\}', r'className={`p-3.5 sm:p-4 \1`}', od)
od = od.replace('text-2xl font-black', 'text-xl sm:text-2xl font-bold')

# Timeline padding
od = od.replace('className="p-6 relative"', 'className="px-4 py-3.5 relative"')

# Items Card: Header p-4 -> px-3.5 py-2.5
od = od.replace(
    'className="p-4 border-b border-gray-50 dark:border-gray-700 flex items-center gap-2"',
    'className="px-3.5 py-2.5 border-b border-gray-50 dark:border-gray-700 flex items-center gap-2"'
)

# Item row: p-5 flex gap-4 first:pt-5 -> p-3 sm:p-3.5 flex gap-3 first:pt-3
od = od.replace(
    'className="p-5 flex gap-4 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors first:pt-5"',
    'className="p-3 sm:p-3.5 flex gap-3 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors first:pt-3"'
)

# Image in Items card: h-16 w-16 -> w-14 h-14 rounded-xl
od = od.replace(
    'className="h-16 w-16 bg-gray-50 border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden flex-shrink-0 relative"',
    'className="w-14 h-14 bg-gray-50 border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden flex-shrink-0 relative"'
)

# Remove overlay tags in OrderDetails.jsx
od_tags_block = """                                    {/* Status Tags */}
                                    <div className="absolute top-0 left-0 flex flex-col items-start gap-0 z-10">
                                        {((item.isGold) || (item.product && item.product.isGold)) && (
                                            <span className="bg-[#16A34A] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-br-lg shadow-sm mb-[1px]">
                                                {t('Free Delivery')}
                                            </span>
                                        )}
                                        {item.isFromAd && !item.isGold && !(item.product && item.product.isGold) && (
                                            <span className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-br-lg shadow-sm">
                                                {t('Special Offer')}
                                            </span>
                                        )}
                                    </div>"""
if od_tags_block in od:
    od = od.replace(od_tags_block, "")
    print("Removed overlay tags from OrderDetails.jsx")

# Shipping details card
od = od.replace(
    'className="p-5 border-b border-gray-50 dark:border-gray-700 flex items-center gap-3"',
    'className="px-3.5 py-2.5 border-b border-gray-50 dark:border-gray-700 flex items-center gap-2.5"'
)
od = od.replace(
    '<div className="p-6">\n                        <div className="pl-12 space-y-1.5">',
    '<div className="p-3.5 sm:p-4">\n                        <div className="pl-3 sm:pl-4 space-y-1">'
)
od = od.replace(
    'className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700"',
    'className="mt-2.5 pt-2.5 border-t border-gray-100 dark:border-gray-700"'
)

# Payment summary card
od = od.replace(
    'rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 p-6 text-[15px]',
    'rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-3.5 sm:p-4 text-[14px]'
)
od = od.replace('mb-4 flex items-center gap-2', 'mb-2.5 flex items-center gap-2')
od = od.replace('space-y-3 text-sm', 'space-y-2 text-sm')
od = od.replace('pt-3 border-t border-gray-100 dark:border-gray-700 mt-3 pt-3', 'pt-2.5 border-t border-gray-100 dark:border-gray-700 mt-2.5')

# Cancel button
od = od.replace('w-full py-4 bg-red-50', 'w-full py-3 sm:py-3.5 bg-red-50')

with open(od_path, 'w', encoding='utf-8') as f:
    f.write(od)
print("Updated OrderDetails.jsx successfully!")


# ==========================================
# 2. src/components/IncomingOrderModal.jsx
# ==========================================
modal_path = r'src/components/IncomingOrderModal.jsx'
with open(modal_path, 'r', encoding='utf-8') as f:
    im = f.read()

# View mode card: compact inner padding
im = im.replace('pt-3.5 pb-3 px-5', 'pt-2.5 pb-2.5 px-3.5 sm:px-4')
im = im.replace('py-1.5 mb-2 border-b', 'py-1 mb-1.5 border-b')
im = im.replace('rounded-[2.5rem]', 'rounded-2xl')

# Accept mode: scrollable section padding and gap
im = im.replace(
    'p-4 sm:p-5 overflow-y-auto space-y-4 flex-1',
    'p-3.5 sm:p-4 overflow-y-auto space-y-3 sm:space-y-3.5 flex-1'
)

# Header of modal
im = im.replace('px-5 pt-4 pb-2.5', 'px-4 pt-3 pb-2')

# Shipping Card in IncomingOrderModal
im = im.replace(
    'className="p-5 border-b border-gray-50 dark:border-gray-700 flex items-center justify-between"',
    'className="px-3.5 py-2.5 border-b border-gray-50 dark:border-gray-700 flex items-center justify-between"'
)
im = im.replace(
    '<div className="p-6">\n                            <div className="pl-2 sm:pl-4 space-y-1.5">',
    '<div className="p-3.5 sm:p-4">\n                            <div className="pl-2 sm:pl-3 space-y-1">'
)
im = im.replace(
    'mt-4 pt-4 border-t border-gray-100 dark:border-gray-700',
    'mt-2.5 pt-2.5 border-t border-gray-100 dark:border-gray-700'
)

# Items Card in IncomingOrderModal
im = im.replace(
    'className="p-4 border-b border-gray-50 dark:border-gray-700 flex items-center justify-between"',
    'className="px-3.5 py-2.5 border-b border-gray-50 dark:border-gray-700 flex items-center justify-between"'
)
im = im.replace(
    'className="p-5 flex gap-4 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors first:pt-5"',
    'className="p-3 sm:p-3.5 flex gap-3 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors first:pt-3"'
)
im = im.replace(
    'className="h-16 w-16 bg-gray-50 border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden flex-shrink-0 relative"',
    'className="w-14 h-14 bg-gray-50 border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden flex-shrink-0 relative"'
)

# Remove overlay tags in IncomingOrderModal
im_tags_block = """                                        {/* Status Tags */}
                                        <div className="absolute top-0 left-0 flex flex-col items-start gap-0 z-10">
                                            {((item.isGold) || (item.product && item.product.isGold)) && (
                                                <span className="bg-[#16A34A] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-br-lg shadow-sm mb-[1px]">
                                                    {t('Free Delivery')}
                                                </span>
                                            )}
                                            {item.isFromAd && !item.isGold && !(item.product && item.product.isGold) && (
                                                <span className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-br-lg shadow-sm">
                                                    {t('Special Offer')}
                                                </span>
                                            )}
                                        </div>"""
if im_tags_block in im:
    im = im.replace(im_tags_block, "")
    print("Removed overlay tags from IncomingOrderModal.jsx")

# Payment Card in IncomingOrderModal
im = im.replace(
    'rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 p-6 text-[15px]',
    'rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-3.5 sm:p-4 text-[14px]'
)
im = im.replace(
    'p-6 text-[15px]',
    'p-3.5 sm:p-4 text-[14px]'
)
im = im.replace('space-y-3 text-sm', 'space-y-2 text-sm')
im = im.replace('pt-3 border-t border-gray-100 dark:border-gray-700 mt-3 pt-3', 'pt-2.5 border-t border-gray-100 dark:border-gray-700 mt-2.5')

with open(modal_path, 'w', encoding='utf-8') as f:
    f.write(im)
print("Updated IncomingOrderModal.jsx successfully!")


# ==========================================
# 3. src/pages/admin/DeliveryDashboard.jsx
# ==========================================
dd_path = r'src/pages/admin/DeliveryDashboard.jsx'
with open(dd_path, 'r', encoding='utf-8') as f:
    dd = f.read()

# Order card gap in list
dd = dd.replace('space-y-4 sm:space-y-5', 'space-y-2.5 sm:space-y-3')
dd = dd.replace('space-y-4', 'space-y-2.5 sm:space-y-3')
# Inner padding of each order card
dd = dd.replace('pt-3.5 pb-3 px-5', 'pt-2.5 pb-2.5 px-3.5 sm:px-4')
dd = dd.replace('px-5 pt-4 pb-2.5', 'px-4 pt-3 pb-2')
dd = dd.replace('mx-5 h-[2px]', 'mx-4 h-[2px]')
dd = dd.replace('py-1.5 mb-2 border-b', 'py-1 mb-1.5 border-b')
dd = dd.replace('p-4 bg-white dark:bg-gray-800 border-t', 'p-3 sm:p-3.5 bg-white dark:bg-gray-800 border-t')

with open(dd_path, 'w', encoding='utf-8') as f:
    f.write(dd)
print("Updated DeliveryDashboard.jsx successfully!")


# ==========================================
# 4. src/components/DeliveryOrdersFeedModal.jsx
# ==========================================
feed_path = r'src/components/DeliveryOrdersFeedModal.jsx'
with open(feed_path, 'r', encoding='utf-8') as f:
    feed = f.read()

feed = feed.replace('space-y-4', 'space-y-2.5 sm:space-y-3')
feed = feed.replace('pt-3.5 pb-3 px-5', 'pt-2.5 pb-2.5 px-3.5 sm:px-4')
feed = feed.replace('px-5 pt-4 pb-2.5', 'px-4 pt-3 pb-2')
feed = feed.replace('mx-5 h-[2px]', 'mx-4 h-[2px]')
feed = feed.replace('py-1.5 mb-2 border-b', 'py-1 mb-1.5 border-b')
feed = feed.replace('p-4 bg-white dark:bg-gray-800 border-t', 'p-3 sm:p-3.5 bg-white dark:bg-gray-800 border-t')

with open(feed_path, 'w', encoding='utf-8') as f:
    f.write(feed)
print("Updated DeliveryOrdersFeedModal.jsx successfully!")

print("All order details and delivery panel updates applied!")

