import os

# Target pattern to replace across pages
old_input = """w-full pl-10 pr-10 py-2.5 sm:py-3 text-[13.5px] sm:text-sm font-medium rounded-2xl border border-gray-200/90 dark:border-gray-700/80 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-[#2E5A2E]/50 dark:focus:border-[#CBF9B2]/50 transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none"""

new_input = """w-full pl-11 sm:pl-12 pr-11 py-3.5 sm:py-4 text-[14.5px] sm:text-[15.5px] font-medium rounded-2xl border border-gray-200/90 dark:border-gray-700/80 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-[#2E5A2E]/50 dark:focus:border-[#CBF9B2]/50 transition-all duration-200 shadow-[0_2px_10px_rgba(0,0,0,0.04)] dark:shadow-none"""

files = [
    r"c:\Users\moham\ILAYANGUDI PROJECT\src\pages\Home.jsx",
    r"c:\Users\moham\ILAYANGUDI PROJECT\src\pages\Shop.jsx",
    r"c:\Users\moham\ILAYANGUDI PROJECT\src\pages\StoreProducts.jsx",
    r"c:\Users\moham\ILAYANGUDI PROJECT\src\pages\Orders.jsx",
    r"c:\Users\moham\ILAYANGUDI PROJECT\src\pages\Services.jsx",
    r"c:\Users\moham\ILAYANGUDI PROJECT\src\pages\CategoryProducts.jsx"
]

for fp in files:
    if not os.path.exists(fp):
        continue
    with open(fp, "r", encoding="utf-8") as f:
        c = f.read()
    
    # Update input class
    c = c.replace(old_input, new_input)
    
    # Update search icon size from 18 to 20 and left position
    c = c.replace(
        'className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#2E5A2E] dark:group-focus-within:text-[#CBF9B2] stroke-[2.2] transition-colors" size={18}',
        'className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#2E5A2E] dark:group-focus-within:text-[#CBF9B2] stroke-[2.2] transition-colors" size={20}'
    )
    c = c.replace(
        'className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#2E5A2E] stroke-[2.2] transition-colors" size={18}',
        'className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#2E5A2E] stroke-[2.2] transition-colors" size={20}'
    )
    c = c.replace(
        'className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 stroke-[2.2]" size={18}',
        'className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 stroke-[2.2]" size={20}'
    )
    
    # Update clear button icon size from 16 to 18 and right position
    c = c.replace(
        'className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 active:scale-90 transition-all rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center cursor-pointer"',
        'className="absolute right-3 sm:right-3.5 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 active:scale-90 transition-all rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center cursor-pointer"'
    )
    c = c.replace(
        '<X size={16} className="stroke-[2.5]" />',
        '<X size={18} className="stroke-[2.5]" />'
    )
    
    with open(fp, "w", encoding="utf-8") as f:
        f.write(c)
    print(f"Updated {fp}")

# Also update SortDropdown button size to match larger search bar height
sort_path = r"c:\Users\moham\ILAYANGUDI PROJECT\src\components\SortDropdown.jsx"
with open(sort_path, "r", encoding="utf-8") as f:
    sc = f.read()

sc = sc.replace(
    'className={`w-10 h-10 sm:w-11 sm:h-11 flex-shrink-0 flex items-center justify-center rounded-2xl border transition-all duration-300 active:scale-95',
    'className={`w-12 h-12 sm:w-[52px] sm:h-[52px] flex-shrink-0 flex items-center justify-center rounded-2xl border transition-all duration-300 active:scale-95'
)
sc = sc.replace('{ id: \'none\', label: \'Default\', icon: <ListFilter size={14} /> }', '{ id: \'none\', label: \'Default\', icon: <ListFilter size={16} /> }')
sc = sc.replace('{ id: \'lowToHigh\', label: \'Price: Low to High\', icon: <ArrowUpNarrowWide size={14} /> }', '{ id: \'lowToHigh\', label: \'Price: Low to High\', icon: <ArrowUpNarrowWide size={16} /> }')
sc = sc.replace('{ id: \'highToLow\', label: \'Price: High to Low\', icon: <ArrowDownWideNarrow size={14} /> }', '{ id: \'highToLow\', label: \'Price: High to Low\', icon: <ArrowDownWideNarrow size={16} /> }')

with open(sort_path, "w", encoding="utf-8") as f:
    f.write(sc)
print("Updated SortDropdown.jsx")

