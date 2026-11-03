with open('src/components/home/CategorySection.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Replace line 62 ('All')
old_all_circle = "className={`w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-full overflow-hidden flex items-center justify-center transition-all group-hover:scale-105 shadow-sm border-[3.5px] ${selectedCategory === 'All' ? 'border-[#2E5A2E] dark:border-[#2E5A2E] bg-[#CBF9B2] dark:bg-[#CBF9B2]' : 'border-transparent bg-[#E8EAEF] dark:bg-gray-800'}`}"
new_all_circle = "className={`w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-full overflow-hidden flex items-center justify-center transition-all group-hover:scale-105 shadow-sm border-2 ${selectedCategory === 'All' ? 'bg-[#84D957] dark:bg-[#84D957] border-transparent' : 'bg-[#E8EAEF] dark:bg-gray-800 border-transparent'}`}"

# Replace line 90 (categories)
old_cat_circle = "className={`w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-full overflow-hidden flex items-center justify-center transition-all group-hover:scale-105 shadow-sm border-[3.5px] ${isSelected ? 'border-[#2E5A2E] dark:border-[#2E5A2E] bg-[#CBF9B2] dark:bg-[#CBF9B2]' : 'border-transparent bg-[#E8EAEF] dark:bg-gray-800'}`}"
new_cat_circle = "className={`w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-full overflow-hidden flex items-center justify-center transition-all group-hover:scale-105 shadow-sm border-2 ${isSelected ? 'bg-[#84D957] dark:bg-[#84D957] border-transparent' : 'bg-[#E8EAEF] dark:bg-gray-800 border-transparent'}`}"

# Replace scale-90
old_scale_all = "className={`w-full h-full object-cover rounded-full transition-transform ${selectedCategory === 'All' ? 'scale-90' : ''}`}"
new_scale_all = "className=\"w-full h-full object-cover rounded-full transition-transform\""

old_scale_cat = "className={`w-full h-full object-cover rounded-full transition-transform ${isSelected ? 'scale-90' : ''}`}"
new_scale_cat = "className=\"w-full h-full object-cover rounded-full transition-transform\""

c = c.replace(old_all_circle, new_all_circle)
c = c.replace(old_cat_circle, new_cat_circle)
c = c.replace(old_scale_all, new_scale_all)
c = c.replace(old_scale_cat, new_scale_cat)

with open('src/components/home/CategorySection.jsx', 'w', encoding='utf-8') as f:
    f.write(c)

print('Updated CategorySection successfully!')

