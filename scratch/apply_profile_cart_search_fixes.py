import os
import re

# 1. Update src/index.css to remove all tap highlights, outlines, and box-shadows on input/button/link
css_path = r"c:\Users\moham\ILAYANGUDI PROJECT\src\index.css"
with open(css_path, "r", encoding="utf-8") as f:
    css_content = f.read()

old_outline_css = """/* Remove unwanted default browser outline boxes on links and buttons */
a, button {
    -webkit-tap-highlight-color: transparent;
}
a:focus, a:focus-visible, a:active,
button:focus, button:focus-visible, button:active {
    outline: none !important;
}"""

new_outline_css = """/* Remove unwanted default browser outline boxes, tap highlights and focus rings */
a, button, input, textarea, select {
    -webkit-tap-highlight-color: transparent !important;
}
a:focus, a:focus-visible, a:active,
button:focus, button:focus-visible, button:active,
input:focus, input:focus-visible, input:active,
textarea:focus, textarea:focus-visible, textarea:active,
select:focus, select:focus-visible, select:active {
    outline: none !important;
    box-shadow: none !important;
    -webkit-tap-highlight-color: transparent !important;
}"""

if old_outline_css in css_content:
    css_content = css_content.replace(old_outline_css, new_outline_css)
else:
    css_content = css_content.replace(old_outline_css.replace("\r\n", "\n"), new_outline_css)
with open(css_path, "w", encoding="utf-8") as f:
    f.write(css_content)
print("Updated index.css")

# 2. Update search inputs in all pages: remove shadow, add outline-none ring-0 and inline style
search_pages = [
    r"c:\Users\moham\ILAYANGUDI PROJECT\src\pages\Home.jsx",
    r"c:\Users\moham\ILAYANGUDI PROJECT\src\pages\Shop.jsx",
    r"c:\Users\moham\ILAYANGUDI PROJECT\src\pages\StoreProducts.jsx",
    r"c:\Users\moham\ILAYANGUDI PROJECT\src\pages\Orders.jsx",
    r"c:\Users\moham\ILAYANGUDI PROJECT\src\pages\Services.jsx",
    r"c:\Users\moham\ILAYANGUDI PROJECT\src\pages\CategoryProducts.jsx"
]

old_input_class = "w-full pl-11 sm:pl-12 pr-11 py-3.5 sm:py-4 text-[14.5px] sm:text-[15.5px] font-medium rounded-2xl border border-gray-200/90 dark:border-gray-700/80 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-[#2E5A2E]/50 dark:focus:border-[#CBF9B2]/50 transition-all duration-200 shadow-[0_2px_10px_rgba(0,0,0,0.04)] dark:shadow-none"

new_input_class = "w-full pl-11 sm:pl-12 pr-11 py-3.5 sm:py-4 text-[14.5px] sm:text-[15.5px] font-medium rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:outline-none focus-visible:outline-none ring-0 focus:ring-0 focus-visible:ring-0 shadow-none transition-colors duration-200"

for sp in search_pages:
    if not os.path.exists(sp):
        continue
    with open(sp, "r", encoding="utf-8") as f:
        c = f.read()
    
    c = c.replace(old_input_class, new_input_class)
    
    # Add inline style to input if not already present
    c = re.sub(
        r'(<input[^>]*className="' + re.escape(new_input_class) + r'")(\s*/>|\s*>)',
        r'\1 style={{ outline: "none", WebkitTapHighlightColor: "transparent" }}\2',
        c
    )
    with open(sp, "w", encoding="utf-8") as f:
        f.write(c)
    print(f"Updated search input in {sp}")

# Also update Categories.jsx search input
cat_path = r"c:\Users\moham\ILAYANGUDI PROJECT\src\pages\Categories.jsx"
if os.path.exists(cat_path):
    with open(cat_path, "r", encoding="utf-8") as f:
        cc = f.read()
    cc = cc.replace(
        'className="w-full pl-12 pr-6 py-4 rounded-full border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none transition-all duration-300 shadow-sm"',
        'className="w-full pl-12 pr-6 py-3.5 sm:py-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:outline-none focus-visible:outline-none ring-0 focus:ring-0 shadow-none transition-colors duration-200" style={{ outline: "none", WebkitTapHighlightColor: "transparent" }}'
    )
    with open(cat_path, "w", encoding="utf-8") as f:
        f.write(cc)
    print("Updated Categories.jsx search input")

# 3. Update Profile.jsx: fix bottom padding pb-48 -> pb-20 sm:pb-24, and WhatsApp button
prof_path = r"c:\Users\moham\ILAYANGUDI PROJECT\src\pages\Profile.jsx"
with open(prof_path, "r", encoding="utf-8") as f:
    prof_content = f.read()

prof_content = prof_content.replace(
    '<div className="min-h-screen bg-[#E8EAEF] dark:bg-gray-900 transition-colors duration-200 w-full relative pb-48">',
    '<div className="min-h-screen bg-[#E8EAEF] dark:bg-gray-900 transition-colors duration-200 w-full relative pb-20 sm:pb-24">'
)

prof_content = prof_content.replace(
    'className="fixed bottom-36 right-6 w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all z-[60] animate-in fade-in zoom-in duration-500"',
    'className="fixed bottom-20 right-5 sm:bottom-24 sm:right-6 w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all z-[60] animate-in fade-in zoom-in duration-500"'
)
with open(prof_path, "w", encoding="utf-8") as f:
    f.write(prof_content)
print("Updated Profile.jsx")

# 4. Update Cart.jsx: payment card and below padding exactly like checkout page card, and change proceed to checkout to place order
cart_path = r"c:\Users\moham\ILAYANGUDI PROJECT\src\pages\Cart.jsx"
with open(cart_path, "r", encoding="utf-8") as f:
    cart_content = f.read()

# Update outer container padding: pb-2 -> pb-20 md:pb-40 (like Checkout.jsx)
cart_content = cart_content.replace(
    '<div className="min-h-screen bg-[#E8EAEF] dark:bg-gray-900 flex flex-col transition-colors duration-200 relative overflow-hidden mx-auto max-w-md w-full my-auto pb-2">',
    '<div className="min-h-screen bg-[#E8EAEF] dark:bg-gray-900 flex flex-col transition-colors duration-200 relative mx-auto max-w-md w-full pb-20 md:pb-40">'
)

old_cart_payment = """                {/* Order Summary Integrated in Flow */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-3.5 sm:p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                     <div className="flex justify-between items-center mb-2.5 pb-2 border-b border-gray-100/60 dark:border-gray-700/60">
                          <h2 className="text-[15px] sm:text-[16px] font-bold text-gray-900 dark:text-white">{t('Payment')}</h2>
                          <span className="text-[12px] font-medium text-gray-400">{cartItems.length} {t('items')}</span>
                     </div>
    
                     <div className="space-y-2 mb-3 sm:mb-4">
                          <div className="flex justify-between items-center">
                               <span className="text-[14px] text-gray-400 font-medium">{t('Subtotal')}</span>
                               <span className="text-[15px] font-extrabold text-gray-900 dark:text-white">₹ {cartTotal.toFixed(0)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                               <span className="text-[14px] text-gray-400 font-medium">{t('Delivery')}</span>
                               {deliveryCharge === 0 ? (
                                   <span className="text-[15px] font-bold text-[#2E5A2E]">{t('FREE')}</span>
                               ) : (
                                   <span className="text-[15px] font-bold text-gray-900 dark:text-white">₹ {deliveryCharge.toFixed(0)}</span>
                               )}
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-gray-50 dark:border-gray-700/40">
                               <span className="text-[15px] text-gray-500 font-medium">{t('Total')}</span>
                               <span className="text-[16px] font-extrabold text-gray-900 dark:text-white">₹ {finalTotal.toFixed(0)}</span>
                          </div>
                     </div>
    
                     <Link to="/checkout" className="w-full bg-black text-white rounded-full py-2.5 sm:py-3 flex items-center justify-center font-normal text-sm active:scale-[0.98] transition-transform">
                           <span>{t('Proceed to Checkout')}</span>
                     </Link>
                </div>"""

new_cart_payment = """                {/* Order Summary / Payment Card — exactly matching Checkout.jsx design */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-gray-700 relative overflow-hidden">
                    <div className="flex justify-between items-center mb-3.5">
                        <h2 className="text-[17px] font-bold text-gray-900 dark:text-white">{t('Payment Summary')}</h2>
                        <span className="text-[13px] font-medium text-gray-400 tracking-tight">{cartItems.length} {t('items')}</span>
                    </div>

                    <div className="space-y-2.5 mb-5">
                        <div className="flex justify-between items-center">
                            <span className="text-[14px] text-gray-400 font-medium">{t('Subtotal')}</span>
                            <span className="text-[15px] font-extrabold text-gray-900 dark:text-white">₹{cartTotal.toFixed(0)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[14px] text-gray-400 font-medium">{t('Delivery')}</span>
                            {deliveryCharge === 0 ? (
                                <span className="text-[15px] font-extrabold text-[#2E5A2E] dark:text-[#CBF9B2]">FREE</span>
                            ) : (
                                <span className="text-[15px] font-extrabold text-gray-900 dark:text-white">₹{deliveryCharge.toFixed(0)}</span>
                            )}
                        </div>
                        <div className="flex justify-between items-center pt-2">
                            <span className="text-[15px] text-gray-500 font-medium">{t('Total')}</span>
                            <span className="text-[17px] font-extrabold text-gray-900 dark:text-white">₹{finalTotal.toFixed(0)}</span>
                        </div>
                    </div>

                    <Link
                        to="/checkout"
                        className="w-full bg-black text-white rounded-full py-3 sm:py-3.5 flex items-center justify-center font-normal text-sm active:scale-[0.98] transition-transform"
                    >
                        <span>{t('Place Order')}</span>
                    </Link>
                </div>"""

cart_content = cart_content.replace(old_cart_payment.replace("\r\n", "\n"), new_cart_payment.replace("\r\n", "\n"))
with open(cart_path, "w", encoding="utf-8") as f:
    f.write(cart_content)
print("Updated Cart.jsx")

