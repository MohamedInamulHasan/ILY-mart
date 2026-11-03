import os

def update_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update head line to 2px light grey line
    old_line = '<div className="mx-5 h-[1px] bg-gray-300 dark:bg-gray-600 shrink-0" />'
    new_line = '<div className="mx-5 h-[2px] bg-gray-300 dark:bg-gray-600 rounded-full shrink-0" />'
    
    if old_line in content:
        content = content.replace(old_line, new_line)
        print(f"[{path}] Updated head line to 2px rounded-full")
    else:
        print(f"[{path}] Could not find old_line")

    # 2. Update time block:
    # timeLabel: grey, size like address (text-xs sm:text-[13px] font-medium text-gray-500 dark:text-gray-400)
    # timeRange: black text and bold size as before (text-sm sm:text-[15px] font-bold text-gray-900 dark:text-white)
    
    old_time_block = """                                                                 <div className="mt-3 pt-1">
                                                                     <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 leading-tight">
                                                                         {timeLabel}
                                                                     </p>
                                                                     <p className="text-xs sm:text-[13px] font-medium text-gray-500 dark:text-gray-400">
                                                                         {timeRange}
                                                                     </p>
                                                                 </div>"""

    new_time_block = """                                                                 <div className="mt-2.5 pt-1">
                                                                     <p className="text-xs sm:text-[13px] font-medium text-gray-500 dark:text-gray-400 leading-tight">
                                                                         {timeLabel}
                                                                     </p>
                                                                     <p className="text-sm sm:text-[15px] font-bold text-gray-900 dark:text-white mt-0.5">
                                                                         {timeRange}
                                                                     </p>
                                                                 </div>"""

    if old_time_block in content:
        content = content.replace(old_time_block, new_time_block)
        print(f"[{path}] Updated time block with address-grey label and black bold time range!")
    else:
        print(f"[{path}] Could not find old_time_block exact match")

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

update_file(r'c:\Users\moham\ILAYANGUDI PROJECT\src\pages\admin\DeliveryDashboard.jsx')
update_file(r'c:\Users\moham\ILAYANGUDI PROJECT\src\components\DeliveryOrdersFeedModal.jsx')

