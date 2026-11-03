cart_path = r"c:\Users\moham\ILAYANGUDI PROJECT\src\context\CartContext.jsx"
with open(cart_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace Cancel with No
old_btn = "{language === 'ta' ? 'வேண்டாம்' : 'Cancel'}"
new_btn = "{language === 'ta' ? 'இல்லை' : 'No'}"

if old_btn in content:
    content = content.replace(old_btn, new_btn)
    with open(cart_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Successfully replaced Cancel with No")
else:
    # Try finding the button directly
    target = 'Cancel'
    print("Old button text pattern not found directly, checking context...")
    if "Cancel" in content:
        content = content.replace(">Cancel<", ">No<")
        content = content.replace("? 'Cancel'", "? 'No'")
        content = content.replace(": 'Cancel'", ": 'No'")
        with open(cart_path, "w", encoding="utf-8") as f:
            f.write(content)
        print("Replaced Cancel with No using fallback patterns")

