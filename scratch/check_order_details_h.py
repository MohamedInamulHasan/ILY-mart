with open('src/pages/OrderDetails.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()
for i in range(120, 160):
    print(f'{i+1}: {lines[i]}', end='')
