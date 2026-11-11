import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin SDK (only once)
if (!admin.apps.length) {
    try {
        let serviceAccount;
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            // Support raw JSON or base64 encoded JSON string from environment variable (useful on Render)
            const raw = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
            serviceAccount = JSON.parse(raw.startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8'));
        } else {
            const serviceAccountPath = join(__dirname, '../config/firebase-service-account.json');
            serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
        }

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log('✅ Firebase Admin SDK initialized');
    } catch (err) {
        console.error('❌ Firebase Admin SDK initialization failed:', err.message);
    }
}

// Map order status to notification content
const getNotificationContent = (status) => {
    const map = {
        'Processing':       { title: '✅ Order Placed!',         body: 'Your order has been placed successfully. We\'ll start preparing it soon.' },
        'Confirmed':        { title: '📦 Order Confirmed!',      body: 'Your order is confirmed and being packed for delivery.' },
        'Out for Delivery': { title: '🛵 Out for Delivery!',     body: 'Your delivery partner is on the way. Get ready!' },
        'Shipped':          { title: '🚚 Order Shipped!',        body: 'Your order is on its way to you.' },
        'Delivered':        { title: '🎉 Order Delivered!',      body: 'Your order has been delivered. Enjoy your purchase!' },
        'Cancelled':        { title: '❌ Order Cancelled',       body: 'Your order has been cancelled. We\'re sorry for the inconvenience.' },
    };
    return map[status] || { title: '📋 Order Update', body: `Your order status has been updated to: ${status}` };
};

/**
 * Send FCM push notification to a user for order status update
 * @param {string|ObjectId} userId  - The user's MongoDB ID
 * @param {string} orderId          - The order's MongoDB ID (string)
 * @param {string} status           - The new order status
 */
export const sendOrderPushNotification = async (userId, orderId, status) => {
    try {
        if (!admin.apps.length) {
            console.warn('⚠️ Firebase Admin not initialized, skipping FCM push');
            return;
        }

        // Fetch user's FCM tokens
        const user = await User.findById(userId).select('fcmTokens name');
        if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
            console.log(`ℹ️ No FCM tokens for user ${userId}, skipping push`);
            return;
        }

        const { title, body } = getNotificationContent(status);
        const tokens = user.fcmTokens;

        // Build the multicast message
        const message = {
            notification: { title, body },
            data: {
                orderId: orderId.toString(),
                status,
                click_action: 'FLUTTER_NOTIFICATION_CLICK',
                type: 'order_update'
            },
            android: {
                notification: {
                    sound: 'default',
                    priority: 'HIGH',
                    channelId: 'order_updates'
                },
                priority: 'HIGH'
            },
            tokens
        };

        const response = await admin.messaging().sendEachForMulticast(message);
        console.log(`📲 FCM sent for order ${orderId} (${status}): ${response.successCount} success, ${response.failureCount} failed`);

        // Remove invalid/expired tokens
        if (response.failureCount > 0) {
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
                await User.findByIdAndUpdate(userId, {
                    $pull: { fcmTokens: { $in: expiredTokens } }
                });
                console.log(`🗑️ Removed ${expiredTokens.length} expired FCM token(s) for user ${userId}`);
            }
        }
    } catch (err) {
        console.error('❌ sendOrderPushNotification error:', err.message);
        throw err;
    }
};
