for fpath in ['src/pages/ProductGroupProducts.jsx', 'src/pages/CategoryProducts.jsx']:
    with open(fpath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    print('=== ' + fpath + ' ===')
    for i, line in enumerate(lines):
        if any(w in line for w in ['rounded-b-', 'Header', 'fixed top-0', 'ArrowLeft']):
            for k in range(max(0, i-1), min(len(lines), i+30)):
                print(f'{k+1}: {lines[k]}', end='')
            break
