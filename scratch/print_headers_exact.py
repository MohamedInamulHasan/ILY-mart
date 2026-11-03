# -*- coding: utf-8 -*-
files = {
    'HomeHeader': ('src/components/home/HomeHeader.jsx', 40, 75),
    'Home': ('src/pages/Home.jsx', 85, 120),
    'Shop': ('src/pages/Shop.jsx', 94, 110),
    'Orders': ('src/pages/Orders.jsx', 123, 160),
    'Profile': ('src/pages/Profile.jsx', 130, 165),
    'Services': ('src/pages/Services.jsx', 105, 145),
    'ProductGroupProducts': ('src/pages/ProductGroupProducts.jsx', 100, 145),
    'CategoryProducts': ('src/pages/CategoryProducts.jsx', 65, 105),
    'Checkout': ('src/pages/Checkout.jsx', 385, 420),
    'OrderConfirmation': ('src/pages/OrderConfirmation.jsx', 245, 275),
    'Cart': ('src/pages/Cart.jsx', 38, 75),
    'StoreProducts': ('src/pages/StoreProducts.jsx', 245, 290)
}

for name, (fpath, start, end) in files.items():
    print(f'=== {name} ({fpath}) ===')
    with open(fpath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    for i in range(max(0, start-1), min(len(lines), end)):
        print(f'{i+1}: {lines[i]}', end='')
    print()
