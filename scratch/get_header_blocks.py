# -*- coding: utf-8 -*-
files = {
    'HomeHeader': 'src/components/home/HomeHeader.jsx',
    'Home': 'src/pages/Home.jsx',
    'Shop': 'src/pages/Shop.jsx',
    'Orders': 'src/pages/Orders.jsx',
    'Profile': 'src/pages/Profile.jsx',
    'Services': 'src/pages/Services.jsx',
    'ProductGroupProducts': 'src/pages/ProductGroupProducts.jsx',
    'CategoryProducts': 'src/pages/CategoryProducts.jsx',
    'Checkout': 'src/pages/Checkout.jsx',
    'OrderConfirmation': 'src/pages/OrderConfirmation.jsx',
    'Cart': 'src/pages/Cart.jsx',
    'StoreProducts': 'src/pages/StoreProducts.jsx'
}

for name, fpath in files.items():
    with open(fpath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    print(f'=== {name} ===')
    for i, line in enumerate(lines):
        if any(w in line for w in ['<HomeHeader', 'rounded-b-[2', 'rounded-b-2', 'Header Card', 'Premium Header', 'White Header']):
            for k in range(max(0, i-1), min(len(lines), i+30)):
                print(f'{k+1}: {lines[k]}', end='')
            break

