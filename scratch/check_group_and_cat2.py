for fpath in ['src/pages/ProductGroupProducts.jsx', 'src/pages/CategoryProducts.jsx']:
    with open(fpath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    print('=== ' + fpath + ' ===')
    for i, line in enumerate(lines):
        if 'return (' in line:
            for k in range(i, min(len(lines), i+30)):
                print(f'{k+1}: {lines[k]}', end='')
            break
