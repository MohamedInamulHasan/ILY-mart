import os

# 1. Update App.jsx to exempt /profile from pb-32 on main
app_path = r"c:\Users\moham\ILAYANGUDI PROJECT\src\App.jsx"
with open(app_path, "r", encoding="utf-8") as f:
    app_content = f.read()

old_main = '<main className={`flex-grow flex flex-col ${showMobileFooter ? \'pb-32 md:pb-0 md:pr-28\' : \'\'}`}>\n                {children}\n            </main>'
new_main = '<main className={`flex-grow flex flex-col ${showMobileFooter && location.pathname !== \'/profile\' ? \'pb-32 md:pb-0 md:pr-28\' : \'\'}`}>\n                {children}\n            </main>'

if old_main in app_content:
    app_content = app_content.replace(old_main, new_main)
    with open(app_path, "w", encoding="utf-8") as f:
        f.write(app_content)
    print("Successfully updated App.jsx")
else:
    print("Target not found in App.jsx")

