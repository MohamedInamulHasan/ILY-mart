with open('src/components/home/HomeHeader.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

old_delivery_to = 'text-[11px] text-gray-700'
new_delivery_to = 'text-[10px] text-gray-700'
c = c.replace(old_delivery_to, new_delivery_to)

old_addr = 'text-[16px] sm:text-[17px] font-bold'
new_addr = 'text-[14px] sm:text-[15px] font-bold'
c = c.replace(old_addr, new_addr)

with open('src/components/home/HomeHeader.jsx', 'w', encoding='utf-8') as f:
    f.write(c)

print('Updated HomeHeader location text successfully!')

