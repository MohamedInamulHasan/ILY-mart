files = [
    'android/app/src/main/java/com/ilayangudimart/app/FloatingLogoService.java',
    'APP _ homly/homly-mobile/android/app/src/main/java/com/ilayangudimart/app/FloatingLogoService.java'
]

for file_path in files:
    with open(file_path, 'r', encoding='utf-8') as f:
        code = f.read()

    # 1. Update triggerCardFromJS
    code = code.replace(
        '    public static void triggerCardFromJS(JSONObject orderJson) {\n        if (instance != null) {',
        '    public static void triggerCardFromJS(JSONObject orderJson) {\n        if (instance != null && !isAppInForeground) {'
    )

    # 2. Update showPorterOrderCard guard
    code = code.replace(
        '    public synchronized void showPorterOrderCard(JSONObject order) {\n        if (order == null) return;',
        '    public synchronized void showPorterOrderCard(JSONObject order) {\n        if (order == null || isAppInForeground) return;'
    )

    # 3. Update polling check
    code = code.replace(
        '                                alertedOrderIds.add(orderId);\n                                mainHandler.post(() -> showPorterOrderCard(order));',
        '                                alertedOrderIds.add(orderId);\n                                if (!isAppInForeground) {\n                                    mainHandler.post(() -> showPorterOrderCard(order));\n                                }'
    )

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(code)
    print(f"Updated {file_path}")
