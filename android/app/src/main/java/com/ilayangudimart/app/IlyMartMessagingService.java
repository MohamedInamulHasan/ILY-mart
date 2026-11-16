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
            String orderId = data.get("orderId");
            if ("NEW_ORDER".equalsIgnoreCase(type) || (orderId != null && !orderId.trim().isEmpty())) {
                handleNewOrderAlert(data);
            }
        }
    }

    private void handleNewOrderAlert(Map<String, String> data) {
        try {
            // 1. Wake up screen
            PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
            if (pm != null) {
                PowerManager.WakeLock wakeLock = pm.newWakeLock(
                        PowerManager.FULL_WAKE_LOCK
                                | PowerManager.ACQUIRE_CAUSES_WAKEUP
                                | PowerManager.ON_AFTER_RELEASE,
                        "ILYMart:IncomingOrderWakeLock"
                );
                wakeLock.acquire(15000);
            }

            // 2. Persist active state in ILYMartPrefs so background service stays alive
            SharedPreferences prefs = getSharedPreferences("ILYMartPrefs", Context.MODE_PRIVATE);
            prefs.edit()
                    .putBoolean("floating_enabled", true)
                    .putBoolean("delivery_session_active", true)
                    .putBoolean("store_session_active", true)
                    .putBoolean("has_pending_orders", true)
                    .apply();

            // 3. Build order JSON
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

            // 4. Trigger FloatingLogoService to show Porter card overlay & ring continuous alarm
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

            // 5. Post Heads-Up Full Screen Intent Notification with loud alarm sound
            postFullScreenOrderNotification(data);

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void postFullScreenOrderNotification(Map<String, String> data) {
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

        Intent fullScreenIntent = new Intent(this, MainActivity.class);
        fullScreenIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        fullScreenIntent.putExtra("open_incoming_order", true);
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
