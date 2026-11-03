import os
import re

# 1. Update FloatingLogoService.java in both android project trees
java_paths = [
    r"c:\Users\moham\ILAYANGUDI PROJECT\android\app\src\main\java\com\ilayangudimart\app\FloatingLogoService.java",
    r"c:\Users\moham\ILAYANGUDI PROJECT\APP _ homly\homly-mobile\android\app\src\main\java\com\ilayangudimart\app\FloatingLogoService.java"
]

target_head_divider = """            // 2px horizontal light grey divider line matching green dot line
            View headDivider = new View(this);
            GradientDrawable lineBg = new GradientDrawable();
            lineBg.setColor(Color.parseColor("#D1D5DB"));
            lineBg.setCornerRadius(dp(2));
            headDivider.setBackground(lineBg);
            LinearLayout.LayoutParams divParams = new LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    dp(2)
            );
            divParams.setMargins(dp(18), 0, dp(18), 0);
            cardLayout.addView(headDivider, divParams);"""

replacement_head_divider = """            // Thin horizontal light grey divider line below order ID and time
            View headDivider = new View(this);
            GradientDrawable lineBg = new GradientDrawable();
            lineBg.setColor(Color.parseColor("#E5E7EB"));
            headDivider.setBackground(lineBg);
            LinearLayout.LayoutParams divParams = new LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    dp(1)
            );
            divParams.setMargins(dp(18), 0, dp(18), 0);
            cardLayout.addView(headDivider, divParams);"""

for jp in java_paths:
    if not os.path.exists(jp):
        print(f"File not found: {jp}")
        continue
    with open(jp, "r", encoding="utf-8") as f:
        j_content = f.read()

    # Replace head divider
    if target_head_divider in j_content:
        j_content = j_content.replace(target_head_divider, replacement_head_divider)
        print(f"Updated head divider in {jp}")
    else:
        norm_j = j_content.replace("\r\n", "\n")
        norm_t = target_head_divider.replace("\r\n", "\n")
        if norm_t in norm_j:
            j_content = norm_j.replace(norm_t, replacement_head_divider.replace("\r\n", "\n"))
            print(f"Updated head divider (normalized) in {jp}")
        else:
            print(f"Warning: target_head_divider not found in {jp}")

    # Remove brackets from VIEW ORDER button countdown: "VIEW ORDER  ➔  (8s)" -> "VIEW ORDER  ➔  8s"
    j_content = j_content.replace('acceptBtn.setText("VIEW ORDER  ➔  (8s)");', 'acceptBtn.setText("VIEW ORDER  ➔  8s");')
    j_content = j_content.replace('acceptBtn.setText("VIEW ORDER  ➔  (" + sec + "s)");', 'acceptBtn.setText("VIEW ORDER  ➔  " + sec + "s");')

    with open(jp, "w", encoding="utf-8") as f:
        f.write(j_content)
    print(f"Saved {jp}")

# 2. Update IncomingOrderModal.jsx
modal_path = r"c:\Users\moham\ILAYANGUDI PROJECT\src\components\IncomingOrderModal.jsx"
with open(modal_path, "r", encoding="utf-8") as f:
    modal_content = f.read()

# Make divider thin: mx-5 h-[2px] bg-gray-300 dark:bg-gray-600 -> mx-5 h-px bg-gray-200 dark:bg-gray-700
modal_content = modal_content.replace(
    '<div className="mx-5 h-[2px] bg-gray-300 dark:bg-gray-600 rounded-full shrink-0" />',
    '<div className="mx-5 h-px bg-gray-200 dark:bg-gray-700 shrink-0" />'
)

# Remove countdown timer and show until skip
timer_target = """    // 8-second auto-skip timer in View Order card (like Porter app)
    useEffect(() => {
        if (viewMode !== 'view' || !isProcessing) return;
        setCountdown(8);
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    stopIncomingOrderAlertSound();
                    if (onSkip) {
                        onSkip(order);
                    } else {
                        handleDismissView();
                    }
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [order?._id, order?.id, viewMode, isProcessing]);"""

modal_content = modal_content.replace(timer_target, "// In-app alert shows until skipped or viewed (no 8s auto-countdown)")
norm_modal = modal_content.replace("\r\n", "\n")
norm_timer = timer_target.replace("\r\n", "\n")
if norm_timer in norm_modal:
    modal_content = norm_modal.replace(norm_timer, "// In-app alert shows until skipped or viewed (no 8s auto-countdown)")

# Remove bracket and seconds from label
modal_content = modal_content.replace(
    'label={`${t(\'VIEW ORDER\')} (${countdown}s)`}',
    'label={t(\'VIEW ORDER\')}'
)

with open(modal_path, "w", encoding="utf-8") as f:
    f.write(modal_content)
print("Updated IncomingOrderModal.jsx")

# 3. Update NotificationOverlay.jsx
notif_path = r"c:\Users\moham\ILAYANGUDI PROJECT\src\components\NotificationOverlay.jsx"
with open(notif_path, "r", encoding="utf-8") as f:
    notif_content = f.read()

cycle_target = """    // Active pending/processing orders for delivery boys
    const pendingOrders = useMemo(() => {
        if (!isDeliveryBoy) return [];
        return allOrders.filter(o => {
            const s = String(o?.status || '').toLowerCase().trim();
            return s === 'pending' || s === 'processing' || s === 'order placed' || s === 'confirmed';
        });
    }, [allOrders, isDeliveryBoy]);

    const [currentPendingIndex, setCurrentPendingIndex] = useState(0);
    const [isGapWaiting, setIsGapWaiting] = useState(false);
    const [isAcceptSheetOpen, setIsAcceptSheetOpen] = useState(false);
    const gapTimeoutRef = useRef(null);

    // Repeatedly cycle through pending orders: 8s alert card -> 5s gap -> next pending order
    useEffect(() => {
        if (!isDeliveryBoy || pendingOrders.length === 0) {
            if (incomingOrder && !pendingOrders.some(p => (p._id || p.id) === (incomingOrder._id || incomingOrder.id))) {
                setIncomingOrder(null);
            }
            return;
        }

        // Only show next pending order if no card is currently showing, not in 5s gap, and not inspecting full accept sheet
        if (!incomingOrder && !isGapWaiting && !isAcceptSheetOpen) {
            const idx = currentPendingIndex % pendingOrders.length;
            const target = pendingOrders[idx];
            if (target) {
                setIncomingOrder(target);
                triggerIncomingOrderAlert();
            }
        }
    }, [isDeliveryBoy, pendingOrders, incomingOrder, isGapWaiting, isAcceptSheetOpen, currentPendingIndex]);

    const handleOrderSkip = () => {
        setIncomingOrder(null);
        setIsGapWaiting(true);
        if (gapTimeoutRef.current) clearTimeout(gapTimeoutRef.current);
        gapTimeoutRef.current = setTimeout(() => {
            setCurrentPendingIndex(prev => prev + 1);
            setIsGapWaiting(false);
        }, 5000);
    };

    const handleModalClose = () => {
        setIncomingOrder(null);
        setIsAcceptSheetOpen(false);
        setIsGapWaiting(true);
        if (gapTimeoutRef.current) clearTimeout(gapTimeoutRef.current);
        gapTimeoutRef.current = setTimeout(() => {
            setCurrentPendingIndex(prev => prev + 1);
            setIsGapWaiting(false);
        }, 5000);
    };

    const handleAcceptViewOpened = () => {
        setIsAcceptSheetOpen(true);
    };"""

replacement_cycle = """    // Auto-dismiss in-app modal if the order is no longer pending/processing (e.g. taken by another driver or cancelled)
    useEffect(() => {
        if (!incomingOrder) return;
        const currentInList = allOrders.find(o => (o._id || o.id) === (incomingOrder._id || incomingOrder.id));
        if (currentInList) {
            const s = String(currentInList.status || '').toLowerCase().trim();
            if (s !== 'pending' && s !== 'processing' && s !== 'order placed' && s !== 'confirmed') {
                setIncomingOrder(null);
            }
        }
    }, [allOrders, incomingOrder]);

    const handleOrderSkip = () => {
        setIncomingOrder(null);
    };

    const handleModalClose = () => {
        setIncomingOrder(null);
    };

    const handleAcceptViewOpened = () => {
        // Keeps the accept view open without interruption
    };"""

if cycle_target in notif_content:
    notif_content = notif_content.replace(cycle_target, replacement_cycle)
    print("Updated NotificationOverlay.jsx cycle logic")
else:
    norm_n = notif_content.replace("\r\n", "\n")
    norm_c = cycle_target.replace("\r\n", "\n")
    if norm_c in norm_n:
        notif_content = norm_n.replace(norm_c, replacement_cycle.replace("\r\n", "\n"))
        print("Updated NotificationOverlay.jsx cycle logic (normalized)")
    else:
        print("Warning: cycle_target not found in NotificationOverlay.jsx")

with open(notif_path, "w", encoding="utf-8") as f:
    f.write(notif_content)

# 4. Update DeliveryOrdersFeedModal.jsx: make line thin
feed_path = r"c:\Users\moham\ILAYANGUDI PROJECT\src\components\DeliveryOrdersFeedModal.jsx"
with open(feed_path, "r", encoding="utf-8") as f:
    feed_content = f.read()

feed_content = feed_content.replace(
    '<div className="mx-4 h-[2px] bg-gray-300 dark:bg-gray-600 rounded-full shrink-0" />',
    '<div className="mx-4 h-px bg-gray-200 dark:bg-gray-700 shrink-0" />'
)
with open(feed_path, "w", encoding="utf-8") as f:
    f.write(feed_content)
print("Updated DeliveryOrdersFeedModal.jsx")

# 5. Update DeliveryDashboard.jsx: make line thin
dash_path = r"c:\Users\moham\ILAYANGUDI PROJECT\src\pages\admin\DeliveryDashboard.jsx"
with open(dash_path, "r", encoding="utf-8") as f:
    dash_content = f.read()

dash_content = dash_content.replace(
    '<div className="mx-4 h-[2px] bg-gray-300 dark:bg-gray-600 rounded-full shrink-0" />',
    '<div className="mx-4 h-px bg-gray-200 dark:bg-gray-700 shrink-0" />'
)
with open(dash_path, "w", encoding="utf-8") as f:
    f.write(dash_content)
print("Updated DeliveryDashboard.jsx")

