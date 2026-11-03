import re

print("Starting fixes for user request: sort popup small, remove delivery tag, and adjust breathing gaps...")

# 1. Update src/components/SortDropdown.jsx: Make popup smaller
sort_path = r'src/components/SortDropdown.jsx'
with open(sort_path, 'r', encoding='utf-8') as f:
    sort_content = f.read()

# Smaller icons: size={14}
sort_content = sort_content.replace(
    "{ id: 'none', label: 'Default', icon: <ListFilter size={16} /> }",
    "{ id: 'none', label: 'Default', icon: <ListFilter size={14} /> }"
)
sort_content = sort_content.replace(
    "{ id: 'lowToHigh', label: 'Price: Low to High', icon: <ArrowUpNarrowWide size={16} /> }",
    "{ id: 'lowToHigh', label: 'Price: Low to High', icon: <ArrowUpNarrowWide size={14} /> }"
)
sort_content = sort_content.replace(
    "{ id: 'highToLow', label: 'Price: High to Low', icon: <ArrowDownWideNarrow size={16} /> }",
    "{ id: 'highToLow', label: 'Price: High to Low', icon: <ArrowDownWideNarrow size={14} /> }"
)

# Popup width and padding: w-44 sm:w-48, p-1.5 space-y-0.5, px-2.5 py-2, text-xs
old_popup_classes = 'className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 backdrop-blur-xl border border-gray-100 dark:border-gray-700 rounded-2xl z-[100] overflow-hidden"'
new_popup_classes = 'className="absolute right-0 top-full mt-1.5 w-44 sm:w-48 bg-white dark:bg-gray-800 backdrop-blur-xl border border-gray-100 dark:border-gray-700 rounded-xl z-[100] overflow-hidden shadow-lg"'

if old_popup_classes in sort_content:
    sort_content = sort_content.replace(old_popup_classes, new_popup_classes)

old_inner = '<div className="p-2 space-y-1">'
new_inner = '<div className="p-1.5 space-y-0.5">'
if old_inner in sort_content:
    sort_content = sort_content.replace(old_inner, new_inner)

old_btn_classes = "className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-normal transition-all duration-200 ${currentSort === option.id"
new_btn_classes = "className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${currentSort === option.id"
if old_btn_classes in sort_content:
    sort_content = sort_content.replace(old_btn_classes, new_btn_classes)

with open(sort_path, 'w', encoding='utf-8') as f:
    f.write(sort_content)
print("Updated SortDropdown.jsx: made popup small and compact")

# 2. Update src/App.jsx: Completely remove / hide the floating red delivery tag
app_path = r'src/App.jsx'
with open(app_path, 'r', encoding='utf-8') as f:
    app_content = f.read()

# Set showFloatingDeliveryBadge to false so it never shows
app_content = re.sub(
    r'const showFloatingDeliveryBadge\s*=\s*[^;]+;',
    'const showFloatingDeliveryBadge = false;',
    app_content
)

with open(app_path, 'w', encoding='utf-8') as f:
    f.write(app_content)
print("Updated App.jsx: completely removed floating delivery tag")

# 3. Update src/pages/StoreProducts.jsx: Make little more gap below search bar
sp_path = r'src/pages/StoreProducts.jsx'
with open(sp_path, 'r', encoding='utf-8') as f:
    sp_content = f.read()

# Make search section margin comfortable: mb-3.5 sm:mb-4 (gives nice breathing room above cards)
sp_content = sp_content.replace(
    'section className="px-4 relative z-20 mb-2 sm:mb-2.5"',
    'section className="px-4 relative z-20 mb-3.5 sm:mb-4"'
)
sp_content = sp_content.replace(
    'max-w-7xl mx-auto px-4 mb-2 sm:mb-2.5">\n                    <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide border-b border-gray-100/50">',
    'max-w-7xl mx-auto px-4 mb-3 sm:mb-3.5">\n                    <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide border-b border-gray-100/50">'
)
# Content area top padding: pt-1 sm:pt-2
sp_content = sp_content.replace(
    'max-w-7xl mx-auto px-4 pt-0 pb-4',
    'max-w-7xl mx-auto px-4 pt-1 sm:pt-2 pb-4'
)

with open(sp_path, 'w', encoding='utf-8') as f:
    f.write(sp_content)
print("Updated StoreProducts.jsx: added convenient breathing gap below search bar")

# 4. Update src/pages/Cart.jsx: Give comfortable breathing space below the green header
cart_path = r'src/pages/Cart.jsx'
with open(cart_path, 'r', encoding='utf-8') as f:
    cart_content = f.read()

cart_content = cart_content.replace(
    'px-3.5 sm:px-4 pt-[80px] pb-8',
    'px-3.5 sm:px-4 pt-[96px] pb-8'
)

with open(cart_path, 'w', encoding='utf-8') as f:
    f.write(cart_content)
print("Updated Cart.jsx: adjusted top padding below header to pt-[96px]")

print("All fixes applied successfully!")

