with open(r'c:\Users\moham\ILAYANGUDI PROJECT\src\components\NotificationOverlay.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Guard native:open-order with isDeliveryBoy
old_native = """        const handleNativeOpenOrder = async (e) => {
            const orderId = e.detail?.id;"""

new_native = """        const handleNativeOpenOrder = async (e) => {
            if (!isDeliveryBoy) return;
            const orderId = e.detail?.id;"""

if old_native in content:
    content = content.replace(old_native, new_native)

# 2. Guard test-incoming-order with isDeliveryBoy
old_test = """        const handleTestIncomingOrder = (e) => {
            const testOrder = e.detail || {"""

new_test = """        const handleTestIncomingOrder = (e) => {
            if (!isDeliveryBoy) return;
            const testOrder = e.detail || {"""

if old_test in content:
    content = content.replace(old_test, new_test)

# 3. Guard IncomingOrderModal render with isDeliveryBoy
old_render = "{incomingOrder && ("
new_render = "{isDeliveryBoy && incomingOrder && ("
if old_render in content:
    content = content.replace(old_render, new_render)

with open(r'c:\Users\moham\ILAYANGUDI PROJECT\src\components\NotificationOverlay.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated NotificationOverlay.jsx successfully!")

