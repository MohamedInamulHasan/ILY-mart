package com.ilayangudimart.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;

import com.capacitorjs.plugins.pushnotifications.MessagingService;
import com.google.firebase.messaging.RemoteMessage;

import org.json.JSONObject;
import java.util.Map;

public class IlyMartMessagingService extends MessagingService {

    private static final String ALERT_CHANNEL_ID = "ily_mart_delivery_high_priority_alert";

    @Override
    public void onMessageReceived(@NonNull RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);

        Map<String, String> data = remoteMessage.getData();
        if (data != null && !data.isEmpty()) {
            String type = data.get("type");
            String status = data.get("status");
            String orderId = data.get("orderId");

            // 1. If order was accepted, delivered, or cancelled: dismiss alert immediately
            if ("DISMISS_ORDER".equalsIgnoreCase(type)
                    || "order_update".equalsIgnoreCase(type)
                    || (status != null && (status.equalsIgnoreCase("accepted")
                    || status.equalsIgnoreCase("out for delivery")
                    || status.equalsIgnoreCase("delivered")
                    || status.equalsIgnoreCase("cancelled")))) {

                handleDismissOrderAlert(orderId);
                return;
            }

            // 2. ONLY show new order alert when type is explicitly "NEW_ORDER"
            if ("NEW_ORDER".equalsIgnoreCase(type)) {
                handleNewOrderAlert(data);
            }
        }
    }

    private void handleDismissOrderAlert(String orderId) {
        try {
            if (FloatingLogoService.instance != null) {
                FloatingLogoService.instance.dismissPorterOrderCard();
                if (orderId != null && !orderId.trim().isEmpty()) {
                    FloatingLogoService.instance.removePendingOrder(orderId.trim());
                }
            }
            if (OrderAlertActivity.currentInstance != null) {
                OrderAlertActivity.currentInstance.dismissAlert();
            }
            NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) {
                nm.cancel(3002);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void handleNewOrderAlert(Map<String, String> data) {
        try {
            // 1. Build order JSON
            String orderJsonStr = data.get("orderJson");
            JSONObject orderObj = null;
            if (orderJsonStr != null && !orderJsonStr.trim().isEmpty()) {
                try {
                    orderObj = new JSONObject(orderJsonStr);
                } catch (Exception ignored) {}
            }
            if (orderObj == null) {
                orderObj = new JSONObject();
                for (Map.Entry<String, String> entry : data.entrySet()) {
                    try {
                        orderObj.put(entry.getKey(), entry.getValue());
                    } catch (Exception ignored) {}
                }
            }

            // 2. CRITICAL STORE OWNER ISOLATION:
            // If the user on this phone is a Store Owner, verify if the order belongs to THEIR store!
            SharedPreferences prefs = getSharedPreferences("ILYMartPrefs", Context.MODE_PRIVATE);
            boolean isStoreSession = prefs.getBoolean("store_session_active", false);
            String myStoreId = prefs.getString("store_id", "");
            String myStoreName = prefs.getString("store_name", "");

            if (isStoreSession && (!myStoreId.isEmpty() || !myStoreName.isEmpty())) {
                if (!FloatingLogoService.isOrderForStore(orderObj, myStoreId, myStoreName)) {
                    // This order belongs to another store! Do NOT alert this store owner!
                    return;
                }
            }

            // 3. Wake up screen
            PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
            if (pm != null) {
                PowerManager.WakeLock wakeLock = pm.newWakeLock(
                        PowerManager.FULL_WAKE_LOCK
                                | PowerManager.ACQUIRE_CAUSES_WAKEUP
                                | PowerManager.ON_AFTER_RELEASE,
                        "ILYMart:IncomingOrderWakeLock"
                );
                wakeLock.acquire(20000);
            }

            // 4. Persist active state in ILYMartPrefs so background service stays alive
            prefs.edit()
                    .putBoolean("floating_enabled", true)
                    .putBoolean("has_pending_orders", true)
                    .apply();

            // 5. Show EXACTLY ONE alert card:
            // If overlay permission is granted -> display FloatingLogoService Porter Card overlay over screen.
            // If overlay permission is NOT granted -> fallback to OrderAlertActivity dialog!
            boolean hasOverlay = (Build.VERSION.SDK_INT < Build.VERSION_CODES.M || android.provider.Settings.canDrawOverlays(this));
            if (hasOverlay) {
                Intent serviceIntent = new Intent(this, FloatingLogoService.class);
                serviceIntent.setAction("SHOW_ORDER_CARD");
                serviceIntent.putExtra("order_json", orderObj.toString());
                try {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        ContextCompat.startForegroundService(this, serviceIntent);
                    } else {
                        startService(serviceIntent);
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                }
            } else {
                try {
                    Intent alertIntent = new Intent(this, OrderAlertActivity.class);
                    alertIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
                    alertIntent.putExtra("order_json", orderObj.toString());
                    alertIntent.putExtra("order_id", data.get("orderId"));
                    startActivity(alertIntent);
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }

            // 6. Post Heads-Up Full Screen Intent Notification with loud alarm sound
            postFullScreenOrderNotification(data, orderObj.toString());

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void postFullScreenOrderNotification(Map<String, String> data, String orderJsonStr) {
        String orderId = data.get("orderId");
        if (orderId == null) orderId = "";
        String shortId = data.containsKey("shortId") ? data.get("shortId") : (orderId.length() >= 6 ? orderId.substring(orderId.length() - 6).toUpperCase() : orderId);
        String total = data.containsKey("total") ? data.get("total") : "";
        String title = "🚨 New Order #" + shortId + (total.isEmpty() ? "" : " (₹" + total + ")");
        String body = data.containsKey("body") ? data.get("body") : "Incoming delivery order! Tap to accept.";

        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;

        Uri alarmSound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
        if (alarmSound == null) {
            alarmSound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    ALERT_CHANNEL_ID,
                    "High Priority Order Alerts",
                    NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Incoming order alerts for delivery boys and store owners");
            channel.enableLights(true);
            channel.setLightColor(Color.RED);
            channel.enableVibration(true);
            channel.setVibrationPattern(new long[]{0, 600, 200, 600, 200, 600});
            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .build();
            channel.setSound(alarmSound, audioAttributes);
            channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            nm.createNotificationChannel(channel);
        }

        Intent fullScreenIntent = new Intent(this, OrderAlertActivity.class);
        fullScreenIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        fullScreenIntent.putExtra("order_json", orderJsonStr);
        fullScreenIntent.putExtra("order_id", orderId);

        PendingIntent fullScreenPendingIntent = PendingIntent.getActivity(
                this,
                (int) System.currentTimeMillis(),
                fullScreenIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, ALERT_CHANNEL_ID)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle(title)
                .setContentText(body)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setFullScreenIntent(fullScreenPendingIntent, true)
                .setContentIntent(fullScreenPendingIntent)
                .setAutoCancel(true)
                .setSound(alarmSound)
                .setVibrate(new long[]{0, 600, 200, 600, 200, 600})
                .setOngoing(false);

        nm.notify(3002, builder.build());
    }
}
