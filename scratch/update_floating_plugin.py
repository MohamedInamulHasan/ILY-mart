paths = [
    'android/app/src/main/java/com/ilayangudimart/app/FloatingOverlayPlugin.java',
    'APP _ homly/homly-mobile/android/app/src/main/java/com/ilayangudimart/app/FloatingOverlayPlugin.java'
]

for p in paths:
    with open(p, 'r', encoding='utf-8') as f:
        text = f.read()
    
    target_show = """            // Save token if provided
            String token = call.getString("token");
            if (token != null && !token.isEmpty()) {
                SharedPreferences prefs = getContext().getSharedPreferences("ILYMartPrefs", Context.MODE_PRIVATE);
                prefs.edit().putString("authToken", token).apply();
            }"""

    replacement_show = """            SharedPreferences prefs = getContext().getSharedPreferences("ILYMartPrefs", Context.MODE_PRIVATE);
            prefs.edit().putBoolean("floating_enabled", true).apply();

            // Save token if provided
            String token = call.getString("token");
            if (token != null && !token.isEmpty()) {
                prefs.edit().putString("authToken", token).apply();
            }"""

    target_hide = """    @PluginMethod
    public void hide(PluginCall call) {
        try {
            Intent intent = new Intent(getContext(), FloatingLogoService.class);
            getContext().stopService(intent);"""

    replacement_hide = """    @PluginMethod
    public void hide(PluginCall call) {
        try {
            SharedPreferences prefs = getContext().getSharedPreferences("ILYMartPrefs", Context.MODE_PRIVATE);
            prefs.edit().putBoolean("floating_enabled", false).apply();

            Intent intent = new Intent(getContext(), FloatingLogoService.class);
            getContext().stopService(intent);"""

    if target_show in text and target_hide in text:
        text = text.replace(target_show, replacement_show, 1)
        text = text.replace(target_hide, replacement_hide, 1)
        with open(p, 'w', encoding='utf-8') as f:
            f.write(text)
        print(f'Updated {p}')
    else:
        print(f'Failed to match in {p}')
