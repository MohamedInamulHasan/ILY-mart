with open('src/pages/Cart.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()
for i in range(78, 115):
    print(f'{i+1}: {lines[i]}', end='')
