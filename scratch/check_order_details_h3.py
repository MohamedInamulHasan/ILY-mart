with open('src/pages/OrderDetails.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()
for i in range(270, 310):
    print(f'{i+1}: {lines[i]}', end='')
