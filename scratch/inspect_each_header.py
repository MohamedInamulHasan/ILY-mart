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
        content = f.read()
    print(f'*** {name} ***')
    lines = content.splitlines()
    for i, line in enumerate(lines):
        if any(token in line for token in ['<HomeHeader', 'rounded-b-[2.5rem]', 'rounded-b-[2rem]', 'ShoppingCart', 'ArrowLeft', 'min-h-[42px]', 'min-h-[38px]']):
            for k in range(max(0, i-2), min(len(lines), i+12)):
                print(f'{k+1}: {lines[k]}')
            print('---')
            break
