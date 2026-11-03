with open(r'c:\Users\moham\ILAYANGUDI PROJECT\src\components\IncomingOrderModal.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = """                    {/* Light grey line matching green dot line */}
                    <div className="mx-5 h-[2px] bg-gray-300 dark:bg-gray-600 rounded-full mb-3" />"""

if target in content:
    content = content.replace(target, "")
    print("Line removed successfully!")
else:
    print("Target not found, checking alternate whitespace...")
    import re
    content = re.sub(r'\s*\{/\* Light grey line matching green dot line \*/\}\s*<div className="mx-5 h-\[2px\] bg-gray-300 dark:bg-gray-600 rounded-full mb-3" />', '', content)
    print("Replaced with regex!")

with open(r'c:\Users\moham\ILAYANGUDI PROJECT\src\components\IncomingOrderModal.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

