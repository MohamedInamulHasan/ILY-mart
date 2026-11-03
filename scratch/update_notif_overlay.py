with open(r'c:\Users\moham\ILAYANGUDI PROJECT\src\components\NotificationOverlay.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = "queryClient.invalidateQueries({ queryKey: ['orders'] });"
replacement = """queryClient.invalidateQueries({ queryKey: ['orders'] });

            // Pop up the new incoming order card modal for the delivery boy and trigger alert
            setIncomingOrder(order);
            triggerIncomingOrderAlert();"""

if target in content:
    content = content.replace(target, replacement, 1)
    with open(r'c:\Users\moham\ILAYANGUDI PROJECT\src\components\NotificationOverlay.jsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Updated NotificationOverlay.jsx successfully!")
else:
    print("Target not found")

