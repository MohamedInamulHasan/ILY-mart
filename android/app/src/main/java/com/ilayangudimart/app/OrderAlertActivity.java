package com.ilayangudimart.app;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.CountDownTimer;
import android.os.Handler;
import android.os.Looper;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.util.DisplayMetrics;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

import org.json.JSONArray;
import org.json.JSONObject;

public class OrderAlertActivity extends AppCompatActivity {

    public static OrderAlertActivity currentInstance;

    private MediaPlayer alertMediaPlayer;
    private Vibrator vibrator;
    private CountDownTimer cardTimer;
    private boolean isFinished = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        currentInstance = this;

        // Turn on screen & show over lock screen
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        } else {
            getWindow().addFlags(
                    WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED
                            | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
                            | WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
            );
        }
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        String orderJsonStr = getIntent().getStringExtra("order_json");
        JSONObject order = null;
        if (orderJsonStr != null && !orderJsonStr.trim().isEmpty()) {
            try {
                order = new JSONObject(orderJsonStr);
            } catch (Exception ignored) {}
        }
        if (order == null) {
            order = new JSONObject();
            Bundle extras = getIntent().getExtras();
            if (extras != null) {
                for (String key : extras.keySet()) {
                    try {
                        order.put(key, extras.get(key));
                    } catch (Exception ignored) {}
                }
            }
        }

        startAlertEffects();
        View cardView = buildOrderCardView(order);

        FrameLayout rootLayout = new FrameLayout(this);
        rootLayout.setBackgroundColor(Color.parseColor("#80000000")); // Dim 50% backdrop
        FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        );
        params.gravity = Gravity.CENTER;
        params.setMargins(dp(16), dp(16), dp(16), dp(16));
        rootLayout.addView(cardView, params);

        setContentView(rootLayout);
    }

    private int dp(int value) {
        return (int) TypedValue.applyDimension(
                TypedValue.COMPLEX_UNIT_DIP,
                value,
                getResources().getDisplayMetrics()
        );
    }

    private void startAlertEffects() {
        try {
            vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
            if (vibrator != null) {
                long[] pattern = {0, 600, 200, 600, 200, 600};
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vibrator.vibrate(VibrationEffect.createWaveform(pattern, 1));
                } else {
                    vibrator.vibrate(pattern, 1);
                }
            }
        } catch (Exception ignored) {}

        try {
            Uri alertSound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
            if (alertSound == null) {
                alertSound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
            }
            if (alertSound != null) {
                alertMediaPlayer = new MediaPlayer();
                alertMediaPlayer.setDataSource(this, alertSound);
                alertMediaPlayer.setAudioAttributes(new AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_ALARM)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build());
                alertMediaPlayer.setLooping(true);
                alertMediaPlayer.prepare();
                alertMediaPlayer.start();
            }
        } catch (Exception ignored) {}
    }

    private synchronized void stopAlertEffects() {
        if (isFinished) return;
        isFinished = true;
        try {
            if (cardTimer != null) {
                cardTimer.cancel();
                cardTimer = null;
            }
        } catch (Exception ignored) {}
        try {
            if (alertMediaPlayer != null) {
                if (alertMediaPlayer.isPlaying()) alertMediaPlayer.stop();
                alertMediaPlayer.release();
                alertMediaPlayer = null;
            }
        } catch (Exception ignored) {}
        try {
            if (vibrator != null) {
                vibrator.cancel();
            }
        } catch (Exception ignored) {}
    }

    @Override
    protected void onDestroy() {
        if (currentInstance == this) currentInstance = null;
        stopAlertEffects();
        super.onDestroy();
    }

    private View buildOrderCardView(JSONObject order) {
        String orderId = order.optString("_id", order.optString("id", order.optString("orderId", "")));
        String shortId = order.optString("shortId", "");
        if (shortId.isEmpty()) {
            shortId = orderId.length() >= 6 ? orderId.substring(orderId.length() - 6).toUpperCase() : orderId;
        }

        JSONObject shippingAddress = order.optJSONObject("shippingAddress");
        String customerName = shippingAddress != null ? shippingAddress.optString("name", "Customer") : "Customer";
        String street = shippingAddress != null ? shippingAddress.optString("street", "") : "";
        String city = shippingAddress != null ? shippingAddress.optString("city", "Ilayangudi") : "Ilayangudi";
        String dropAddress = street.isEmpty() ? city : street + ", " + city;

        JSONArray items = order.optJSONArray("items");
        int itemCount = items != null ? items.length() : 0;
        String pickupStore = "Store Pickup";
        if (items != null && items.length() > 0) {
            JSONObject firstItem = items.optJSONObject(0);
            if (firstItem != null) {
                pickupStore = firstItem.optString("storeName", firstItem.optString("name", "Store Pickup"));
            }
        }

        double totalAmount = order.optDouble("total", order.optDouble("totalAmount", order.optDouble("totalPrice", 0.0)));
        double deliveryCharge = order.optDouble("shipping", order.optDouble("deliveryCharge", 20.0));
        String amountStr = totalAmount > 0 ? "₹" + (int) totalAmount : (deliveryCharge <= 0 ? "FREE" : "₹" + (int) deliveryCharge);

        LinearLayout cardLayout = new LinearLayout(this);
        cardLayout.setOrientation(LinearLayout.VERTICAL);

        GradientDrawable cardBg = new GradientDrawable();
        cardBg.setColor(Color.WHITE);
        cardBg.setCornerRadius(dp(16));
        cardBg.setStroke(dp(1), Color.parseColor("#E5E7EB"));
        cardLayout.setBackground(cardBg);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            cardLayout.setElevation(dp(12));
        }

        // Header Layout: Time & Order ID
        LinearLayout headerLayout = new LinearLayout(this);
        headerLayout.setOrientation(LinearLayout.HORIZONTAL);
        headerLayout.setGravity(Gravity.CENTER_VERTICAL);
        headerLayout.setPadding(dp(18), dp(14), dp(18), dp(12));

        String formattedTime = "";
        try {
            java.text.SimpleDateFormat fallbackFormat = new java.text.SimpleDateFormat("MMM d, h:mm a", java.util.Locale.US);
            formattedTime = fallbackFormat.format(new java.util.Date());
        } catch (Exception ignored) {}

        TextView headerTime = new TextView(this);
        headerTime.setText("🕒 " + formattedTime);
        headerTime.setTextColor(Color.parseColor("#6B7280"));
        headerTime.setTextSize(TypedValue.COMPLEX_UNIT_SP, 14);
        headerTime.setTypeface(Typeface.DEFAULT_BOLD);
        LinearLayout.LayoutParams timeParams = new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f);
        headerLayout.addView(headerTime, timeParams);

        TextView headerId = new TextView(this);
        headerId.setText("#" + shortId);
        headerId.setTextColor(Color.parseColor("#111827"));
        headerId.setTextSize(TypedValue.COMPLEX_UNIT_SP, 15);
        headerId.setTypeface(Typeface.DEFAULT_BOLD);
        headerLayout.addView(headerId);

        cardLayout.addView(headerLayout);

        // Divider
        View headDivider = new View(this);
        headDivider.setBackgroundColor(Color.parseColor("#E5E7EB"));
        LinearLayout.LayoutParams divParams = new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, dp(1));
        divParams.setMargins(dp(18), 0, dp(18), 0);
        cardLayout.addView(headDivider, divParams);

        // Body Content
        LinearLayout bodyLayout = new LinearLayout(this);
        bodyLayout.setOrientation(LinearLayout.VERTICAL);
        bodyLayout.setPadding(dp(18), dp(14), dp(18), dp(18));

        TextView chargeLabel = new TextView(this);
        chargeLabel.setText("NEW ORDER TOTAL");
        chargeLabel.setTextColor(Color.parseColor("#6B7280"));
        chargeLabel.setTextSize(TypedValue.COMPLEX_UNIT_SP, 11);
        chargeLabel.setTypeface(Typeface.DEFAULT_BOLD);
        chargeLabel.setGravity(Gravity.CENTER);
        bodyLayout.addView(chargeLabel);

        TextView amountView = new TextView(this);
        amountView.setText(amountStr);
        amountView.setTextColor(Color.parseColor("#059669"));
        amountView.setTextSize(TypedValue.COMPLEX_UNIT_SP, 28);
        amountView.setTypeface(Typeface.DEFAULT_BOLD);
        amountView.setGravity(Gravity.CENTER);
        amountView.setPadding(0, dp(4), 0, dp(12));
        bodyLayout.addView(amountView);

        // Pickup / Drop row
        LinearLayout locLayout = new LinearLayout(this);
        locLayout.setOrientation(LinearLayout.VERTICAL);
        locLayout.setPadding(dp(12), dp(10), dp(12), dp(10));
        GradientDrawable locBg = new GradientDrawable();
        locBg.setColor(Color.parseColor("#F9FAFB"));
        locBg.setCornerRadius(dp(10));
        locLayout.setBackground(locBg);

        TextView pickupView = new TextView(this);
        pickupView.setText("🏪 " + pickupStore);
        pickupView.setTextColor(Color.parseColor("#1F2937"));
        pickupView.setTextSize(TypedValue.COMPLEX_UNIT_SP, 13);
        pickupView.setTypeface(Typeface.DEFAULT_BOLD);
        locLayout.addView(pickupView);

        TextView dropView = new TextView(this);
        dropView.setText("📍 " + dropAddress);
        dropView.setTextColor(Color.parseColor("#4B5563"));
        dropView.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12);
        dropView.setPadding(0, dp(4), 0, 0);
        locLayout.addView(dropView);

        bodyLayout.addView(locLayout);

        // Swipe Button Track: VIEW ORDER 12s
        final FrameLayout swipeTrack = new FrameLayout(this);
        LinearLayout.LayoutParams trackParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                dp(52)
        );
        trackParams.setMargins(0, dp(16), 0, dp(4));
        swipeTrack.setLayoutParams(trackParams);

        GradientDrawable trackBg = new GradientDrawable();
        trackBg.setColors(new int[]{Color.parseColor("#059669"), Color.parseColor("#10B981")});
        trackBg.setOrientation(GradientDrawable.Orientation.LEFT_RIGHT);
        trackBg.setCornerRadius(dp(26));
        swipeTrack.setBackground(trackBg);

        final TextView swipeLabel = new TextView(this);
        swipeLabel.setText("VIEW ORDER  12s");
        swipeLabel.setTextColor(Color.WHITE);
        swipeLabel.setTextSize(TypedValue.COMPLEX_UNIT_SP, 15);
        swipeLabel.setTypeface(Typeface.DEFAULT_BOLD);
        swipeLabel.setGravity(Gravity.CENTER);
        swipeTrack.addView(swipeLabel, new FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));

        // Swipe Knob
        final FrameLayout swipeKnob = new FrameLayout(this);
        int knobSize = dp(42);
        FrameLayout.LayoutParams knobParams = new FrameLayout.LayoutParams(knobSize, knobSize);
        knobParams.gravity = Gravity.CENTER_VERTICAL | Gravity.START;
        knobParams.setMargins(dp(5), 0, 0, 0);
        swipeKnob.setLayoutParams(knobParams);

        GradientDrawable knobBg = new GradientDrawable();
        knobBg.setColor(Color.WHITE);
        knobBg.setCornerRadius(dp(21));
        swipeKnob.setBackground(knobBg);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            swipeKnob.setElevation(dp(4));
        }

        TextView knobArrow = new TextView(this);
        knobArrow.setText("➔");
        knobArrow.setTextColor(Color.parseColor("#059669"));
        knobArrow.setTextSize(TypedValue.COMPLEX_UNIT_SP, 16);
        knobArrow.setTypeface(Typeface.DEFAULT_BOLD);
        knobArrow.setGravity(Gravity.CENTER);
        swipeKnob.addView(knobArrow, new FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));

        swipeTrack.addView(swipeKnob);

        // Countdown timer for 12 seconds
        cardTimer = new CountDownTimer(12000, 1000) {
            @Override
            public void onTick(long millisUntilFinished) {
                int sec = (int) Math.ceil(millisUntilFinished / 1000.0);
                swipeLabel.setText("VIEW ORDER  " + sec + "s");
            }

            @Override
            public void onFinish() {
                // Keep repeating until viewed or explicitly skipped!
                start();
            }
        }.start();

        final String finalOrderId = orderId;
        View.OnClickListener openOrderClick = v -> {
            isFinished = true; // User viewed/accepted order: stop repeating!
            stopAlertEffects();
            SharedPreferences prefs = getSharedPreferences("ILYMartPrefs", Context.MODE_PRIVATE);
            boolean isStore = prefs.getBoolean("store_session_active", false);
            Intent intent = new Intent(OrderAlertActivity.this, MainActivity.class);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            intent.putExtra("open_incoming_order", true);
            intent.putExtra("order_id", finalOrderId);
            intent.putExtra("open_panel_from_floating", true);
            intent.putExtra("target_panel", isStore ? "/my-store" : "/delivery-dashboard");
            startActivity(intent);
            finish();
        };

        swipeTrack.setOnClickListener(openOrderClick);
        bodyLayout.addView(swipeTrack);

        // SKIP Button: Pauses for 5s then repeats alert until accepted or cancelled!
        TextView skipBtn = new TextView(this);
        skipBtn.setText("SKIP");
        skipBtn.setTextColor(Color.parseColor("#9CA3AF"));
        skipBtn.setTextSize(TypedValue.COMPLEX_UNIT_SP, 13);
        skipBtn.setTypeface(Typeface.DEFAULT_BOLD);
        skipBtn.setGravity(Gravity.CENTER);
        skipBtn.setPadding(dp(8), dp(12), dp(8), dp(4));
        skipBtn.setOnClickListener(v -> skipAndRepeat(order));
        bodyLayout.addView(skipBtn);

        cardLayout.addView(bodyLayout);
        return cardLayout;
    }

    private void skipAndRepeat(JSONObject order) {
        stopAlertEffects();
        finish();

        // Repeat alert after 5s pause until order is accepted or cancelled
        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            try {
                if (isFinished) return;
                Intent repeatIntent = new Intent(getApplicationContext(), OrderAlertActivity.class);
                repeatIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                repeatIntent.putExtra("order_json", order != null ? order.toString() : "");
                startActivity(repeatIntent);
            } catch (Exception ignored) {}
        }, 5000);
    }

    public void dismissAlert() {
        isFinished = true;
        stopAlertEffects();
        finish();
    }
}
