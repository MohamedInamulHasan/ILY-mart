import re

# 1. Update DeliveryDashboard.jsx
dash_path = 'src/pages/admin/DeliveryDashboard.jsx'
with open(dash_path, 'r', encoding='utf-8') as f:
    dash = f.read()

# Update header row in DeliveryDashboard
old_dash_header = """                                            {/* Top Header Row: Time Left, ID Right, no X, grey line not touching edges */}
                                            <div className="px-5 pt-4 pb-2.5 flex items-center justify-between text-black dark:text-white bg-white dark:bg-gray-800 shrink-0">
                                                {/* Left: 🕒 Nov 6, 8.00 PM */}
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <Clock size={16} className="text-gray-900 dark:text-white shrink-0" />
                                                    <span className="text-sm sm:text-[15px] font-bold text-gray-900 dark:text-white tracking-wide truncate">
                                                        {formatOrderBannerTime(order.createdAt || order.date) || orderTimeStr || t('New Order')}
                                                    </span>
                                                </div>

                                                {/* Right: #Order ID (No X) */}
                                                <span className="text-sm sm:text-[15px] font-black tracking-wide text-gray-900 dark:text-white font-mono shrink-0">
                                                    #{orderIdShort}
                                                </span>
                                            </div>
                                            {/* Grey line not touching left and right edges */}
                                            <div className="mx-5 h-[1px] bg-gray-200 dark:bg-gray-700 shrink-0" />"""

new_dash_header = """                                            {/* Top Header Row: Time Left & ID Right in grey same thickness, light grey line like green dot line */}
                                            <div className="px-5 pt-4 pb-2.5 flex items-center justify-between text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 shrink-0">
                                                {/* Left: 🕒 Nov 6, 8.00 PM */}
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <Clock size={16} className="text-gray-500 dark:text-gray-400 shrink-0" />
                                                    <span className="text-sm sm:text-[15px] font-bold text-gray-500 dark:text-gray-400 tracking-wide truncate">
                                                        {formatOrderBannerTime(order.createdAt || order.date) || orderTimeStr || t('New Order')}
                                                    </span>
                                                </div>

                                                {/* Right: #Order ID (same font-bold thickness and grey color) */}
                                                <span className="text-sm sm:text-[15px] font-bold text-gray-500 dark:text-gray-400 font-mono shrink-0">
                                                    #{orderIdShort}
                                                </span>
                                            </div>
                                            {/* Light grey line matching green dot line */}
                                            <div className="mx-5 h-[1px] bg-gray-300 dark:bg-gray-600 shrink-0" />"""

if old_dash_header in dash:
    dash = dash.replace(old_dash_header, new_dash_header)
    print("SUCCESS: Updated header in DeliveryDashboard.jsx")
else:
    print("old_dash_header not matched")

# Update DELIVERY CHARGE text to black
dash = dash.replace(
    '<span className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-gray-600 dark:text-gray-300 block mb-0.5">',
    '<span className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-black dark:text-white block mb-0.5">'
)

# Update Address, City, Items, and Schedule Delivery to address color grey:
dash = dash.replace(
    '<p className="text-xs sm:text-[13px] text-gray-700 dark:text-gray-300 font-medium truncate">\n                                                                    {street}\n                                                                </p>',
    '<p className="text-xs sm:text-[13px] text-gray-500 dark:text-gray-400 font-medium truncate">\n                                                                    {street}\n                                                                </p>'
)

dash = dash.replace(
    '<p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium truncate">\n                                                                    {city}\n                                                                </p>',
    '<p className="text-xs sm:text-[13px] text-gray-500 dark:text-gray-400 font-medium truncate">\n                                                                    {city}\n                                                                </p>'
)

dash = dash.replace(
    '<p className="text-xs sm:text-[13px] font-bold text-gray-900 dark:text-white">\n                                                                        {timeRange}\n                                                                    </p>',
    '<p className="text-xs sm:text-[13px] font-medium text-gray-500 dark:text-gray-400">\n                                                                        {timeRange}\n                                                                    </p>'
)

with open(dash_path, 'w', encoding='utf-8') as f:
    f.write(dash)


# 2. Update DeliveryOrdersFeedModal.jsx
feed_path = 'src/components/DeliveryOrdersFeedModal.jsx'
with open(feed_path, 'r', encoding='utf-8') as f:
    feed = f.read()

old_feed_header = """                                    {/* Top Header Row: Time Left, ID Right, no X, grey line not touching edges */}
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
                                            </span>"""

new_feed_header = """                                    {/* Top Header Row: Time Left & ID Right in grey same thickness, light grey line like green dot line */}
                                    <div className="px-5 pt-4 pb-2.5 flex items-center justify-between text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 shrink-0">
                                        {/* Left: 🕒 Nov 6, 8.00 PM */}
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <Clock size={16} className="text-gray-500 dark:text-gray-400 shrink-0" />
                                            <span className="text-sm sm:text-[15px] font-bold text-gray-500 dark:text-gray-400 tracking-wide truncate">
                                                {formatOrderBannerTime(order.createdAt || order.date) || orderTimeStr || t('New Order')}
                                            </span>
                                        </div>

                                        {/* Right: #Order ID (same font-bold thickness and grey color) */}
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="text-sm sm:text-[15px] font-bold text-gray-500 dark:text-gray-400 font-mono shrink-0">
                                                #{orderIdShort}
                                            </span>"""

if old_feed_header in feed:
    feed = feed.replace(old_feed_header, new_feed_header)
    print("SUCCESS: Updated header in DeliveryOrdersFeedModal.jsx")
else:
    print("old_feed_header not matched")

# Update light grey line matching green dot line
feed = feed.replace(
    '<div className="mx-5 h-[1px] bg-gray-200 dark:bg-gray-700 shrink-0" />',
    '<div className="mx-5 h-[1px] bg-gray-300 dark:bg-gray-600 shrink-0" />'
)

# Update DELIVERY CHARGE text to black
feed = feed.replace(
    '<span className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-gray-600 dark:text-gray-300 block mb-0.5">',
    '<span className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-black dark:text-white block mb-0.5">'
)

# Update street, city, schedule delivery to address grey
feed = feed.replace(
    '<p className="text-xs sm:text-[13px] text-gray-700 dark:text-gray-300 font-medium truncate">\n                                                            {street}\n                                                        </p>',
    '<p className="text-xs sm:text-[13px] text-gray-500 dark:text-gray-400 font-medium truncate">\n                                                            {street}\n                                                        </p>'
)

feed = feed.replace(
    '<p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium truncate">\n                                                            {city}\n                                                        </p>',
    '<p className="text-xs sm:text-[13px] text-gray-500 dark:text-gray-400 font-medium truncate">\n                                                            {city}\n                                                        </p>'
)

feed = feed.replace(
    '<p className="text-xs sm:text-[13px] font-bold text-gray-900 dark:text-white">\n                                                                {timeRange}\n                                                            </p>',
    '<p className="text-xs sm:text-[13px] font-medium text-gray-500 dark:text-gray-400">\n                                                                {timeRange}\n                                                            </p>'
)

with open(feed_path, 'w', encoding='utf-8') as f:
    f.write(feed)


# 3. Update IncomingOrderModal.jsx
modal_path = 'src/components/IncomingOrderModal.jsx'
with open(modal_path, 'r', encoding='utf-8') as f:
    modal = f.read()

# Compact view header text grey
modal = modal.replace(
    '<span className="text-sm sm:text-[15px] font-black tracking-wide text-gray-900 dark:text-white font-mono shrink-0">\n                                #{orderIdShort}\n                            </span>',
    '<span className="text-sm sm:text-[15px] font-bold text-gray-500 dark:text-gray-400 font-mono shrink-0">\n                                #{orderIdShort}\n                            </span>'
)

# Compact view light grey line
modal = modal.replace(
    '<div className="mx-2 h-[1px] bg-gray-200 dark:bg-gray-700 mb-3 shrink-0" />',
    '<div className="mx-2 h-[1px] bg-gray-300 dark:bg-gray-600 mb-3 shrink-0" />'
)

# Full view header
old_modal_accept_hdr = """                {/* Full Accept View: Time Left, ID Right, no X, grey line not touching edges */}
                <div className="px-5 pt-4 pb-2.5 flex items-center justify-between text-black dark:text-white bg-white dark:bg-gray-800 shrink-0">
                    {/* Left: 🕒 Nov 6, 8.00 PM */}
                    <div className="flex items-center gap-1.5 min-w-0">
                        <Clock size={16} className="text-gray-900 dark:text-white shrink-0" />
                        <span className="text-sm sm:text-[15px] font-bold text-gray-900 dark:text-white tracking-wide truncate">
                            {formatOrderBannerTime(order.createdAt || order.date) || formattedOrderTime || t('New Order')}
                        </span>
                    </div>

                    {/* Right: #Order ID (No X) */}
                    <span className="text-sm sm:text-[15px] font-black tracking-wide text-gray-900 dark:text-white font-mono shrink-0">
                        #{orderIdShort}
                    </span>
                </div>
                {/* Grey line not touching left and right edges */}
                <div className="mx-5 h-[1px] bg-gray-200 dark:bg-gray-700 shrink-0" />"""

new_modal_accept_hdr = """                {/* Full Accept View: Time Left & ID Right in grey same thickness, light grey line like green dot line */}
                <div className="px-5 pt-4 pb-2.5 flex items-center justify-between text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 shrink-0">
                    {/* Left: 🕒 Nov 6, 8.00 PM */}
                    <div className="flex items-center gap-1.5 min-w-0">
                        <Clock size={16} className="text-gray-500 dark:text-gray-400 shrink-0" />
                        <span className="text-sm sm:text-[15px] font-bold text-gray-500 dark:text-gray-400 tracking-wide truncate">
                            {formatOrderBannerTime(order.createdAt || order.date) || formattedOrderTime || t('New Order')}
                        </span>
                    </div>

                    {/* Right: #Order ID (same font-bold thickness and grey color) */}
                    <span className="text-sm sm:text-[15px] font-bold text-gray-500 dark:text-gray-400 font-mono shrink-0">
                        #{orderIdShort}
                    </span>
                </div>
                {/* Light grey line matching green dot line */}
                <div className="mx-5 h-[1px] bg-gray-300 dark:bg-gray-600 shrink-0" />"""

if old_modal_accept_hdr in modal:
    modal = modal.replace(old_modal_accept_hdr, new_modal_accept_hdr)
    print("SUCCESS: Updated header in IncomingOrderModal.jsx")
else:
    print("old_modal_accept_hdr not matched")

# Update DELIVERY CHARGE label to black in IncomingOrderModal
modal = modal.replace(
    '<span className="text-[11px] font-bold uppercase tracking-widest text-gray-600 dark:text-gray-300 block mb-0.5">\n                        {t(\'Delivery Charge\')}\n                    </span>',
    '<span className="text-[11px] font-black uppercase tracking-widest text-black dark:text-white block mb-0.5">\n                        {t(\'Delivery Charge\')}\n                    </span>'
)

modal = modal.replace(
    '<span className="text-[11px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 block mb-0.5">\n                            {t(\'Delivery Charge\')}\n                        </span>',
    '<span className="text-[11px] font-black uppercase tracking-widest text-black dark:text-white block mb-0.5">\n                            {t(\'Delivery Charge\')}\n                        </span>'
)

with open(modal_path, 'w', encoding='utf-8') as f:
    f.write(modal)

print("ALL CARD STYLES UPDATED FAST!")

