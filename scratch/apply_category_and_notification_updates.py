# 1. Update CartContext.jsx to remove shadow-md from Yes button in delivery notification
with open('src/context/CartContext.jsx', 'r', encoding='utf-8') as f:
    cart_content = f.read()

old_yes_btn = 'className="flex-1 py-2.5 bg-[#00B329] hover:bg-[#009e24] text-white font-black rounded-xl text-xs sm:text-[13px] active:scale-95 transition-transform shadow-md"'
new_yes_btn = 'className="flex-1 py-2.5 bg-[#00B329] hover:bg-[#009e24] text-white font-black rounded-xl text-xs sm:text-[13px] active:scale-95 transition-transform"'

if old_yes_btn in cart_content:
    cart_content = cart_content.replace(old_yes_btn, new_yes_btn)
    with open('src/context/CartContext.jsx', 'w', encoding='utf-8') as f:
        f.write(cart_content)
    print("Updated CartContext.jsx: removed shadow effect from Yes button!")
else:
    print("Warning: old_yes_btn target not found in CartContext.jsx")

# 2. Update CategorySection.jsx for #00B329 full round no outline and memoization
with open('src/components/home/CategorySection.jsx', 'r', encoding='utf-8') as f:
    cat_content = f.read()

# Replace "All" category circle
# Current has border-[1.5px] ${selectedCategory === 'All' ? 'border-[#2E5A2E] dark:border-[#2E5A2E] bg-[#CBF9B2] dark:bg-[#CBF9B2]' : 'border-transparent bg-[#E8EAEF] dark:bg-gray-800'}
import re

# Match "All" circle
cat_content = re.sub(
    r'className={`w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-full overflow-hidden flex items-center justify-center transition-all group-hover:scale-105 shadow-sm border-\[[^\]]+\] \${selectedCategory === \'All\' \?[^:]+:[^}]+}`}',
    r"className={`w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-full overflow-hidden flex items-center justify-center transition-all group-hover:scale-105 shadow-sm ${selectedCategory === 'All' ? 'bg-[#00B329] dark:bg-[#00B329]' : 'bg-[#E8EAEF] dark:bg-gray-800'}`}",
    cat_content
)

# Match categories mapped circle
cat_content = re.sub(
    r'className={`w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-full overflow-hidden flex items-center justify-center transition-all group-hover:scale-105 shadow-sm border-\[[^\]]+\] \${isSelected \?[^:]+:[^}]+}`}',
    r"className={`w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-full overflow-hidden flex items-center justify-center transition-all group-hover:scale-105 shadow-sm ${isSelected ? 'bg-[#00B329] dark:bg-[#00B329]' : 'bg-[#E8EAEF] dark:bg-gray-800'}`}",
    cat_content
)

# Also ensure scale-90 is removed from images
cat_content = re.sub(r'\$\{selectedCategory === \'All\' \? \'scale-90\' : \'\'\}', '', cat_content)
cat_content = re.sub(r'\$\{isSelected \? \'scale-90\' : \'\'\}', '', cat_content)

# Update text color when selected to #00B329
cat_content = cat_content.replace(
    "${selectedCategory === 'All' ? 'text-[#2E5A2E] dark:text-[#CBF9B2]' : 'text-gray-400'}",
    "${selectedCategory === 'All' ? 'text-[#00B329] dark:text-[#00B329]' : 'text-gray-400'}"
)
cat_content = cat_content.replace(
    "${isSelected ? 'text-[#2E5A2E] dark:text-[#CBF9B2]' : 'text-gray-600 dark:text-gray-400'}",
    "${isSelected ? 'text-[#00B329] dark:text-[#00B329]' : 'text-gray-600 dark:text-gray-400'}"
)

# Wrap export in React.memo
if 'export default CategorySection;' in cat_content:
    cat_content = cat_content.replace('export default CategorySection;', 'export default React.memo(CategorySection);')

with open('src/components/home/CategorySection.jsx', 'w', encoding='utf-8') as f:
    f.write(cat_content)
print("Updated CategorySection.jsx: full round #00B329, no outline, React.memo!")

# 3. Update Home.jsx to stabilize categories and use transition for zero lag
with open('src/pages/Home.jsx', 'r', encoding='utf-8') as f:
    home_content = f.read()

# Add useTransition, useCallback if not present
if 'useTransition' not in home_content:
    home_content = home_content.replace(
        "import { useState, useMemo, useEffect, useCallback }",
        "import { useState, useMemo, useEffect, useCallback, useTransition }"
    )

# Stabilize featuredCategories so it doesn't jump or "correct" when products load
old_feat_cat_block = """    // Filter categories — show categories immediately once rawCategories appears
    const featuredCategories = useMemo(() => {
        const raw = Array.isArray(rawCategories) ? rawCategories : (rawCategories?.data || []);
        const allProducts = Array.isArray(rawProducts) ? rawProducts : (rawProducts?.data || []);

        if (raw.length === 0) return [];
        if (allProducts.length === 0) {
            return raw.filter(cat => !cat.isHidden);
        }

        const productCategories = new Set(allProducts.map(p => p.category?.toLowerCase()));
        const filtered = raw.filter(cat => {
            if (cat.isHidden) return false;
            return productCategories.has(cat.name?.toLowerCase());
        });

        return filtered.length > 0 ? filtered : raw.filter(cat => !cat.isHidden);
    }, [rawCategories, rawProducts]);"""

new_feat_cat_block = """    // Categories appear stably without jumping or delayed 'correcting'
    const featuredCategories = useMemo(() => {
        const raw = Array.isArray(rawCategories) ? rawCategories : (rawCategories?.data || []);
        return raw.filter(cat => !cat.isHidden);
    }, [rawCategories]);"""

if old_feat_cat_block in home_content:
    home_content = home_content.replace(old_feat_cat_block, new_feat_cat_block)
    print("Updated Home.jsx: stabilized featuredCategories!")
else:
    print("Warning: old_feat_cat_block not matched directly in Home.jsx, trying regex replace")
    home_content = re.sub(
        r'// Filter categories — show categories immediately once rawCategories appears\s+const featuredCategories = useMemo\(\(\) => \{[\s\S]*?\}, \[rawCategories, rawProducts\]\);',
        new_feat_cat_block,
        home_content
    )

# Use useTransition for category switching so it doesn't block the UI
old_state = "    const [selectedCategory, setSelectedCategory] = useState('All');"
new_state = """    const [selectedCategory, setSelectedCategory] = useState('All');
    const [, startTransition] = useTransition();

    const handleSelectCategory = useCallback((catName) => {
        startTransition(() => {
            setSelectedCategory(catName);
        });
    }, []);"""

if old_state in home_content and 'handleSelectCategory' not in home_content:
    home_content = home_content.replace(old_state, new_state)
    home_content = home_content.replace(
        "onSelectCategory={setSelectedCategory}",
        "onSelectCategory={handleSelectCategory}"
    )
    print("Updated Home.jsx: added useTransition and handleSelectCategory!")

with open('src/pages/Home.jsx', 'w', encoding='utf-8') as f:
    f.write(home_content)

# 4. Wrap StoreSection in React.memo for butter-smooth rendering
with open('src/components/home/StoreSection.jsx', 'r', encoding='utf-8') as f:
    store_sec_content = f.read()

if 'import React' not in store_sec_content:
    store_sec_content = "import React from 'react';\n" + store_sec_content

if 'export default StoreSection;' in store_sec_content:
    store_sec_content = store_sec_content.replace(
        'export default StoreSection;',
        'export default React.memo(StoreSection);'
    )
    with open('src/components/home/StoreSection.jsx', 'w', encoding='utf-8') as f:
        f.write(store_sec_content)
    print("Updated StoreSection.jsx: wrapped with React.memo!")

