with open('src/pages/Cart.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()
for i, line in enumerate(lines):
    if any(w in line for w in ['<header', 'rounded-b-', 'min-h-[42px]', 'Header']):
        print(f'{i+1}: {line}', end='')
