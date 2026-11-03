import os

# 1. Update Profile.jsx bottom gap to exactly match Checkout.jsx (pb-20 md:pb-40)
prof_path = r"c:\Users\moham\ILAYANGUDI PROJECT\src\pages\Profile.jsx"
with open(prof_path, "r", encoding="utf-8") as f:
    prof = f.read()

prof = prof.replace(
    '<div className="min-h-screen bg-[#E8EAEF] dark:bg-gray-900 transition-colors duration-200 w-full relative pb-20 sm:pb-24">',
    '<div className="min-h-screen bg-[#E8EAEF] dark:bg-gray-900 transition-colors duration-200 w-full relative pb-20 md:pb-40">'
)

with open(prof_path, "w", encoding="utf-8") as f:
    f.write(prof)
print("Updated Profile.jsx bottom gap to pb-20 md:pb-40")

# 2. Update Cart.jsx bottom gap and remove nested inner scroll/padding to match Checkout.jsx
cart_path = r"c:\Users\moham\ILAYANGUDI PROJECT\src\pages\Cart.jsx"
with open(cart_path, "r", encoding="utf-8") as f:
    cart = f.read()

cart = cart.replace(
    '<div className="flex-1 overflow-y-auto px-3.5 sm:px-4 pt-[84px] pb-8 no-scrollbar">',
    '<div className="flex-1 w-full px-3.5 sm:px-4 pt-[84px]">'
)

with open(cart_path, "w", encoding="utf-8") as f:
    f.write(cart)
print("Updated Cart.jsx bottom gap and container to match Checkout.jsx")

