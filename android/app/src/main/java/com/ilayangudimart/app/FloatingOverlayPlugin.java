package com.ilayangudimart.app;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONObject;

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

            Intent intent = new Intent(getContext(), FloatingLogoService.class);
            getContext().stopService(intent);
            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("FAILED_TO_STOP_OVERLAY", e.getMessage());
        }
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
}
