import { Capacitor, registerPlugin } from '@capacitor/core';
import { formatDeliveryRangeFromDate } from './storeHelpers';

// Register the custom native plugin
export const FloatingOverlay = registerPlugin('FloatingOverlay');

/**
 * Checks if running on native Android device
 */
export const isNativeAndroid = () => {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
};

/**
 * Check if the "Display Over Other Apps" permission is granted
 */
export const checkOverlayPermission = async () => {
    if (!isNativeAndroid()) return true;
    try {
        const res = await FloatingOverlay.checkPermission();
        return !!res?.granted;
    } catch (err) {
        console.warn('Error checking overlay permission:', err);
        return false;
    }
};

/**
 * Request "Display Over Other Apps" permission (opens phone Settings)
 */
export const requestOverlayPermission = async () => {
    if (!isNativeAndroid()) return true;
    try {
        const res = await FloatingOverlay.requestPermission();
        return !!res?.granted;
    } catch (err) {
        console.warn('Error requesting overlay permission:', err);
        return false;
    }
};

/**
 * Show the Porter-style floating draggable logo on phone screen
 */
export const showFloatingOverlay = async () => {
    if (!isNativeAndroid()) return;
    try {
        await FloatingOverlay.show();
    } catch (err) {
        console.warn('Error showing floating overlay:', err);
    }
};

/**
 * Hide the floating logo when app is opened in foreground
 */
export const hideFloatingOverlay = async () => {
    if (!isNativeAndroid()) return;
    try {
        await FloatingOverlay.hide();
    } catch (err) {
        console.warn('Error hiding floating overlay:', err);
    }
};

/**
 * Porter Partner style: wake up screen and display incoming order alert on screen
 */
export const triggerIncomingOrderAlert = async () => {
    if (!isNativeAndroid()) return;
    try {
        await FloatingOverlay.triggerIncomingAlert();
    } catch (err) {
        console.warn('Error triggering incoming order alert:', err);
    }
};

/**
 * Save auth token to Android Native SharedPreferences so the background service
 * can poll for new orders when the app is swiped away / closed.
 */
export const setOverlayAuthToken = async (token) => {
    if (!isNativeAndroid() || !token) return;
    try {
        await FloatingOverlay.setAuthToken({ token });
    } catch (err) {
        console.warn('Error setting overlay auth token:', err);
    }
};

/**
 * Display the Porter-style floating alert card over other apps for a new order
 */
export const showPorterOrderCard = async (order) => {
    if (!isNativeAndroid() || !order) return;
    try {
        const rawTime = order.scheduledDeliveryTime || order.deliveryTime || order.shippingAddress?.deliveryTime;
        const isValid = rawTime && String(rawTime).trim().toLowerCase() !== 'null' && String(rawTime).trim().toLowerCase() !== 'undefined' && String(rawTime).trim() !== '';
        const timeDisplay = isValid ? (formatDeliveryRangeFromDate(rawTime) || rawTime) : 'Not Mentioned';

        const sanitizedOrder = {
            ...order,
            scheduledDeliveryTime: timeDisplay,
            deliveryTime: timeDisplay,
            shippingAddress: order.shippingAddress ? {
                ...order.shippingAddress,
                deliveryTime: timeDisplay
            } : undefined
        };

        await FloatingOverlay.showPorterOrderCard(sanitizedOrder);
    } catch (err) {
        console.warn('Error showing Porter order card:', err);
    }
};

/**
 * Dismiss the floating Porter order card
 */
export const dismissPorterOrderCard = async () => {
    if (!isNativeAndroid()) return;
    try {
        await FloatingOverlay.dismissPorterOrderCard();
    } catch (err) {
        console.warn('Error dismissing Porter order card:', err);
    }
};

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
