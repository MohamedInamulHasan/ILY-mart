with open('src/pages/Cart.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = '                                       <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500 p-0.5 transition-colors flex-shrink-0">'
replacement = '''                                       <button onClick={() => {
                                           removeFromCart(item.id);
                                           if (cartItems.length <= 1) {
                                               navigate('/');
                                           }
                                       }} className="text-gray-400 hover:text-red-500 p-0.5 transition-colors flex-shrink-0">'''

if target in content:
    content = content.replace(target, replacement, 1)
    with open('src/pages/Cart.jsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("SUCCESS")
else:
    print("TARGET NOT FOUND")
