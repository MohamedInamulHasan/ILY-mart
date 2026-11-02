with open('src/pages/Checkout.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add Banknote import if not present
if 'Banknote' not in content:
    content = content.replace(
        "import { ArrowLeft,",
        "import { ArrowLeft, Banknote,"
    )
    print("Added Banknote import.")

# 2. Replace radio circle with Banknote cash icon
old_radio = """                                    <div className="w-6 h-6 rounded-full border-2 border-gray-200 dark:border-gray-600 flex items-center justify-center mr-4">
                                        {formData.paymentMethod === 'cod' && <div className="w-3 h-3 rounded-full bg-[#2E5A2E] dark:bg-[#CBF9B2]" />}
                                    </div>"""

new_cash = """                                    <div className="w-10 h-10 rounded-2xl bg-[#2E5A2E]/10 dark:bg-[#CBF9B2]/15 text-[#2E5A2E] dark:text-[#CBF9B2] flex items-center justify-center mr-4 flex-shrink-0">
                                        <Banknote size={22} />
                                    </div>"""

if old_radio in content:
    content = content.replace(old_radio, new_cash)
    print("Replaced radio button with Banknote cash icon.")
else:
    print("Warning: old_radio not found directly, checking regex...")
    import re
    content = re.sub(
        r'<div className="w-6 h-6 rounded-full border-2[^>]*>[\s\S]*?</div>\s*(?=<input)',
        new_cash + '\n',
        content
    )
    print("Replaced via regex.")

with open('src/pages/Checkout.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated Checkout.jsx successfully.")
