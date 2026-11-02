print("--- 1. Updating Checkout.jsx ---")
with open('src/pages/Checkout.jsx', 'r', encoding='utf-8') as f:
    co = f.read()

# Make the grey Payment Method header icon green
old_grey_header_icon = """                                <div className="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400">
                                    <CreditCard size={20} />
                                </div>"""

new_green_header_icon = """                                <div className="w-10 h-10 rounded-2xl bg-green-50 dark:bg-[#CBF9B2]/20 flex items-center justify-center text-[#2E5A2E] dark:text-[#CBF9B2]">
                                    <CreditCard size={20} />
                                </div>"""

if old_grey_header_icon in co:
    co = co.replace(old_grey_header_icon, new_green_header_icon)
    print("Made Payment Method header icon green.")
else:
    print("Warning: old_grey_header_icon not matched verbatim!")

# Make Cash on Delivery icon box vivid green
old_cash_icon_box = """                                    <div className="w-10 h-10 rounded-2xl bg-[#2E5A2E]/10 dark:bg-[#CBF9B2]/15 text-[#2E5A2E] dark:text-[#CBF9B2] flex items-center justify-center mr-4 flex-shrink-0">
                                        <Banknote size={22} />
                                    </div>"""

new_cash_icon_box = """                                    <div className="w-10 h-10 rounded-2xl bg-green-50 dark:bg-[#CBF9B2]/20 border border-green-200/50 dark:border-[#CBF9B2]/20 text-[#2E5A2E] dark:text-[#CBF9B2] flex items-center justify-center mr-4 flex-shrink-0 shadow-xs">
                                        <Banknote size={22} />
                                    </div>"""

if old_cash_icon_box in co:
    co = co.replace(old_cash_icon_box, new_cash_icon_box)
    print("Made Cash icon box crisp green.")
else:
    print("Warning: old_cash_icon_box not matched verbatim!")

# Change button in Checkout from Place Order to Continue
old_checkout_btn = """                                {isNavigating ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : t('Place Order')}"""

new_checkout_btn = """                                {isNavigating ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : t('Continue')}"""

if old_checkout_btn in co:
    co = co.replace(old_checkout_btn, new_checkout_btn)
    print("Changed Checkout button to Continue.")
else:
    print("Warning: old_checkout_btn not matched verbatim!")

with open('src/pages/Checkout.jsx', 'w', encoding='utf-8') as f:
    f.write(co)
print("Updated Checkout.jsx successfully.")

print("--- 2. Updating OrderConfirmation.jsx ---")
with open('src/pages/OrderConfirmation.jsx', 'r', encoding='utf-8') as f:
    oc = f.read()

# Change button in OrderConfirmation from Place Order to Confirm Order
old_oc_btn = """                            {isSubmitting ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                t('Place Order')
                            )}"""

new_oc_btn = """                            {isSubmitting ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                t('Confirm Order')
                            )}"""

if old_oc_btn in oc:
    oc = oc.replace(old_oc_btn, new_oc_btn)
    print("Changed OrderConfirmation button to Confirm Order.")
else:
    print("Warning: old_oc_btn not matched verbatim!")

# Remove pincode from address display in OrderConfirmation
old_oc_addr = "{formData.address}{formData.city ? `, ${formData.city}` : ''}{formData.pincode ? ` - ${formData.pincode}` : ''}"
new_oc_addr = "{formData.address}{formData.city ? `, ${formData.city}` : ''}"

if old_oc_addr in oc:
    oc = oc.replace(old_oc_addr, new_oc_addr)
    print("Removed pincode from OrderConfirmation address display.")
else:
    print("Warning: old_oc_addr not matched verbatim!")

with open('src/pages/OrderConfirmation.jsx', 'w', encoding='utf-8') as f:
    f.write(oc)
print("Updated OrderConfirmation.jsx successfully.")

