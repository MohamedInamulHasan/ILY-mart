import { Capacitor, registerPlugin } from '@capacitor/core';

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
