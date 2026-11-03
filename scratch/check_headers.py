# -*- coding: utf-8 -*-
import os

files = [
    ('HomeHeader', 'src/components/home/HomeHeader.jsx'),
    ('Home', 'src/pages/Home.jsx'),
    ('Shop (store)', 'src/pages/Shop.jsx'),
    ('Orders', 'src/pages/Orders.jsx'),
    ('Profile', 'src/pages/Profile.jsx'),
    ('Services', 'src/pages/Services.jsx'),
    ('ProductGroupProducts', 'src/pages/ProductGroupProducts.jsx'),
    ('CategoryProducts', 'src/pages/CategoryProducts.jsx'),
    ('Checkout', 'src/pages/Checkout.jsx'),
    ('OrderConfirmation', 'src/pages/OrderConfirmation.jsx'),
    ('Cart', 'src/pages/Cart.jsx'),
    ('StoreProducts', 'src/pages/StoreProducts.jsx')
]

for name, fpath in files:
    print('==============================')
    print('PAGE:', name)
    with open(fpath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # print the return / header section
    in_return = False
    header_lines = []
    for i, line in enumerate(lines):
        if 'return (' in line:
            in_return = True
        if in_return:
            header_lines.append(f'{i+1}: {line}')
            if len(header_lines) > 40:
                break
    print(''.join(header_lines[:35]))
