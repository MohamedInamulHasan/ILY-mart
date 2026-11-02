import sys

path = 'src/pages/admin/DeliveryDashboard.jsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

target = '<div className="px-5 mt-2 max-w-3xl mx-auto">'
replacement = '<div className="px-5 mt-2 max-w-3xl mx-auto pb-28">'

if target in text:
    text = text.replace(target, replacement, 1)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(text)
    print('SUCCESS')
else:
    print('TARGET NOT FOUND')

