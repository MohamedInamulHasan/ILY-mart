import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import User from '../models/User.js';
import Order from '../models/Order.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export let firebaseInitError = null;

// Initialize Firebase Admin SDK
export const initFirebaseAdmin = () => {
    if (getApps().length > 0) return true;

    try {
        let serviceAccount = null;
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            let raw = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
            if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
                raw = raw.slice(1, -1).trim();
            }

            try {
                serviceAccount = JSON.parse(raw);
            } catch (jsonErr) {
                try {
                    const decoded = Buffer.from(raw, 'base64').toString('utf8');
                    serviceAccount = JSON.parse(decoded);
                } catch (b64Err) {
                    throw new Error(`JSON.parse failed: ${jsonErr.message}`);
                }
            }
        } else {
            const serviceAccountPath = join(__dirname, '../config/firebase-service-account.json');
            if (existsSync(serviceAccountPath)) {
                serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
            } else {
                console.warn('⚠️ No firebase-service-account.json found and FIREBASE_SERVICE_ACCOUNT env var not set.');
            }
        }

        if (serviceAccount) {
            // Fix private_key newlines (Render often escapes \n to \\n or vice versa)
            if (serviceAccount.private_key && typeof serviceAccount.private_key === 'string') {
                serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
            }

            initializeApp({
                credential: cert(serviceAccount)
            });
            console.log('✅ Firebase Admin SDK initialized successfully');
            firebaseInitError = null;
            return true;
        }
    } catch (err) {
        firebaseInitError = err.message;
        console.error('❌ Firebase Admin SDK initialization failed:', err.message);
        return false;
    }
    return false;
};

// Initial boot attempt
initFirebaseAdmin();

// Map order status to notification content
const getNotificationContent = (status) => {
    const normalized = (status || '').trim();
    const map = {
        'Processing':       { title: '✅ Order Placed!',         body: 'Your order has been placed successfully. We\'ll start preparing it soon.' },
        'Confirmed':        { title: '📦 Order Confirmed!',      body: 'Your order is confirmed and being packed for delivery.' },
        'Accepted':         { title: '🛵 Order Accepted!',       body: 'Your order has been accepted by our delivery partner.' },
        'Out for Delivery': { title: '🛵 Out for Delivery!',     body: 'Your delivery partner is on the way. Get ready!' },
        'Shipped':          { title: '🚚 Order Shipped!',        body: 'Your order is on its way to you.' },
        'Delivered':        { title: '🎉 Order Delivered!',      body: 'Your order has been delivered. Enjoy your purchase!' },
        'Cancelled':        { title: '❌ Order Cancelled',       body: 'Your order has been cancelled. We\'re sorry for the inconvenience.' },
    };
    return map[normalized] || { title: '📋 Order Update', body: `Your order status has been updated to: ${status}` };
};

/**
 * Send FCM push notification to a user for order status update
 * @param {string|ObjectId} userId  - The user's MongoDB ID
 * @param {string} orderId          - The order's MongoDB ID (string)
 * @param {string} status           - The new order status
 */
export const sendOrderPushNotification = async (userId, orderId, status) => {
    try {
        if (getApps().length === 0) {
            console.warn('⚠️ Firebase Admin not initialized, skipping FCM push');
            return;
        }

        const tokensSet = new Set();
        let resolvedUserId = userId;

        // 1. Fetch direct FCM token from Order if available
        if (orderId) {
            try {
                const order = await Order.findById(orderId).select('fcmToken user');
                if (order?.fcmToken) {
                    tokensSet.add(order.fcmToken);
                }
                if (!resolvedUserId && order?.user) {
                    resolvedUserId = order.user;
                }
            } catch (orderErr) {
                console.warn('⚠️ Could not fetch order for FCM:', orderErr.message);
            }
        }

        // 2. Fetch user's FCM tokens
        if (resolvedUserId) {
            try {
                const user = await User.findById(resolvedUserId).select('fcmTokens name');
                if (user?.fcmTokens && Array.isArray(user.fcmTokens)) {
                    user.fcmTokens.forEach(t => { if (t) tokensSet.add(t); });
                }
            } catch (userErr) {
                console.warn('⚠️ Could not fetch user tokens for FCM:', userErr.message);
            }
        }

        const tokens = Array.from(tokensSet).filter(Boolean);
        if (tokens.length === 0) {
            console.log(`ℹ️ No FCM tokens for order ${orderId} (user ${resolvedUserId}), skipping push`);
            return;
        }

        const { title, body } = getNotificationContent(status);

        // Build the multicast message with full Android background support
        const message = {
            notification: { title, body },
            data: {
                orderId: orderId ? orderId.toString() : '',
                status: status || '',
                click_action: 'FLUTTER_NOTIFICATION_CLICK',
                type: 'order_update'
            },
            android: {
                notification: {
                    sound: 'default',
                    priority: 'high',
                    channelId: 'order_updates',
                    visibility: 'public',
                    defaultSound: true,
                    defaultVibrateTimings: true
                },
                priority: 'high'
            },
            tokens
        };

        const response = await getMessaging().sendEachForMulticast(message);
        console.log(`📲 FCM sent for order ${orderId} (${status}): ${response.successCount} success, ${response.failureCount} failed across ${tokens.length} token(s)`);

        // Remove invalid/expired tokens
        if (response.failureCount > 0 && resolvedUserId) {
            const expiredTokens = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    const errCode = resp.error?.code;
                    if (
                        errCode === 'messaging/invalid-registration-token' ||
                        errCode === 'messaging/registration-token-not-registered'
                    ) {
                        expiredTokens.push(tokens[idx]);
                    }
                    console.warn(`⚠️ FCM token ${idx} failed:`, resp.error?.code);
                }
            });

            if (expiredTokens.length > 0) {
                await User.findByIdAndUpdate(resolvedUserId, {
                    $pull: { fcmTokens: { $in: expiredTokens } }
                });
                console.log(`🗑️ Removed ${expiredTokens.length} expired FCM token(s) for user ${resolvedUserId}`);
            }
        }
    } catch (err) {
        console.error('❌ sendOrderPushNotification error:', err.message);
    }
};
