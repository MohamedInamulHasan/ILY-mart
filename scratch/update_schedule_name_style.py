import re

def update_time_and_schedule(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Match whatever is inside the time block
    pattern = r'<div className="mt-2\.5 pt-1">\s*<p className="text-xs sm:text-\[13px\] font-medium text-gray-500 dark:text-gray-400 leading-tight">\s*\{timeLabel\}\s*</p>\s*<p className="[^"]*">\s*\{timeRange\}\s*</p>\s*</div>'

    replacement = """<div className="mt-2.5 pt-1">
                                                                    <p className="text-xs sm:text-[13px] font-medium text-gray-500 dark:text-gray-400 leading-tight">
                                                                        {timeLabel}
                                                                    </p>
                                                                    <p className="text-sm sm:text-base font-bold text-gray-900 dark:text-white leading-tight mt-0.5">
                                                                        {timeRange}
                                                                    </p>
                                                                </div>"""

    new_content, count = re.subn(pattern, replacement, content)
    if count > 0:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"[{path}] Updated successfully ({count} occurrences)!")
    else:
        print(f"[{path}] Regex did not match!")

update_time_and_schedule(r'c:\Users\moham\ILAYANGUDI PROJECT\src\pages\admin\DeliveryDashboard.jsx')
update_time_and_schedule(r'c:\Users\moham\ILAYANGUDI PROJECT\src\components\DeliveryOrdersFeedModal.jsx')

