paths = [
    'android/app/src/main/java/com/ilayangudimart/app/FloatingLogoService.java',
    'APP _ homly/homly-mobile/android/app/src/main/java/com/ilayangudimart/app/FloatingLogoService.java'
]

for p in paths:
    with open(p, 'r', encoding='utf-8') as f:
        text = f.read()

    # 1. Update createFloatingCircleView attachment condition
    old_create_attach = """        // Add to windowManager only if app is not already in foreground
        if (!isAppInForeground) {
            try {
                windowManager.addView(floatingCircleView, circleParams);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }"""

    new_create_attach = """        // Add to windowManager only if app is not in foreground, enabled, and permitted
        SharedPreferences prefs = getSharedPreferences("ILYMartPrefs", Context.MODE_PRIVATE);
        boolean enabled = prefs.getBoolean("floating_enabled", true);
        boolean canDraw = Build.VERSION.SDK_INT < Build.VERSION_CODES.M || Settings.canDrawOverlays(this);

        if (!isAppInForeground && enabled && canDraw) {
            try {
                windowManager.addView(floatingCircleView, circleParams);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }"""

    # 2. Update showCircleBubble
    old_show_bubble = """    private void showCircleBubble() {
        if (floatingCircleView != null && !floatingCircleView.isAttachedToWindow()) {
            try {
                windowManager.addView(floatingCircleView, circleParams);
            } catch (Exception ignored) {}
        }
    }"""

    new_show_bubble = """    private void showCircleBubble() {
        SharedPreferences prefs = getSharedPreferences("ILYMartPrefs", Context.MODE_PRIVATE);
        boolean enabled = prefs.getBoolean("floating_enabled", true);
        if (!enabled) return;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(this)) {
            return;
        }

        if (floatingCircleView != null && !floatingCircleView.isAttachedToWindow()) {
            try {
                windowManager.addView(floatingCircleView, circleParams);
            } catch (Exception ignored) {}
        }
    }"""

    # 3. Update windowManager.addView(orderCardView, cardParams) to check canDrawOverlays
    old_card_attach = """            windowManager.addView(orderCardView, cardParams);"""
    new_card_attach = """            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M || Settings.canDrawOverlays(this)) {
                try {
                    windowManager.addView(orderCardView, cardParams);
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }"""

    if old_create_attach in text and old_show_bubble in text and old_card_attach in text:
        text = text.replace(old_create_attach, new_create_attach, 1)
        text = text.replace(old_show_bubble, new_show_bubble, 1)
        text = text.replace(old_card_attach, new_card_attach, 1)
        with open(p, 'w', encoding='utf-8') as f:
            f.write(text)
        print(f'Updated {p}')
    else:
        print(f'Failed to match targets in {p}')
