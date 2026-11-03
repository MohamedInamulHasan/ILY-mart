with open('src/pages/OrderDetails.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace('w-[46px] h-[46px]', 'w-[42px] h-[42px]')
c = c.replace("text-[17px] font-bold text-gray-900 dark:text-white tracking-tight\">{t('Order Details')", "text-[18px] font-bold text-gray-900 dark:text-white tracking-tight\">{t('Order Details')")

with open('src/pages/OrderDetails.jsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('OrderDetails.jsx updated')
