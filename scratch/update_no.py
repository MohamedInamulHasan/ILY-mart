path = 'src/context/CartContext.jsx'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()
c = c.replace("{language === 'ta' ? 'வேண்டாம்' : 'Cancel'}", "{language === 'ta' ? 'இல்லை' : 'No'}")
c = c.replace("/* Buttons: Cancel is Black, Yes is Delivery boy tshirt color (#00B329) */", "/* Buttons: No is Black, Yes is Delivery boy tshirt color (#00B329) */")
with open(path, 'w', encoding='utf-8') as f:
    f.write(c)
print("Updated CartContext")

