import os

# 1. Update FloatingOverlayPlugin.java
plugin_paths = [
    r"c:\Users\moham\ILAYANGUDI PROJECT\android\app\src\main\java\com\ilayangudimart\app\FloatingOverlayPlugin.java",
    r"c:\Users\moham\ILAYANGUDI PROJECT\APP _ homly\homly-mobile\android\app\src\main\java\com\ilayangudimart\app\FloatingOverlayPlugin.java"
]

plugin_imports = """package com.ilayangudimart.app;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.PowerManager;
import android.provider.Settings;
import androidx.annotation.NonNull;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONObject;
import java.util.List;
"""

new_plugin_methods = """
    @Override
    public Boolean shouldOverrideLoad(Uri url) {
        if (url == null) return null;
        String urlStr = url.toString();
        if (urlStr.startsWith("intent://") || urlStr.startsWith("geo:") || urlStr.startsWith("tel:") || urlStr.startsWith("mailto:") ||
            urlStr.contains("maps.google.com") || urlStr.contains("google.com/maps") || urlStr.contains("maps.app.goo.gl")) {
            try {
                if (urlStr.startsWith("intent://")) {
                    Intent intent = Intent.parseUri(urlStr, Intent.URI_INTENT_SCHEME);
                    if (intent != null) {
                        try {
                            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                            getContext().startActivity(intent);
                            return true;
                        } catch (Exception e1) {
                            try {
                                intent.setPackage(null);
                                intent.setComponent(null);
                                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                                getContext().startActivity(intent);
                                return true;
                            } catch (Exception e2) {
                                String fallback = intent.getStringExtra("browser_fallback_url");
                                if (fallback != null) {
                                    Intent browserIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(fallback));
                                    browserIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                                    getContext().startActivity(browserIntent);
                                    return true;
                                }
                            }
                        }
                    }
                } else {
                    Intent intent = new Intent(Intent.ACTION_VIEW, url);
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    getContext().startActivity(intent);
                    return true;
                }
            } catch (Exception ignored) {}
            return true; // Never crash the WebView with net::ERR_UNKNOWN_URL_SCHEME
        }
        return null;
    }

    @PluginMethod
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
        } catch (Exception e) {
            try {
                Intent browserIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(urlStr.trim()));
                browserIntent.addCategory(Intent.CATEGORY_BROWSABLE);
                browserIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(browserIntent);
                JSObject ret = new JSObject();
                ret.put("success", true);
                call.resolve(ret);
            } catch (Exception e2) {
                call.reject("FAILED", e2.getMessage());
            }
        }
    }

    @PluginMethod
    public void getNativeLocation(PluginCall call) {
        try {
            Context context = getContext();
            if (ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED &&
                ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                call.reject("PERMISSION_DENIED", "Location permission is not granted.");
                return;
            }

            LocationManager locationManager = (LocationManager) context.getSystemService(Context.LOCATION_SERVICE);
            if (locationManager == null) {
                call.reject("NO_LOCATION_MANAGER", "LocationManager service not available.");
                return;
            }

            Location bestLocation = null;
            List<String> providers = locationManager.getProviders(true);
            if (providers != null) {
                for (String provider : providers) {
                    try {
                        Location l = locationManager.getLastKnownLocation(provider);
                        if (l != null) {
                            if (bestLocation == null || l.getAccuracy() < bestLocation.getAccuracy()) {
                                bestLocation = l;
                            }
                        }
                    } catch (SecurityException ignored) {}
                }
            }

            if (bestLocation != null) {
                JSObject ret = new JSObject();
                ret.put("latitude", bestLocation.getLatitude());
                ret.put("longitude", bestLocation.getLongitude());
                ret.put("accuracy", (double) bestLocation.getAccuracy());
                ret.put("provider", bestLocation.getProvider());
                call.resolve(ret);
                return;
            }

            final LocationListener listener = new LocationListener() {
                @Override
                public void onLocationChanged(@NonNull Location location) {
                    try {
                        locationManager.removeUpdates(this);
                    } catch (SecurityException ignored) {}
                    JSObject ret = new JSObject();
                    ret.put("latitude", location.getLatitude());
                    ret.put("longitude", location.getLongitude());
                    ret.put("accuracy", (double) location.getAccuracy());
                    ret.put("provider", location.getProvider());
                    call.resolve(ret);
                }

                @Override public void onStatusChanged(String provider, int status, Bundle extras) {}
                @Override public void onProviderEnabled(@NonNull String provider) {}
                @Override public void onProviderDisabled(@NonNull String provider) {}
            };

            Looper looper = Looper.getMainLooper();
            boolean requested = false;
            if (locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                try {
                    locationManager.requestSingleUpdate(LocationManager.GPS_PROVIDER, listener, looper);
                    requested = true;
                } catch (SecurityException ignored) {}
            }
            if (locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                try {
                    locationManager.requestSingleUpdate(LocationManager.NETWORK_PROVIDER, listener, looper);
                    requested = true;
                } catch (SecurityException ignored) {}
            }

            if (!requested) {
                call.reject("LOCATION_DISABLED", "Location services are turned off.");
                return;
            }

            new Handler(looper).postDelayed(() -> {
                try {
                    locationManager.removeUpdates(listener);
                } catch (SecurityException ignored) {}
                call.reject("TIMEOUT", "Location request timed out.");
            }, 7000);

        } catch (Exception e) {
            call.reject("ERROR", e.getMessage());
        }
    }
}
"""

for path in plugin_paths:
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # Replace package/imports
    idx_class = content.find("@CapacitorPlugin(name = \"FloatingOverlay\")")
    if idx_class != -1:
        content_after = content[idx_class:]
        # Remove trailing brace
        r_idx = content_after.rfind("}")
        if r_idx != -1:
            body = content_after[:r_idx]
            new_content = plugin_imports + "\n" + body + "\n" + new_plugin_methods
            with open(path, "w", encoding="utf-8") as f:
                f.write(new_content)
            print(f"Updated {path}")

# 2. Update MainActivity.java
main_paths = [
    r"c:\Users\moham\ILAYANGUDI PROJECT\android\app\src\main\java\com\ilayangudimart\app\MainActivity.java",
    r"c:\Users\moham\ILAYANGUDI PROJECT\APP _ homly\homly-mobile\android\app\src\main\java\com\ilayangudimart\app\MainActivity.java"
]

for path in main_paths:
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # Remove handleCustomExternalUrl method
    h_start = content.find("private boolean handleCustomExternalUrl(String urlStr)")
    if h_start != -1:
        h_end = content.find("private ActivityResultLauncher<String[]> locationPermissionLauncher;", h_start)
        if h_end != -1:
            content = content[:h_start] + content[h_end:]

    # Remove setWebViewClient
    swv_start = content.find("getBridge().setWebViewClient(new BridgeWebViewClient(getBridge())")
    if swv_start != -1:
        swv_end = content.find("});", swv_start)
        if swv_end != -1:
            content = content[:swv_start] + content[swv_end + 3:]

    # Ensure clean bridge setup
    clean_bridge = """        try {
            if (getBridge() != null && getBridge().getWebView() != null) {
                getBridge().getWebView().getSettings().setGeolocationEnabled(true);
            }
        } catch (Throwable ignored) {}"""
    
    # Replace the try block around setGeolocationEnabled
    g_start = content.find("try {\n            if (getBridge() != null")
    if g_start == -1:
        g_start = content.find("try {\r\n            if (getBridge() != null")
    if g_start != -1:
        g_end = content.find("} catch (Exception ignored) {}", g_start)
        if g_end == -1:
            g_end = content.find("} catch (Throwable ignored) {}", g_start)
        if g_end != -1:
            content = content[:g_start] + clean_bridge + content[g_end + 29:]

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Updated {path}")

print("Python updates done.")
