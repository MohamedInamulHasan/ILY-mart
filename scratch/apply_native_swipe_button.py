import os

# 1. Target code in FloatingLogoService.java
old_btn_code = """            // VIEW ORDER Button with 8s countdown timer (like Porter app)
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

            bodyLayout.addView(acceptBtn);"""

new_swipe_code = """            // Swipe To VIEW ORDER Track (matching SwipeActionButton yellow variant in order list card)
            FrameLayout swipeTrack = new FrameLayout(this);
            LinearLayout.LayoutParams swipeTrackParams = new LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    dp(52)
            );
            swipeTrackParams.setMargins(0, dp(4), 0, 0);
            swipeTrack.setLayoutParams(swipeTrackParams);

            GradientDrawable trackBg = new GradientDrawable();
            trackBg.setColor(Color.parseColor("#F59E0B")); // Amber 500
            trackBg.setCornerRadius(dp(26));
            swipeTrack.setBackground(trackBg);

            // Centered Text Label: VIEW ORDER 8s
            TextView swipeLabel = new TextView(this);
            swipeLabel.setText("VIEW ORDER  8s");
            swipeLabel.setTextColor(Color.WHITE);
            swipeLabel.setTextSize(TypedValue.COMPLEX_UNIT_SP, 15);
            swipeLabel.setTypeface(Typeface.DEFAULT_BOLD);
            swipeLabel.setGravity(Gravity.CENTER);
            FrameLayout.LayoutParams labelParams = new FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT,
                    FrameLayout.LayoutParams.MATCH_PARENT
            );
            swipeTrack.addView(swipeLabel, labelParams);

            // White Circular Swipe Knob with orange chevrons (matching order list card)
            FrameLayout swipeKnob = new FrameLayout(this);
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

            // Chevrons icon "»" in knob
            TextView knobIcon = new TextView(this);
            knobIcon.setText("»");
            knobIcon.setTextColor(Color.parseColor("#D97706")); // Amber 600
            knobIcon.setTextSize(TypedValue.COMPLEX_UNIT_SP, 22);
            knobIcon.setTypeface(Typeface.DEFAULT_BOLD);
            knobIcon.setGravity(Gravity.CENTER);
            FrameLayout.LayoutParams iconParams = new FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT,
                    FrameLayout.LayoutParams.MATCH_PARENT
            );
            swipeKnob.addView(knobIcon, iconParams);
            swipeTrack.addView(swipeKnob);

            // Touch Listener for swiping knob left to right
            final float[] startTouchX = {0};
            final float[] initialKnobX = {0};
            final boolean[] isCompleted = {false};

            View.OnTouchListener swipeListener = new View.OnTouchListener() {
                @Override
                public boolean onTouch(View v, MotionEvent event) {
                    if (isCompleted[0]) return true;

                    int maxDrag = swipeTrack.getWidth() - swipeKnob.getWidth() - dp(10);
                    if (maxDrag <= 0) maxDrag = dp(240);

                    switch (event.getAction()) {
                        case MotionEvent.ACTION_DOWN:
                            startTouchX[0] = event.getRawX();
                            initialKnobX[0] = swipeKnob.getTranslationX();
                            return true;

                        case MotionEvent.ACTION_MOVE:
                            float dx = event.getRawX() - startTouchX[0];
                            float newX = Math.max(0, Math.min(maxDrag, initialKnobX[0] + dx));
                            swipeKnob.setTranslationX(newX);
                            float progress = newX / (float) maxDrag;
                            swipeLabel.setAlpha(Math.max(0.1f, 1f - progress * 1.3f));
                            return true;

                        case MotionEvent.ACTION_UP:
                        case MotionEvent.ACTION_CANCEL:
                            float finalX = swipeKnob.getTranslationX();
                            if (finalX >= maxDrag * 0.6f) {
                                isCompleted[0] = true;
                                swipeKnob.animate().translationX(maxDrag).setDuration(120).start();
                                if (orderCardTimer != null) {
                                    orderCardTimer.cancel();
                                    orderCardTimer = null;
                                }
                                stopAlertEffects();
                                dismissPorterOrderCardInternal();
                                openApp(orderId);
                            } else {
                                swipeKnob.animate().translationX(0).setDuration(200).start();
                                swipeLabel.animate().alpha(1f).setDuration(200).start();
                            }
                            return true;
                    }
                    return false;
                }
            };

            swipeKnob.setOnTouchListener(swipeListener);
            swipeTrack.setOnTouchListener(swipeListener);

            if (orderCardTimer != null) {
                orderCardTimer.cancel();
                orderCardTimer = null;
            }
            orderCardTimer = new CountDownTimer(8000, 1000) {
                @Override
                public void onTick(long millisUntilFinished) {
                    int sec = (int) Math.ceil(millisUntilFinished / 1000.0);
                    swipeLabel.setText("VIEW ORDER  " + sec + "s");
                }

                @Override
                public void onFinish() {
                    skipPorterOrderCard();
                }
            }.start();

            bodyLayout.addView(swipeTrack);"""

java_files = [
    r"c:\Users\moham\ILAYANGUDI PROJECT\android\app\src\main\java\com\ilayangudimart\app\FloatingLogoService.java",
    r"c:\Users\moham\ILAYANGUDI PROJECT\APP _ homly\homly-mobile\android\app\src\main\java\com\ilayangudimart\app\FloatingLogoService.java"
]

for jf in java_files:
    if not os.path.exists(jf):
        continue
    with open(jf, "r", encoding="utf-8") as f:
        content = f.read()
    
    if old_btn_code in content:
        content = content.replace(old_btn_code, new_swipe_code)
    else:
        norm_c = content.replace("\r\n", "\n")
        norm_o = old_btn_code.replace("\r\n", "\n")
        if norm_o in norm_c:
            content = norm_c.replace(norm_o, new_swipe_code.replace("\r\n", "\n"))
        else:
            print(f"Warning: old_btn_code not found in {jf}")
            continue

    with open(jf, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Successfully updated swipe button in {jf}")

# 2. Update NotificationOverlay.jsx so opening from native swipe goes straight to order detail accept sheet
notif_path = r"c:\Users\moham\ILAYANGUDI PROJECT\src\components\NotificationOverlay.jsx"
with open(notif_path, "r", encoding="utf-8") as f:
    nc = f.read()

# Add startWithAcceptView state
nc = nc.replace(
    "const [incomingOrder, setIncomingOrder] = useState(null);",
    "const [incomingOrder, setIncomingOrder] = useState(null);\n    const [startWithAcceptView, setStartWithAcceptView] = useState(false);"
)

# In handleNativeOpenOrder, setStartWithAcceptView(true)
nc = nc.replace(
    """                if (res.success && res.data) {
                    setIncomingOrder(res.data);
                }""",
    """                if (res.success && res.data) {
                    setStartWithAcceptView(true);
                    setIncomingOrder(res.data);
                }"""
)

# In handleOrderCreated, setStartWithAcceptView(false)
nc = nc.replace(
    """            // Pop up the new incoming order card modal for the delivery boy and trigger alert
            setIncomingOrder(order);""",
    """            // Pop up the new incoming order card modal for the delivery boy and trigger alert
            setStartWithAcceptView(false);
            setIncomingOrder(order);"""
)

# In JSX, pass startWithViewCard={!startWithAcceptView}
nc = nc.replace(
    """            {isDeliveryBoy && incomingOrder && (
                <IncomingOrderModal
                    key={incomingOrder._id || incomingOrder.id}
                    order={incomingOrder}
                    startWithViewCard={true}
                    onClose={handleModalClose}
                    onSkip={handleOrderSkip}
                    onAcceptViewOpened={handleAcceptViewOpened}
                />
            )}""",
    """            {isDeliveryBoy && incomingOrder && (
                <IncomingOrderModal
                    key={incomingOrder._id || incomingOrder.id}
                    order={incomingOrder}
                    startWithViewCard={!startWithAcceptView}
                    onClose={() => {
                        setStartWithAcceptView(false);
                        handleModalClose();
                    }}
                    onSkip={() => {
                        setStartWithAcceptView(false);
                        handleOrderSkip();
                    }}
                    onAcceptViewOpened={handleAcceptViewOpened}
                />
            )}"""
)

with open(notif_path, "w", encoding="utf-8") as f:
    f.write(nc)
print("Successfully updated NotificationOverlay.jsx")

