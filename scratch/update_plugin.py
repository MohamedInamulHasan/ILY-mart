files = [
    'android/app/src/main/java/com/ilayangudimart/app/FloatingOverlayPlugin.java',
    'APP _ homly/homly-mobile/android/app/src/main/java/com/ilayangudimart/app/FloatingOverlayPlugin.java'
]

target = """    @PluginMethod
    public void openExternalUrl(PluginCall call) {
        String urlStr = call.getString("url");
        if (urlStr == null || urlStr.trim().isEmpty()) {
            call.reject("URL_REQUIRED");
            return;
        }
        try {
            Uri uri = Uri.parse(urlStr.trim());
            Intent intent = new Intent(Intent.ACTION_VIEW, uri);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {"""

replacement = """    @PluginMethod
    public void openExternalUrl(PluginCall call) {
        String urlStr = call.getString("url");
        if (urlStr == null || urlStr.trim().isEmpty()) {
            call.reject("URL_REQUIRED");
            return;
        }
        try {
            String trimmed = urlStr.trim();
            Uri uri = Uri.parse(trimmed);

            if (trimmed.contains("maps.google.com") || trimmed.contains("google.com/maps") ||
                trimmed.contains("maps.app.goo.gl") || trimmed.contains("goo.gl/maps") ||
                trimmed.startsWith("geo:")) {
                try {
                    Intent mapIntent = new Intent(Intent.ACTION_VIEW, uri);
                    mapIntent.setPackage("com.google.android.apps.maps");
                    mapIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    getContext().startActivity(mapIntent);
                    JSObject ret = new JSObject();
                    ret.put("success", true);
                    call.resolve(ret);
                    return;
                } catch (Exception ignored) {}
            }

            Intent intent = new Intent(Intent.ACTION_VIEW, uri);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {"""

for fpath in files:
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace('\r\n', '\n')
    target_clean = target.replace('\r\n', '\n')
    replacement_clean = replacement.replace('\r\n', '\n')
    if target_clean in content:
        content = content.replace(target_clean, replacement_clean)
        with open(fpath, 'w', encoding='utf-8', newline='\n') as f:
            f.write(content)
        print('Updated', fpath)
    else:
        print('Target not found in', fpath)
