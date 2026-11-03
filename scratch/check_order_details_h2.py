with open('src/pages/OrderDetails.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()
for i in range(190, 230):
    print(f'{i+1}: {lines[i]}', end='')
