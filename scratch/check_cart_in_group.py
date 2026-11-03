with open('src/pages/ProductGroupProducts.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()
for i in range(130, 160):
    print(f'{i+1}: {lines[i]}', end='')
print('=== CategoryProducts ===')
with open('src/pages/CategoryProducts.jsx', 'r', encoding='utf-8') as f:
    lines2 = f.readlines()
for i in range(130, 160):
    print(f'{i+1}: {lines2[i]}', end='')
