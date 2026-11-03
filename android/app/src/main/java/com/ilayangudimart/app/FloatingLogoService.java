package com.ilayangudimart.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ServiceInfo;
import android.graphics.Color;
import android.graphics.Outline;
import android.graphics.PixelFormat;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.CountDownTimer;
import java.util.ArrayList;
import java.util.List;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.os.Vibrator;
import android.os.VibrationEffect;
import android.provider.Settings;
import android.util.DisplayMetrics;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewOutlineProvider;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;
import androidx.core.app.NotificationCompat;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

public class FloatingLogoService extends Service {
    public static FloatingLogoService instance;
    public static boolean isRunning = false;
    public static boolean isAppInForeground = false;

    private WindowManager windowManager;
    private FrameLayout floatingCircleView;
    private WindowManager.LayoutParams circleParams;

    private View orderCardView;
    private WindowManager.LayoutParams cardParams;

    private int screenWidth;
    private int screenHeight;

    private MediaPlayer alertMediaPlayer;
    private Vibrator vibrator;
    private ScheduledExecutorService pollingExecutor;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private final Set<String> alertedOrderIds = new HashSet<>();
    private CountDownTimer orderCardTimer = null;
    private final List<JSONObject> pendingOrdersQueue = new ArrayList<>();
    private int currentPendingOrderIndex = 0;
    private boolean isGapWaiting = false;

    private static final String ORDERS_API_URL = "https://homly-backend-aash.onrender.com/api/orders";
    private static final String NOTIFICATION_CHANNEL_ID = "ily_mart_delivery_partner_overlay";
    private static final String ALERT_CHANNEL_ID = "ily_mart_delivery_high_priority_alert";

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        instance = this;
        isRunning = true;

        windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);
        vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);

        DisplayMetrics metrics = new DisplayMetrics();
        windowManager.getDefaultDisplay().getMetrics(metrics);
        screenWidth = metrics.widthPixels;
        screenHeight = metrics.heightPixels;

        startForegroundNotification();
        createFloatingCircleView();
        startOrderPolling();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            String action = intent.getAction();
            if ("SHOW_ORDER_CARD".equals(action)) {
                String orderJsonStr = intent.getStringExtra("order_json");
                if (orderJsonStr != null) {
                    try {
                        JSONObject orderObj = new JSONObject(orderJsonStr);
                        mainHandler.post(() -> showPorterOrderCard(orderObj));
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
            } else if ("DISMISS_CARD".equals(action)) {
                mainHandler.post(this::dismissPorterOrderCard);
            }
        }
        return START_STICKY;
    }

    public static void setAppForegroundState(boolean inForeground) {
        isAppInForeground = inForeground;
        if (instance != null) {
            instance.mainHandler.post(() -> {
                if (inForeground) {
                    // App is open: hide floating circle and any lingering overlay card
                    instance.hideCircleBubble();
                    instance.dismissPorterOrderCard();
                } else {
                    // App minimized/closed: restore floating circle bubble
                    if (instance.orderCardView == null) {
                        instance.showCircleBubble();
                    }
                }
            });
        }
    }

    public static void triggerCardFromJS(JSONObject orderJson) {
        if (instance != null && !isAppInForeground) {
            instance.mainHandler.post(() -> instance.showPorterOrderCard(orderJson));
        }
    }

    public static void dismissCardFromJS() {
        if (instance != null) {
            instance.mainHandler.post(instance::dismissPorterOrderCard);
        }
    }

    private int dp(int value) {
        return (int) TypedValue.applyDimension(
                TypedValue.COMPLEX_UNIT_DIP,
                value,
                getResources().getDisplayMetrics()
        );
    }

    /**
     * 1. Draggable Circular Floating Logo
     */
    private void createFloatingCircleView() {
        floatingCircleView = new FrameLayout(this);
        int sizeInPx = dp(65);

        ImageView logoImage = new ImageView(this);
        logoImage.setImageResource(R.drawable.floating_logo);
        logoImage.setScaleType(ImageView.ScaleType.CENTER_CROP);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            logoImage.setClipToOutline(true);
            logoImage.setOutlineProvider(new ViewOutlineProvider() {
                @Override
                public void getOutline(View view, Outline outline) {
                    outline.setOval(0, 0, view.getWidth(), view.getHeight());
                }
            });
            floatingCircleView.setElevation(dp(8));
        }

        FrameLayout.LayoutParams imgParams = new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
        );
        floatingCircleView.addView(logoImage, imgParams);

        // Green border ring overlay
        View borderRing = new View(this);
        borderRing.setBackgroundResource(R.drawable.floating_circle_border);
        floatingCircleView.addView(borderRing, imgParams);

        int layoutType = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                : WindowManager.LayoutParams.TYPE_PHONE;

        circleParams = new WindowManager.LayoutParams(
                sizeInPx,
                sizeInPx,
                layoutType,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
                        | WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
                PixelFormat.TRANSLUCENT
        );

        circleParams.gravity = Gravity.TOP | Gravity.START;
        circleParams.x = screenWidth - sizeInPx - dp(10);
        circleParams.y = screenHeight / 3;

        floatingCircleView.setOnTouchListener(new View.OnTouchListener() {
            private int initialX;
            private int initialY;
            private float initialTouchX;
            private float initialTouchY;
            private long touchStartTime;

            @Override
            public boolean onTouch(View v, MotionEvent event) {
                switch (event.getAction()) {
                    case MotionEvent.ACTION_DOWN:
                        touchStartTime = System.currentTimeMillis();
                        initialX = circleParams.x;
                        initialY = circleParams.y;
                        initialTouchX = event.getRawX();
                        initialTouchY = event.getRawY();
                        return true;

                    case MotionEvent.ACTION_MOVE:
                        circleParams.x = initialX + (int) (event.getRawX() - initialTouchX);
                        circleParams.y = initialY + (int) (event.getRawY() - initialTouchY);
                        if (floatingCircleView != null && windowManager != null) {
                            windowManager.updateViewLayout(floatingCircleView, circleParams);
                        }
                        return true;

                    case MotionEvent.ACTION_UP:
                        long duration = System.currentTimeMillis() - touchStartTime;
                        float diffX = Math.abs(event.getRawX() - initialTouchX);
                        float diffY = Math.abs(event.getRawY() - initialTouchY);

                        if (duration < 250 && diffX < 15 && diffY < 15) {
                            openApp(null);
                        } else {
                            // Snap to nearest screen edge
                            int targetX = (circleParams.x + (v.getWidth() / 2) < screenWidth / 2) ? dp(5) : (screenWidth - v.getWidth() - dp(5));
                            circleParams.x = targetX;
                            if (floatingCircleView != null && windowManager != null) {
                                windowManager.updateViewLayout(floatingCircleView, circleParams);
                            }
                        }
                        return true;
                }
                return false;
            }
        });

        // Add to windowManager only if app is not in foreground, enabled, and permitted
        SharedPreferences prefs = getSharedPreferences("ILYMartPrefs", Context.MODE_PRIVATE);
        boolean enabled = prefs.getBoolean("floating_enabled", true);
        boolean canDraw = Build.VERSION.SDK_INT < Build.VERSION_CODES.M || android.provider.Settings.canDrawOverlays(this);

        if (!isAppInForeground && enabled && canDraw) {
            try {
                windowManager.addView(floatingCircleView, circleParams);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    private void hideCircleBubble() {
        if (floatingCircleView != null && floatingCircleView.isAttachedToWindow()) {
            try {
                windowManager.removeView(floatingCircleView);
            } catch (Exception ignored) {}
        }
    }

    private void showCircleBubble() {
        SharedPreferences prefs = getSharedPreferences("ILYMartPrefs", Context.MODE_PRIVATE);
        boolean enabled = prefs.getBoolean("floating_enabled", true);
        if (!enabled) return;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !android.provider.Settings.canDrawOverlays(this)) {
            return;
        }

        if (floatingCircleView != null && !floatingCircleView.isAttachedToWindow()) {
            try {
                windowManager.addView(floatingCircleView, circleParams);
            } catch (Exception ignored) {}
        }
    }

    /**
     * 2. Porter Partner Style Floating Incoming Order Card
     */
    public synchronized void showPorterOrderCard(JSONObject order) {
        if (order == null || isAppInForeground) return;

        // Wake screen up
        wakeUpScreen();

        // Start ringing alert sound & vibration
        startAlertEffects();

        // If circle is visible, remove it while order card is shown
        hideCircleBubble();

        // Remove old order card if exists
        dismissPorterOrderCardInternal();

        try {
            String orderId = order.optString("_id", order.optString("id", ""));
            String shortId = orderId.length() >= 6 ? orderId.substring(orderId.length() - 6).toUpperCase() : orderId;

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

            double deliveryCharge = order.optDouble("shipping", order.optDouble("deliveryCharge", 20.0));
            String deliveryChargeStr = deliveryCharge <= 0 ? "FREE" : "₹" + (int) deliveryCharge;

            // --- BUILD THE CARD VIEW PROGRAMMATICALLY (EXACT SAME AS IN-APP CARD) ---
            LinearLayout cardLayout = new LinearLayout(this);
            cardLayout.setOrientation(LinearLayout.VERTICAL);

            // Card background: Rounded White Card with elevation
            GradientDrawable cardBg = new GradientDrawable();
            cardBg.setColor(Color.WHITE);
            cardBg.setCornerRadius(dp(24));
            cardBg.setStroke(dp(1), Color.parseColor("#E5E7EB"));
            cardLayout.setBackground(cardBg);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                cardLayout.setElevation(dp(28));
            }

            // Top Header: Pure white background with Time & ID on left, X on right
            LinearLayout headerLayout = new LinearLayout(this);
            headerLayout.setOrientation(LinearLayout.HORIZONTAL);
            headerLayout.setGravity(Gravity.CENTER_VERTICAL);
            headerLayout.setPadding(dp(18), dp(14), dp(18), dp(10));

            GradientDrawable headerBg = new GradientDrawable();
            headerBg.setColor(Color.WHITE);
            float r = dp(24);
            headerBg.setCornerRadii(new float[]{r, r, r, r, 0, 0, 0, 0});
            headerLayout.setBackground(headerBg);

            // Format order time (e.g. Nov 3, 1.09 AM)
            String formattedTime = "";
            try {
                String rawDate = order.optString("createdAt", order.optString("date", ""));
                if (!rawDate.isEmpty()) {
                    java.text.SimpleDateFormat isoFormat = new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", java.util.Locale.US);
                    isoFormat.setTimeZone(java.util.TimeZone.getTimeZone("UTC"));
                    java.util.Date parsed = isoFormat.parse(rawDate);
                    if (parsed != null) {
                        java.text.SimpleDateFormat bannerFormat = new java.text.SimpleDateFormat("MMM d, h.mm a", java.util.Locale.US);
                        bannerFormat.setTimeZone(java.util.TimeZone.getDefault());
                        formattedTime = bannerFormat.format(parsed);
                    }
                }
            } catch (Exception ignored) {}
            if (formattedTime.isEmpty()) {
                java.text.SimpleDateFormat fallbackFormat = new java.text.SimpleDateFormat("MMM d, h.mm a", java.util.Locale.US);
                formattedTime = fallbackFormat.format(new java.util.Date());
            }

            // Left: Time with Clock Icon (same font-bold thickness and grey color)
            TextView headerTime = new TextView(this);
            headerTime.setText("🕒 " + formattedTime);
            headerTime.setTextColor(Color.parseColor("#6B7280"));
            headerTime.setTextSize(TypedValue.COMPLEX_UNIT_SP, 14);
            headerTime.setTypeface(Typeface.DEFAULT_BOLD);
            LinearLayout.LayoutParams timeParams = new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f);
            headerLayout.addView(headerTime, timeParams);

            // Right: #Order ID (same font-bold thickness and grey color, no X icon)
            TextView headerId = new TextView(this);
            headerId.setText("#" + shortId);
            headerId.setTextColor(Color.parseColor("#6B7280"));
            headerId.setTextSize(TypedValue.COMPLEX_UNIT_SP, 14);
            headerId.setTypeface(Typeface.DEFAULT_BOLD);
            headerLayout.addView(headerId);

            cardLayout.addView(headerLayout);

            // Thin horizontal light grey divider line below order ID and time
            View headDivider = new View(this);
            GradientDrawable lineBg = new GradientDrawable();
            lineBg.setColor(Color.parseColor("#E5E7EB"));
            headDivider.setBackground(lineBg);
            LinearLayout.LayoutParams divParams = new LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    dp(1)
            );
            divParams.setMargins(dp(18), 0, dp(18), 0);
            cardLayout.addView(headDivider, divParams);

            // Content Container
            LinearLayout bodyLayout = new LinearLayout(this);
            bodyLayout.setOrientation(LinearLayout.VERTICAL);
            bodyLayout.setPadding(dp(18), dp(14), dp(18), dp(18));

            // Delivery Charge Header in Center Thick
            TextView chargeLabel = new TextView(this);
            chargeLabel.setText("DELIVERY CHARGE");
            chargeLabel.setTextColor(Color.parseColor("#000000"));
            chargeLabel.setTextSize(TypedValue.COMPLEX_UNIT_SP, 11);
            chargeLabel.setTypeface(Typeface.DEFAULT_BOLD);
            chargeLabel.setGravity(Gravity.CENTER);
            bodyLayout.addView(chargeLabel);

            TextView chargeAmount = new TextView(this);
            chargeAmount.setText(deliveryChargeStr);
            chargeAmount.setTextColor(Color.parseColor("#000000"));
            chargeAmount.setTextSize(TypedValue.COMPLEX_UNIT_SP, 38);
            chargeAmount.setTypeface(Typeface.DEFAULT_BOLD);
            chargeAmount.setGravity(Gravity.CENTER);
            bodyLayout.addView(chargeAmount);

            // Thin divider below charge
            View chargeDiv = new View(this);
            chargeDiv.setBackgroundColor(Color.parseColor("#F3F4F6"));
            LinearLayout.LayoutParams cDivParams = new LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    dp(1)
            );
            cDivParams.setMargins(dp(10), dp(4), dp(10), dp(10));
            bodyLayout.addView(chargeDiv, cDivParams);

            // Route Timeline: Green dot before Name -> Grey line -> Green dot before Time
            LinearLayout routeRow = new LinearLayout(this);
            routeRow.setOrientation(LinearLayout.HORIZONTAL);
            routeRow.setGravity(Gravity.TOP);
            LinearLayout.LayoutParams routeRowParams = new LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
            );
            routeRowParams.setMargins(0, dp(4), 0, dp(14));
            routeRow.setLayoutParams(routeRowParams);

            // Timeline dots column
            LinearLayout dotsCol = new LinearLayout(this);
            dotsCol.setOrientation(LinearLayout.VERTICAL);
            dotsCol.setGravity(Gravity.CENTER_HORIZONTAL);
            dotsCol.setLayoutParams(new LinearLayout.LayoutParams(dp(16), LinearLayout.LayoutParams.MATCH_PARENT));

            // Top green dot
            View topDot = new View(this);
            GradientDrawable topDotBg = new GradientDrawable();
            topDotBg.setShape(GradientDrawable.OVAL);
            topDotBg.setColor(Color.parseColor("#10B981"));
            topDot.setBackground(topDotBg);
            LinearLayout.LayoutParams dotParams = new LinearLayout.LayoutParams(dp(10), dp(10));
            dotParams.setMargins(0, dp(4), 0, 0);
            topDot.setLayoutParams(dotParams);
            dotsCol.addView(topDot);

            // Connecting vertical line
            View vLine = new View(this);
            vLine.setBackgroundColor(Color.parseColor("#D1D5DB"));
            LinearLayout.LayoutParams lineParams = new LinearLayout.LayoutParams(dp(2), 0, 1f);
            lineParams.setMargins(0, dp(2), 0, dp(2));
            vLine.setLayoutParams(lineParams);
            dotsCol.addView(vLine);

            // Bottom green dot
            View bottomDot = new View(this);
            GradientDrawable bottomDotBg = new GradientDrawable();
            bottomDotBg.setShape(GradientDrawable.OVAL);
            bottomDotBg.setColor(Color.parseColor("#10B981"));
            bottomDot.setBackground(bottomDotBg);
            LinearLayout.LayoutParams bottomDotParams = new LinearLayout.LayoutParams(dp(10), dp(10));
            bottomDotParams.setMargins(0, 0, 0, dp(4));
            bottomDot.setLayoutParams(bottomDotParams);
            dotsCol.addView(bottomDot);

            routeRow.addView(dotsCol);

            // Details column
            LinearLayout detailsCol = new LinearLayout(this);
            detailsCol.setOrientation(LinearLayout.VERTICAL);
            LinearLayout.LayoutParams detailsParams = new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f);
            detailsParams.setMargins(dp(10), 0, 0, 0);
            detailsCol.setLayoutParams(detailsParams);

            // 1. Customer Name (bold black matching app)
            TextView nameView = new TextView(this);
            nameView.setText(customerName);
            nameView.setTextColor(Color.parseColor("#111827"));
            nameView.setTextSize(TypedValue.COMPLEX_UNIT_SP, 15);
            nameView.setTypeface(Typeface.DEFAULT_BOLD);
            detailsCol.addView(nameView);

            // 2. Street (address grey)
            if (!street.isEmpty()) {
                TextView streetView = new TextView(this);
                streetView.setText(street);
                streetView.setTextColor(Color.parseColor("#6B7280"));
                streetView.setTextSize(TypedValue.COMPLEX_UNIT_SP, 13);
                detailsCol.addView(streetView);
            }

            // 3. City (address grey)
            if (!city.isEmpty()) {
                TextView cityView = new TextView(this);
                cityView.setText(city);
                cityView.setTextColor(Color.parseColor("#6B7280"));
                cityView.setTextSize(TypedValue.COMPLEX_UNIT_SP, 13);
                detailsCol.addView(cityView);
            }

            // 4. Items count
            if (itemCount > 0) {
                TextView itemsView = new TextView(this);
                itemsView.setText("📦  " + itemCount + (itemCount == 1 ? " item" : " items"));
                itemsView.setTextColor(Color.parseColor("#6B7280"));
                itemsView.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12);
                itemsView.setTypeface(Typeface.DEFAULT_BOLD);
                LinearLayout.LayoutParams itemsParams = new LinearLayout.LayoutParams(
                        LinearLayout.LayoutParams.WRAP_CONTENT,
                        LinearLayout.LayoutParams.WRAP_CONTENT
                );
                itemsParams.setMargins(0, dp(2), 0, 0);
                itemsView.setLayoutParams(itemsParams);
                detailsCol.addView(itemsView);
            }

            // 5. Scheduled Delivery Label (address grey)
            TextView schedLabel = new TextView(this);
            schedLabel.setText("Scheduled Delivery");
            schedLabel.setTextColor(Color.parseColor("#6B7280"));
            schedLabel.setTextSize(TypedValue.COMPLEX_UNIT_SP, 13);
            LinearLayout.LayoutParams schedLabelParams = new LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.WRAP_CONTENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
            );
            schedLabelParams.setMargins(0, dp(10), 0, 0);
            schedLabel.setLayoutParams(schedLabelParams);
            detailsCol.addView(schedLabel);

            // 6. Time Slot (bold black matching name - formatted range like '6 PM - 7 PM')
            String rawScheduledTime = order.optString("scheduledDeliveryTime", order.optString("deliveryTime", ""));
            if (shippingAddress != null && rawScheduledTime.isEmpty()) {
                rawScheduledTime = shippingAddress.optString("deliveryTime", "");
            }
            String scheduledTime = formatDeliveryRange(rawScheduledTime);
            TextView schedTimeView = new TextView(this);
            schedTimeView.setText(scheduledTime);
            schedTimeView.setTextColor(Color.parseColor("#111827"));
            schedTimeView.setTextSize(TypedValue.COMPLEX_UNIT_SP, 15);
            schedTimeView.setTypeface(Typeface.DEFAULT_BOLD);
            detailsCol.addView(schedTimeView);

            routeRow.addView(detailsCol);
            bodyLayout.addView(routeRow);

            // VIEW ORDER Button with 8s countdown timer (like Porter app)
            Button acceptBtn = new Button(this);
            acceptBtn.setText("VIEW ORDER  ➔  8s");
            acceptBtn.setTextColor(Color.WHITE);
            acceptBtn.setTextSize(TypedValue.COMPLEX_UNIT_SP, 15);
            acceptBtn.setTypeface(Typeface.DEFAULT_BOLD);
            GradientDrawable btnBg = new GradientDrawable();
            btnBg.setColor(Color.parseColor("#F59E0B")); // Amber 500
            btnBg.setCornerRadius(dp(26));
            acceptBtn.setBackground(btnBg);
            acceptBtn.setPadding(dp(16), dp(12), dp(16), dp(12));

            if (orderCardTimer != null) {
                orderCardTimer.cancel();
                orderCardTimer = null;
            }
            orderCardTimer = new CountDownTimer(8000, 1000) {
                @Override
                public void onTick(long millisUntilFinished) {
                    int sec = (int) Math.ceil(millisUntilFinished / 1000.0);
                    acceptBtn.setText("VIEW ORDER  ➔  " + sec + "s");
                }

                @Override
                public void onFinish() {
                    skipPorterOrderCard();
                }
            }.start();

            acceptBtn.setOnClickListener(v -> {
                if (orderCardTimer != null) {
                    orderCardTimer.cancel();
                    orderCardTimer = null;
                }
                stopAlertEffects();
                dismissPorterOrderCardInternal();
                openApp(orderId);
            });

            bodyLayout.addView(acceptBtn);

            // SKIP Button below VIEW ORDER (like Porter app)
            TextView skipBtn = new TextView(this);
            skipBtn.setText("SKIP");
            skipBtn.setTextColor(Color.parseColor("#9CA3AF"));
            skipBtn.setTextSize(TypedValue.COMPLEX_UNIT_SP, 13);
            skipBtn.setTypeface(Typeface.DEFAULT_BOLD);
            skipBtn.setGravity(Gravity.CENTER);
            skipBtn.setPadding(dp(8), dp(10), dp(8), dp(4));
            skipBtn.setOnClickListener(v -> skipPorterOrderCard());
            bodyLayout.addView(skipBtn);
            cardLayout.addView(bodyLayout);

            orderCardView = cardLayout;

            int layoutType = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                    ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                    : WindowManager.LayoutParams.TYPE_PHONE;

            cardParams = new WindowManager.LayoutParams(
                    screenWidth - dp(32),
                    WindowManager.LayoutParams.WRAP_CONTENT,
                    layoutType,
                    WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL
                            | WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED
                            | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
                            | WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON,
                    PixelFormat.TRANSLUCENT
            );
            cardParams.gravity = Gravity.TOP | Gravity.CENTER_HORIZONTAL;
            cardParams.y = dp(50);

            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M || android.provider.Settings.canDrawOverlays(this)) {
                try {
                    windowManager.addView(orderCardView, cardParams);
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }

            // Also post Heads-Up Notification
            postHighPriorityOrderNotification(shortId, deliveryChargeStr, pickupStore, dropAddress, orderId);

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public synchronized void skipPorterOrderCard() {
        if (orderCardTimer != null) {
            orderCardTimer.cancel();
            orderCardTimer = null;
        }
        stopAlertEffects();
        dismissPorterOrderCardInternal();
        if (!isAppInForeground) {
            showCircleBubble();
        }
        // 5s gap before showing the next pending processing order
        isGapWaiting = true;
        mainHandler.postDelayed(() -> {
            isGapWaiting = false;
            currentPendingOrderIndex++;
            showNextPendingOrderIfAny();
        }, 5000);
    }

    public synchronized void showNextPendingOrderIfAny() {
        if (isAppInForeground || orderCardView != null || isGapWaiting) return;
        synchronized (pendingOrdersQueue) {
            if (pendingOrdersQueue.isEmpty()) return;
            int idx = currentPendingOrderIndex % pendingOrdersQueue.size();
            JSONObject nextOrder = pendingOrdersQueue.get(idx);
            if (nextOrder != null) {
                showPorterOrderCard(nextOrder);
            }
        }
    }

    private String formatDeliveryRange(String raw) {
        if (raw == null || raw.trim().isEmpty()) return "Standard Delivery";
        String trimmed = raw.trim();
        if (trimmed.toLowerCase().contains("instant") || trimmed.toLowerCase().contains("standard")) {
            return "Standard Delivery";
        }
        if (trimmed.contains("-") && (trimmed.contains("AM") || trimmed.contains("PM") || trimmed.contains("am") || trimmed.contains("pm"))) {
            return trimmed;
        }
        try {
            java.text.SimpleDateFormat isoFormat = new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", java.util.Locale.US);
            isoFormat.setTimeZone(java.util.TimeZone.getTimeZone("UTC"));
            String cleaned = trimmed.replace(".000Z", "").replace("Z", "");
            java.util.Date date = isoFormat.parse(cleaned);
            if (date != null) {
                java.util.Calendar cal = java.util.Calendar.getInstance();
                cal.setTime(date);
                java.text.SimpleDateFormat hrFormat = new java.text.SimpleDateFormat("h a", java.util.Locale.US);
                hrFormat.setTimeZone(java.util.TimeZone.getDefault());
                String start = hrFormat.format(cal.getTime());
                cal.add(java.util.Calendar.HOUR_OF_DAY, 1);
                String end = hrFormat.format(cal.getTime());
                return start + " - " + end;
            }
        } catch (Exception ignored) {}
        return trimmed;
    }

    public synchronized void dismissPorterOrderCard() {
        stopAlertEffects();
        dismissPorterOrderCardInternal();
        if (!isAppInForeground) {
            showCircleBubble();
        }
    }

    private void dismissPorterOrderCardInternal() {
        if (orderCardView != null) {
            try {
                if (orderCardView.isAttachedToWindow()) {
                    windowManager.removeView(orderCardView);
                }
            } catch (Exception ignored) {}
            orderCardView = null;
        }
    }

    private void startAlertEffects() {
        try {
            stopAlertEffects();

            // Loop Ringtone / Notification Sound
            Uri alertUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
            if (alertUri == null) {
                alertUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
            }

            alertMediaPlayer = new MediaPlayer();
            alertMediaPlayer.setDataSource(this, alertUri);
            alertMediaPlayer.setAudioAttributes(new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build());
            alertMediaPlayer.setLooping(true);
            alertMediaPlayer.prepare();
            alertMediaPlayer.start();
        } catch (Exception e) {
            e.printStackTrace();
        }

        try {
            if (vibrator != null && vibrator.hasVibrator()) {
                long[] pattern = {0, 600, 300, 600, 300, 600};
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vibrator.vibrate(VibrationEffect.createWaveform(pattern, 1));
                } else {
                    vibrator.vibrate(pattern, 1);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void stopAlertEffects() {
        if (alertMediaPlayer != null) {
            try {
                if (alertMediaPlayer.isPlaying()) {
                    alertMediaPlayer.stop();
                }
                alertMediaPlayer.release();
            } catch (Exception ignored) {}
            alertMediaPlayer = null;
        }

        if (vibrator != null) {
            try {
                vibrator.cancel();
            } catch (Exception ignored) {}
        }
    }

    private void wakeUpScreen() {
        try {
            PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
            if (pm != null) {
                PowerManager.WakeLock wakeLock = pm.newWakeLock(
                        PowerManager.FULL_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP | PowerManager.ON_AFTER_RELEASE,
                        "ILYMart:PorterOrderAlert"
                );
                wakeLock.acquire(15000); // 15 seconds
            }
        } catch (Exception ignored) {}
    }

    private void openApp(String orderId) {
        try {
            Intent intent = new Intent(this, MainActivity.class);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK
                    | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
                    | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            if (orderId != null) {
                intent.putExtra("open_incoming_order", true);
                intent.putExtra("order_id", orderId);
            }
            startActivity(intent);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    /**
     * 3. Background Order Poller (Runs every 5 seconds even when app is closed)
     */
    private void startOrderPolling() {
        pollingExecutor = Executors.newSingleThreadScheduledExecutor();
        pollingExecutor.scheduleWithFixedDelay(() -> {
            try {
                pollForPendingOrders();
            } catch (Exception e) {
                // Silently retry on next tick
            }
        }, 2, 5, TimeUnit.SECONDS);
    }

    private void pollForPendingOrders() {
        SharedPreferences prefs = getSharedPreferences("ILYMartPrefs", Context.MODE_PRIVATE);
        String token = prefs.getString("authToken", null);

        HttpURLConnection conn = null;
        try {
            URL url = new URL(ORDERS_API_URL);
            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(8000);
            conn.setReadTimeout(8000);
            conn.setRequestProperty("Content-Type", "application/json");

            if (token != null && !token.trim().isEmpty()) {
                conn.setRequestProperty("Authorization", "Bearer " + token.trim());
            }

            int code = conn.getResponseCode();
            if (code == 200) {
                BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    sb.append(line);
                }
                reader.close();

                String jsonResponse = sb.toString();
                JSONArray ordersArray = null;

                if (jsonResponse.trim().startsWith("[")) {
                    ordersArray = new JSONArray(jsonResponse);
                } else {
                    JSONObject obj = new JSONObject(jsonResponse);
                    if (obj.has("data") && obj.optJSONArray("data") != null) {
                        ordersArray = obj.optJSONArray("data");
                    }
                }

                if (ordersArray != null && ordersArray.length() > 0) {
                    synchronized (pendingOrdersQueue) {
                        pendingOrdersQueue.clear();
                        for (int i = 0; i < ordersArray.length(); i++) {
                            JSONObject order = ordersArray.optJSONObject(i);
                            if (order == null) continue;

                            String status = order.optString("status", "");
                            if ("Pending".equalsIgnoreCase(status)
                                    || "Processing".equalsIgnoreCase(status)
                                    || "Order Placed".equalsIgnoreCase(status)
                                    || "Confirmed".equalsIgnoreCase(status)) {
                                pendingOrdersQueue.add(order);
                            }
                        }
                    }
                    if (orderCardView == null && !isAppInForeground && !isGapWaiting && !pendingOrdersQueue.isEmpty()) {
                        mainHandler.post(() -> showNextPendingOrderIfAny());
                    }
                }
            }
        } catch (Exception e) {
            // Network failure or backend wake-up; ignore and retry next cycle
        } finally {
            if (conn != null) {
                conn.disconnect();
            }
        }
    }

    private void startForegroundNotification() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    NOTIFICATION_CHANNEL_ID,
                    "Delivery Partner Active Duty",
                    NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Keeps delivery partner online for incoming order alerts");
            channel.enableLights(false);
            channel.enableVibration(false);

            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }

        Intent openAppIntent = new Intent(this, MainActivity.class);
        openAppIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                this,
                0,
                openAppIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
        );

        Notification notification = new NotificationCompat.Builder(this, NOTIFICATION_CHANNEL_ID)
                .setContentTitle("ILY Mart Partner Online 🟢")
                .setContentText("Watching for incoming delivery orders in background")
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentIntent(pendingIntent)
                .setOngoing(true)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .build();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(2001, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
        } else {
            startForeground(2001, notification);
        }
    }

    private void postHighPriorityOrderNotification(String shortId, String earning, String pickup, String drop, String orderId) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel alertChannel = new NotificationChannel(
                    ALERT_CHANNEL_ID,
                    "High Priority Order Alerts",
                    NotificationManager.IMPORTANCE_HIGH
            );
            alertChannel.setDescription("Rings loud for incoming orders");
            alertChannel.enableLights(true);
            alertChannel.setLightColor(Color.GREEN);
            alertChannel.enableVibration(true);

            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(alertChannel);
            }
        }

        Intent openOrderIntent = new Intent(this, MainActivity.class);
        openOrderIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        openOrderIntent.putExtra("open_incoming_order", true);
        openOrderIntent.putExtra("order_id", orderId);

        PendingIntent pi = PendingIntent.getActivity(
                this,
                (int) System.currentTimeMillis(),
                openOrderIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
        );

        Notification notif = new NotificationCompat.Builder(this, ALERT_CHANNEL_ID)
                .setContentTitle("🚨 New Order #" + shortId + " (" + earning + ")")
                .setContentText(pickup + " ➔ " + drop)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setContentIntent(pi)
                .setAutoCancel(true)
                .build();

        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null) {
            nm.notify(3002, notif);
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        isRunning = false;
        instance = null;

        stopAlertEffects();
        dismissPorterOrderCardInternal();
        hideCircleBubble();

        if (pollingExecutor != null && !pollingExecutor.isShutdown()) {
            pollingExecutor.shutdownNow();
        }
    }
}
