with open('src/pages/admin/DeliveryDashboard.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Update list container padding to pb-44
target_padding = '<div className="px-5 mt-2 max-w-3xl mx-auto pb-36">'
replacement_padding = '<div className="px-5 mt-2 max-w-3xl mx-auto pb-44">'

# 2. Lift button up inside attached bottom rectangle footer to clear mobile navigation bar
target_style = "style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))', paddingTop: '0.75rem' }}"
replacement_style = "style={{ paddingBottom: 'calc(2.25rem + env(safe-area-inset-bottom, 20px))', paddingTop: '0.85rem' }}"

if target_padding in text and target_style in text:
    text = text.replace(target_padding, replacement_padding, 1)
    text = text.replace(target_style, replacement_style, 1)
    with open('src/pages/admin/DeliveryDashboard.jsx', 'w', encoding='utf-8') as f:
        f.write(text)
    print('SUCCESS')
else:
    print('FAILED')
    if target_padding not in text:
        print('target_padding not found')
    if target_style not in text:
        print('target_style not found')

