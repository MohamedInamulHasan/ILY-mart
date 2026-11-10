package com.ilayangudimart.app;

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

@CapacitorPlugin(name = "FloatingOverlay")
public class FloatingOverlayPlugin extends Plugin {

    @PluginMethod
    public void checkPermission(PluginCall call) {
        boolean granted = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            granted = Settings.canDrawOverlays(getContext());
        }
        JSObject ret = new JSObject();
        ret.put("granted", granted);
        call.resolve(ret);
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        boolean granted = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (!Settings.canDrawOverlays(getContext())) {
                granted = false;
                Intent intent = new Intent(
                        Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                        Uri.parse("package:" + getContext().getPackageName())
                );
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(intent);
            }
        }
        JSObject ret = new JSObject();
        ret.put("granted", granted);
        call.resolve(ret);
    }

    @PluginMethod
    public void setAuthToken(PluginCall call) {
        String token = call.getString("token", "");
        if (token != null) {
            SharedPreferences prefs = getContext().getSharedPreferences("ILYMartPrefs", Context.MODE_PRIVATE);
            prefs.edit().putString("authToken", token).apply();
        }
        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void show(PluginCall call) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                if (!Settings.canDrawOverlays(getContext())) {
                    call.reject("OVERLAY_PERMISSION_DENIED");
                    return;
                }
            }

            SharedPreferences prefs = getContext().getSharedPreferences("ILYMartPrefs", Context.MODE_PRIVATE);
            prefs.edit().putBoolean("floating_enabled", true).apply();

            // Save token if provided
            String token = call.getString("token");
            if (token != null && !token.isEmpty()) {
                prefs.edit().putString("authToken", token).apply();
            }

            Intent intent = new Intent(getContext(), FloatingLogoService.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                getContext().startForegroundService(intent);
            } else {
                getContext().startService(intent);
            }
            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("FAILED_TO_START_OVERLAY", e.getMessage());
        }
    }

    @PluginMethod
    public void hide(PluginCall call) {
        try {
            SharedPreferences prefs = getContext().getSharedPreferences("ILYMartPrefs", Context.MODE_PRIVATE);
            prefs.edit().putBoolean("floating_enabled", false).apply();

            if (FloatingLogoService.instance != null) {
                FloatingLogoService.instance.stopServiceAndHide();
            }
            try {
                Intent stopIntent = new Intent(getContext(), FloatingLogoService.class);
                stopIntent.setAction("STOP_SERVICE");
                getContext().stopService(stopIntent);
            } catch (Exception ignored) {}

            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("FAILED_TO_HIDE_OVERLAY", e.getMessage());
        }
    }

    @PluginMethod
    public void setDeliverySessionActive(PluginCall call) {
        boolean active = call.getBoolean("active", false);
        SharedPreferences prefs = getContext().getSharedPreferences("ILYMartPrefs", Context.MODE_PRIVATE);
        prefs.edit().putBoolean("delivery_session_active", active).apply();
        if (!active) {
            prefs.edit().putBoolean("floating_enabled", false).apply();
            if (FloatingLogoService.instance != null) {
                FloatingLogoService.instance.stopServiceAndHide();
            }
            try {
                Intent stopIntent = new Intent(getContext(), FloatingLogoService.class);
                stopIntent.setAction("STOP_SERVICE");
                getContext().stopService(stopIntent);
            } catch (Exception ignored) {}
        }
        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void isRunning(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("running", FloatingLogoService.isRunning);
        call.resolve(ret);
    }

    @PluginMethod
    public void showPorterOrderCard(PluginCall call) {
        try {
            JSObject orderData = call.getObject("order");
            if (orderData != null) {
                FloatingLogoService.triggerCardFromJS(new JSONObject(orderData.toString()));
            }
            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("FAILED_SHOW_CARD", e.getMessage());
        }
    }

    @PluginMethod
    public void dismissPorterOrderCard(PluginCall call) {
        FloatingLogoService.dismissCardFromJS();
        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void triggerIncomingAlert(PluginCall call) {
        try {
            if (FloatingLogoService.isAppInForeground) {
                // App is already in foreground; do not call startActivity or interrupt window
                JSObject ret = new JSObject();
                ret.put("success", true);
                call.resolve(ret);
                return;
            }
            Context context = getContext();
            Intent intent = new Intent(context, MainActivity.class);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK
                    | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
                    | Intent.FLAG_ACTIVITY_SINGLE_TOP);

            try {
                PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
                if (pm != null) {
                    PowerManager.WakeLock wakeLock = pm.newWakeLock(
                            PowerManager.SCREEN_BRIGHT_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP,
                            "ILYMart:IncomingAlert"
                    );
                    wakeLock.acquire(10000);
                }
            } catch (Exception ignored) {}

            context.startActivity(intent);

            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("FAILED_ALERT", e.getMessage());
        }
    }

    @PluginMethod
    public void setOrdersState(PluginCall call) {
        boolean hasActive = call.getBoolean("hasActive", false);
        boolean hasPending = call.getBoolean("hasPending", false);
        SharedPreferences prefs = getContext().getSharedPreferences("ILYMartPrefs", Context.MODE_PRIVATE);
        prefs.edit()
                .putBoolean("has_active_orders", hasActive)
                .putBoolean("has_pending_orders", hasPending)
                .apply();
        if (FloatingLogoService.instance != null) {
            FloatingLogoService.instance.updateOrdersState(hasActive, hasPending);
        }
        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void setHasAcceptedOrder(PluginCall call) {
        boolean hasAcceptedOrder = call.getBoolean("hasAcceptedOrder", false);
        SharedPreferences prefs = getContext().getSharedPreferences("ILYMartPrefs", Context.MODE_PRIVATE);
        prefs.edit().putBoolean("has_active_orders", hasAcceptedOrder).apply();
        if (FloatingLogoService.instance != null) {
            boolean hasPending = prefs.getBoolean("has_pending_orders", false);
            FloatingLogoService.instance.updateOrdersState(hasAcceptedOrder, hasPending);
        }
        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }



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
