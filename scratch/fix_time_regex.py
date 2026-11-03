import re

def fix_time(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    pattern = r'<div className="mt-3 pt-1">\s*<p className="text-\[9px\] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 leading-tight">\s*\{timeLabel\}\s*</p>\s*<p className="text-xs sm:text-\[13px\] font-medium text-gray-500 dark:text-gray-400">\s*\{timeRange\}\s*</p>\s*</div>'

    replacement = """<div className="mt-2.5 pt-1">
                                                                    <p className="text-xs sm:text-[13px] font-medium text-gray-500 dark:text-gray-400 leading-tight">
                                                                        {timeLabel}
                                                                    </p>
                                                                    <p className="text-sm sm:text-[15px] font-bold text-gray-900 dark:text-white mt-0.5">
                                                                        {timeRange}
                                                                    </p>
                                                                </div>"""

    new_content, count = re.subn(pattern, replacement, content)
    if count > 0:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"[{path}] Successfully replaced {count} occurrence(s)!")
    else:
        print(f"[{path}] Regex did not match!")

fix_time(r'c:\Users\moham\ILAYANGUDI PROJECT\src\pages\admin\DeliveryDashboard.jsx')
fix_time(r'c:\Users\moham\ILAYANGUDI PROJECT\src\components\DeliveryOrdersFeedModal.jsx')

