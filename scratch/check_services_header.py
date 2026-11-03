with open('src/pages/Services.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()
for i in range(110, 155):
    print(f'{i+1}: {lines[i]}', end='')
