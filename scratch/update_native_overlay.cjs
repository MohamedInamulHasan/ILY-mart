const fs = require('fs');

// 1. Update src/utils/floatingOverlay.js
let foCode = fs.readFileSync('src/utils/floatingOverlay.js', 'utf8');
if (!foCode.includes('setOverlayHasAcceptedOrder')) {
    const extraMethod = `
/**
 * Notify the native service whether there is an active accepted delivery order.
 * The floating logo will ONLY display when this is true.
 */
export const setOverlayHasAcceptedOrder = async (hasAcceptedOrder) => {
    if (!isNativeAndroid()) return;
    try {
        await FloatingOverlay.setHasAcceptedOrder({ hasAcceptedOrder: !!hasAcceptedOrder });
    } catch (err) {
        console.warn('Error setting overlay accepted order state:', err);
    }
};
`;
    foCode += extraMethod;
    fs.writeFileSync('src/utils/floatingOverlay.js', foCode, 'utf8');
    console.log('Updated src/utils/floatingOverlay.js');
}

// 2. Update FloatingOverlayPlugin.java in both paths
const pluginPaths = [
    'android/app/src/main/java/com/ilayangudimart/app/FloatingOverlayPlugin.java',
    'APP _ homly/homly-mobile/android/app/src/main/java/com/ilayangudimart/app/FloatingOverlayPlugin.java'
];

pluginPaths.forEach(p => {
    if (fs.existsSync(p)) {
        let code = fs.readFileSync(p, 'utf8');
        if (!code.includes('setHasAcceptedOrder')) {
            const method = `
    @PluginMethod
    public void setHasAcceptedOrder(PluginCall call) {
        boolean hasAcceptedOrder = call.getBoolean("hasAcceptedOrder", false);
        SharedPreferences prefs = getContext().getSharedPreferences("ILYMartPrefs", Context.MODE_PRIVATE);
        prefs.edit().putBoolean("has_accepted_order", hasAcceptedOrder).apply();
        if (FloatingLogoService.instance != null) {
            FloatingLogoService.instance.updateAcceptedOrderState(hasAcceptedOrder);
        }
        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }
`;
            // Insert before the last closing brace
            const lastBrace = code.lastIndexOf('}');
            code = code.substring(0, lastBrace) + method + '\n}';
            fs.writeFileSync(p, code, 'utf8');
            console.log('Updated', p);
        }
    }
});

// 3. Update FloatingLogoService.java in both paths
const servicePaths = [
    'android/app/src/main/java/com/ilayangudimart/app/FloatingLogoService.java',
    'APP _ homly/homly-mobile/android/app/src/main/java/com/ilayangudimart/app/FloatingLogoService.java'
];

servicePaths.forEach(p => {
    if (fs.existsSync(p)) {
        let code = fs.readFileSync(p, 'utf8');
        
        // Update showCircleBubble to check has_accepted_order
        if (!code.includes('has_accepted_order')) {
            const oldShow = `        SharedPreferences prefs = getSharedPreferences("ILYMartPrefs", Context.MODE_PRIVATE);
        boolean enabled = prefs.getBoolean("floating_enabled", true);
        if (!enabled) return;`;

            const newShow = `        SharedPreferences prefs = getSharedPreferences("ILYMartPrefs", Context.MODE_PRIVATE);
        boolean enabled = prefs.getBoolean("floating_enabled", true);
        if (!enabled) return;

        boolean hasAcceptedOrder = prefs.getBoolean("has_accepted_order", false);
        if (!hasAcceptedOrder) return;`;

            if (code.includes(oldShow)) {
                code = code.replace(oldShow, newShow);
            } else {
                code = code.replace(oldShow.replace(/\r\n/g, '\n'), newShow.replace(/\r\n/g, '\n'));
            }

            // Add updateAcceptedOrderState method
            const newMethod = `
    public void updateAcceptedOrderState(boolean hasAccepted) {
        SharedPreferences prefs = getSharedPreferences("ILYMartPrefs", Context.MODE_PRIVATE);
        prefs.edit().putBoolean("has_accepted_order", hasAccepted).apply();
        mainHandler.post(() -> {
            if (hasAccepted) {
                if (!isAppInForeground && orderCardView == null) {
                    showCircleBubble();
                }
            } else {
                hideCircleBubble();
            }
        });
    }
`;
            // Add before startOrderPolling
            code = code.replace('private void startOrderPolling() {', newMethod + '\n    private void startOrderPolling() {');

            // Update pollForPendingOrders to check for accepted orders
            const oldPollLoop = `                            String status = order.optString("status", "");
                            if ("Pending".equalsIgnoreCase(status)
                                    || "Processing".equalsIgnoreCase(status)
                                    || "Order Placed".equalsIgnoreCase(status)
                                    || "Confirmed".equalsIgnoreCase(status)) {
                                pendingOrdersQueue.add(order);
                            }`;

            const newPollLoop = `                            String status = order.optString("status", "");
                            if ("Accepted".equalsIgnoreCase(status)
                                    || "Out for Delivery".equalsIgnoreCase(status)
                                    || "Shipped".equalsIgnoreCase(status)) {
                                foundAccepted = true;
                            } else if ("Pending".equalsIgnoreCase(status)
                                    || "Processing".equalsIgnoreCase(status)
                                    || "Order Placed".equalsIgnoreCase(status)
                                    || "Confirmed".equalsIgnoreCase(status)) {
                                pendingOrdersQueue.add(order);
                            }`;

            if (code.includes(oldPollLoop)) {
                code = code.replace(oldPollLoop, newPollLoop);
            } else {
                code = code.replace(oldPollLoop.replace(/\r\n/g, '\n'), newPollLoop.replace(/\r\n/g, '\n'));
            }

            // Insert boolean foundAccepted before synchronized and notify after
            const oldQueueBlock = `                if (ordersArray != null && ordersArray.length() > 0) {
                    synchronized (pendingOrdersQueue) {`;
            const newQueueBlock = `                if (ordersArray != null && ordersArray.length() > 0) {
                    boolean foundAccepted = false;
                    synchronized (pendingOrdersQueue) {`;
            
            if (code.includes(oldQueueBlock)) {
                code = code.replace(oldQueueBlock, newQueueBlock);
            } else {
                code = code.replace(oldQueueBlock.replace(/\r\n/g, '\n'), newQueueBlock.replace(/\r\n/g, '\n'));
            }

            const oldAfterQueue = `                    if (orderCardView == null && !isAppInForeground && !isGapWaiting && !pendingOrdersQueue.isEmpty()) {`;
            const newAfterQueue = `                    final boolean hasAccepted = foundAccepted;
                    mainHandler.post(() -> updateAcceptedOrderState(hasAccepted));

                    if (orderCardView == null && !isAppInForeground && !isGapWaiting && !pendingOrdersQueue.isEmpty()) {`;

            if (code.includes(oldAfterQueue)) {
                code = code.replace(oldAfterQueue, newAfterQueue);
            } else {
                code = code.replace(oldAfterQueue.replace(/\r\n/g, '\n'), newAfterQueue.replace(/\r\n/g, '\n'));
            }

            fs.writeFileSync(p, code, 'utf8');
            console.log('Updated', p);
        }
    }
});
