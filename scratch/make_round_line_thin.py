with open('src/components/home/CategorySection.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Replace border-[3.5px] with border-[1.5px]
c = c.replace('border-[3.5px]', 'border-[1.5px]')

with open('src/components/home/CategorySection.jsx', 'w', encoding='utf-8') as f:
    f.write(c)

print('Updated CategorySection: border line changed to thin border-[1.5px]!')

