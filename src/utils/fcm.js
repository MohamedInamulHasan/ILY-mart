import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { apiService } from './api';

let isInitialized = false;

/**
 * Initialize Firebase Cloud Messaging (FCM) Push Notifications for native mobile app.
 * Requests notification permissions, registers with Google FCM, and handles notifications.
 *
 * @param {Function} navigate - React Router navigate function for deep-linking on tap
 */
export const initFCM = async (navigate) => {
    // Only run on native Android / iOS platforms
    if (!Capacitor.isNativePlatform()) {
        return;
    }

    if (isInitialized) {
        return;
    }
    isInitialized = true;

    try {
        console.log('🔔 [FCM] Initializing Push Notifications...');

        // 1. Request notification permission
        let permStatus = await PushNotifications.checkPermissions();
        if (permStatus.receive !== 'granted') {
            permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive !== 'granted') {
            console.warn('⚠️ [FCM] Push notification permission not granted:', permStatus.receive);
            return;
        }

        // 2. Create high-priority Android notification channel for order updates
        try {
            await PushNotifications.createChannel({
                id: 'order_updates',
                name: 'Order Updates',
                description: 'Real-time notifications about your orders',
                importance: 5,
                visibility: 1,
                sound: 'default',
                vibration: true,
                lights: true,
                lightColor: '#2E5A2E'
            });
            console.log('✅ [FCM] Notification channel order_updates registered');
        } catch (channelErr) {
            console.warn('⚠️ [FCM] Could not create channel:', channelErr?.message);
        }

        // 3. Register with Apple / Google APNs / FCM
        await PushNotifications.register();

        // 3. Listen for FCM Device Token registration
        await PushNotifications.addListener('registration', async (token) => {
            console.log('🔔 [FCM] Device Token received:', token.value);
            const savedToken = localStorage.getItem('fcm_token');
            localStorage.setItem('fcm_token', token.value);

            // Sync with backend if token changed or user is logged in
            try {
                const authToken = localStorage.getItem('authToken');
                if (authToken && token.value) {
                    await apiService.saveFcmToken(token.value);
                    console.log('✅ [FCM] Token synced with backend user profile.');
                }
            } catch (err) {
                console.warn('⚠️ [FCM] Failed to sync token with backend:', err?.message || err);
            }
        });

        // 4. Handle registration errors
        await PushNotifications.addListener('registrationError', (error) => {
            console.error('❌ [FCM] Error registering for push notifications:', error);
        });

        // 5. Handle foreground notifications (when app is currently open)
        await PushNotifications.addListener('pushNotificationReceived', (notification) => {
            console.log('🔔 [FCM] Notification received in foreground:', notification);
            // Optionally dispatch a custom event or trigger subtle vibration
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate([100, 50, 100]);
            }
        });

        // 6. Handle notification click / tap action (when user taps the notification)
        await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
            console.log('👉 [FCM] Notification tapped:', action);
            const data = action?.notification?.data;
            const orderId = data?.orderId || data?.id;

            if (orderId && typeof navigate === 'function') {
                navigate(`/order-details/${orderId}`);
            } else if (typeof navigate === 'function') {
                navigate('/orders');
            }
        });

    } catch (error) {
        console.error('❌ [FCM] Initialization failed:', error);
    }
};

/**
 * Sync the stored FCM device token to the current logged-in user profile
 */
export const syncFcmTokenWithUser = async () => {
    if (!Capacitor.isNativePlatform()) return;

    const fcmToken = localStorage.getItem('fcm_token');
    const authToken = localStorage.getItem('authToken');

    if (fcmToken && authToken) {
        try {
            await apiService.saveFcmToken(fcmToken);
            console.log('✅ [FCM] Re-synced token on user authentication.');
        } catch (err) {
            console.warn('⚠️ [FCM] Re-sync token error:', err?.message || err);
        }
    }
};
