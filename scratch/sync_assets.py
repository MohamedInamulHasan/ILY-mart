import shutil
import os

source = r"c:\Users\moham\ILAYANGUDI PROJECT\dist"
targets = [
    r"c:\Users\moham\ILAYANGUDI PROJECT\android\app\src\main\assets\public",
    r"c:\Users\moham\ILAYANGUDI PROJECT\APP _ homly\homly-mobile\android\gradle\..\app\src\main\assets\public"
]

for target in targets:
    normalized_target = os.path.abspath(target)
    if os.path.exists(normalized_target):
        shutil.rmtree(normalized_target)
    shutil.copytree(source, normalized_target)
    print(f"Copied {source} to {normalized_target}")

