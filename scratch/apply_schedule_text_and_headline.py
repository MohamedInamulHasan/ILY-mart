# 1. Update DeliveryDashboard.jsx
dash_path = 'src/pages/admin/DeliveryDashboard.jsx'
with open(dash_path, 'r', encoding='utf-8') as f:
    dash = f.read()

# Make head line thickness 2px (matching the 2px green connect dots line)
dash = dash.replace(
    '<div className="mx-5 h-[1px] bg-gray-300 dark:bg-gray-600 shrink-0" />',
    '<div className="mx-5 h-[2px] bg-gray-300 dark:bg-gray-600 rounded-full shrink-0" />'
)

# Scheduled Delivery label: address grey and size like address
# Delivery time range (e.g. 6 PM - 7 PM): as before black text
old_schedule_block = """                                                                <div className="mt-3 pt-1">
                                                                    <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 leading-tight">
                                                                        {timeLabel}
                                                                    </p>
                                                                    <p className="text-xs sm:text-[13px] font-medium text-gray-500 dark:text-gray-400">
                                                                        {timeRange}
                                                                    </p>
                                                                </div>"""

new_schedule_block = """                                                                <div className="mt-2.5">
                                                                    <p className="text-xs sm:text-[13px] font-medium text-gray-500 dark:text-gray-400 leading-tight">
                                                                        {timeLabel}
                                                                    </p>
                                                                    <p className="text-xs sm:text-[13px] font-bold text-gray-900 dark:text-white mt-0.5">
                                                                        {timeRange}
                                                                    </p>
                                                                </div>"""

if old_schedule_block in dash:
    dash = dash.replace(old_schedule_block, new_schedule_block)
    print("SUCCESS: Updated schedule text in DeliveryDashboard.jsx")
else:
    print("old_schedule_block not matched in DeliveryDashboard.jsx")

with open(dash_path, 'w', encoding='utf-8') as f:
    f.write(dash)


# 2. Update DeliveryOrdersFeedModal.jsx
feed_path = 'src/components/DeliveryOrdersFeedModal.jsx'
with open(feed_path, 'r', encoding='utf-8') as f:
    feed = f.read()

feed = feed.replace(
    '<div className="mx-5 h-[1px] bg-gray-300 dark:bg-gray-600 shrink-0" />',
    '<div className="mx-5 h-[2px] bg-gray-300 dark:bg-gray-600 rounded-full shrink-0" />'
)

if old_schedule_block in feed:
    feed = feed.replace(old_schedule_block, new_schedule_block)
    print("SUCCESS: Updated schedule text in DeliveryOrdersFeedModal.jsx")
else:
    print("old_schedule_block not matched in DeliveryOrdersFeedModal.jsx")

with open(feed_path, 'w', encoding='utf-8') as f:
    f.write(feed)


# 3. Update IncomingOrderModal.jsx
modal_path = 'src/components/IncomingOrderModal.jsx'
with open(modal_path, 'r', encoding='utf-8') as f:
    modal = f.read()

modal = modal.replace(
    '<div className="mx-5 h-[1px] bg-gray-300 dark:bg-gray-600 shrink-0" />',
    '<div className="mx-5 h-[2px] bg-gray-300 dark:bg-gray-600 rounded-full shrink-0" />'
)
modal = modal.replace(
    '<div className="mx-2 h-[1px] bg-gray-300 dark:bg-gray-600 mb-3 shrink-0" />',
    '<div className="mx-2 h-[2px] bg-gray-300 dark:bg-gray-600 rounded-full mb-3 shrink-0" />'
)

with open(modal_path, 'w', encoding='utf-8') as f:
    f.write(modal)

print("ALL CHANGES COMPLETE FAST!")

