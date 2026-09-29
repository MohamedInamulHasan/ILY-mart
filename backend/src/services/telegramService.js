import axios from 'axios';

/**
 * Sends a Telegram notification via Bot API
 * @param {Object} order - The order object
 * @returns {Promise<boolean>} - True if successful
 */
export const sendOrderTelegramNotification = async (order) => {
    try {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;

        if (!token || !chatId || token === 'REPLACE_TOKEN' || chatId === 'REPLACE_ID') {
            console.warn('⚠️ Telegram notification skipped: Missing credentials in .env');
            return false;
        }

        const shippingAddr = order.shippingAddress || {};
        const customerName = shippingAddr.name || order.user?.name || 'Customer';
        const phone = shippingAddr.mobile || 'N/A';
        // PRIORITIZE SHIPPING LOCATION (From Checkout GPS) OVER USER PROFILE LOCATION
        const customerLocation = shippingAddr.location || order.user?.location || '';
        const address = `${shippingAddr.street || ''}${shippingAddr.city ? `, ${shippingAddr.city}` : ''}${customerLocation ? `\n📍 Coordinates: ${customerLocation}` : ''}`;

        // Format delivery charge
        const deliveryCharge = order.shipping || 0;
        let deliveryText;
        if (deliveryCharge === 0) {
            deliveryText = order.items.some(i => i.isGold) ? 'FREE (Gold Benefit) ⚡' : 'FREE (Coin Applied) 🪙';
        } else {
            deliveryText = `₹${deliveryCharge}`;
        }

        // Format scheduled delivery time
        let deliveryTimeText = 'Instant Delivery';
        const rawDeliveryTime = order.scheduledDeliveryTime || order.deliveryTime || order.shippingAddress?.deliveryTime;
        if (rawDeliveryTime) {
            const strTime = String(rawDeliveryTime).toLowerCase();
            if (strTime.includes('instant')) {
                deliveryTimeText = 'Instant Delivery';
            } else if (typeof rawDeliveryTime === 'string' && rawDeliveryTime.includes('|')) {
                const parts = rawDeliveryTime.split('|');
                const [hours, minutes] = parts[1].split(':');
                const hStart = parseInt(hours, 10);
                if (!isNaN(hStart)) {
                    const formatShortTime = (h, m) => {
                        const ampm = h >= 12 ? 'PM' : 'AM';
                        const h12 = h % 12 || 12;
                        const mStr = parseInt(m, 10) === 0 ? '' : `:${m}`;
                        return `${h12}${mStr}${ampm}`;
                    };
                    const hEnd = (hStart + 1) % 24;
                    deliveryTimeText = `${formatShortTime(hStart, minutes)} - ${formatShortTime(hEnd, minutes)}`;
                } else {
                    deliveryTimeText = rawDeliveryTime;
                }
            } else {
                const date = new Date(rawDeliveryTime);
                if (!isNaN(date.getTime())) {
                    const hStart = date.getHours();
                    const mStart = date.getMinutes().toString().padStart(2, '0');
                    const hEnd = (hStart + 1) % 24;
                    const formatShortTime = (h, m) => {
                        const ampm = h >= 12 ? 'PM' : 'AM';
                        const h12 = h % 12 || 12;
                        const mStr = parseInt(m, 10) === 0 ? '' : `:${m}`;
                        return `${h12}${mStr}${ampm}`;
                    };
                    deliveryTimeText = `${formatShortTime(hStart, mStart)} - ${formatShortTime(hEnd, mStart)}`;
                } else {
                    deliveryTimeText = String(rawDeliveryTime);
                }
            }
        }

        // Google Maps Link
        let mapsLink = null;
        if (customerLocation) {
            if (customerLocation.startsWith('http://') || customerLocation.startsWith('https://')) {
                // It's already a link
                mapsLink = customerLocation;
            } else if (customerLocation.includes(',')) {
                // It's likely coordinates "lat,long"
                mapsLink = `https://www.google.com/maps?q=${customerLocation.replace(/\s/g, '')}`;
            }
        }

        // Construct the message with professional formatting
        const message = `
🎉 <b>NEW ORDER RECEIVED</b>
━━━━━━━━━━━━━━━━━━━━

📋 <b>ORDER DETAILS</b>
Order ID: #${order._id.toString().slice(-8).toUpperCase()}
Total Amount: ₹${order.total.toFixed(0)}
Delivery Charge: ${deliveryText}
Payment Method: ${order.paymentMethod?.type || 'Cash on Delivery'}
Scheduled Delivery: ${deliveryTimeText}


👤 <b>CUSTOMER INFORMATION</b>
Name: ${customerName}
📧 Email: ${order.user?.email || 'N/A'}
Phone: ${phone}
Address: ${address}
${order.user?.address ? `Registered Address: ${order.user.address.street || ''}, ${order.user.address.city || ''} ${order.user.address.zip || ''}` : ''}
${mapsLink ? `🗺️ <a href="${mapsLink}">View Location on Map</a>` : ''}

🛒 <b>ORDER ITEMS</b>
${order.items.map((item, idx) => `${idx + 1}. ${item.name || item.product?.title || 'Item'} ${item.isFromAd ? '🔥 <b>[OFFER]</b>' : ''}
   Quantity: ${item.quantity}x @ ₹${item.price.toFixed(0)}${item.unit ? ` / ${item.unit}` : ''}
   Store: ${item.storeId?.name || 'ILY mart'}
   Subtotal: ₹${(item.price * item.quantity).toFixed(0)}`).join('\n\n')}

━━━━━━━━━━━━━━━━━━━━
<i>ILY mart Order Management System</i>
`.trim();

        // Telegram API URL
        const url = `https://api.telegram.org/bot${token}/sendMessage`;

        console.log(`📱 Sending Telegram alert for Order #${order._id}...`);

        await axios.post(url, {
            chat_id: chatId,
            text: message,
            parse_mode: 'HTML'
        });

        console.log('✅ Telegram notification sent successfully.');
        
        // Also notify delivery boys who are on duty
        await notifyDeliveryBoys(order);
        
        return true;
    } catch (error) {
        console.error('❌ Failed to send Telegram notification:', error.response?.data || error.message);
        return false;
    }
};

/**
 * Notifies all on-duty delivery boys about a new order
 * @param {Object} order - The order object
 */
export const notifyDeliveryBoys = async (order) => {
    try {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        if (!token || token === 'REPLACE_TOKEN') return;

        // Import User model dynamically to avoid circular dependencies if any
        const User = (await import('../models/User.js')).default;

        // Find all active delivery boys
        const deliveryBoys = await User.find({
            role: 'delivery_boy',
            'deliverySettings.isActive': true,
            'deliverySettings.telegramChatId': { $exists: true, $ne: '' }
        });

        if (deliveryBoys.length === 0) {
            console.log('ℹ️ No active delivery boys found for Telegram notification.');
            return;
        }

        for (const boy of deliveryBoys) {
            // Notify all active delivery boys regardless of time
            console.log(`📱 Notifying delivery boy: ${boy.name} (${boy.deliverySettings.telegramChatId})`);
            
            const boyMessage = `
🚚 <b>NEW DELIVERY ASSIGNMENT AVAILABLE</b>
━━━━━━━━━━━━━━━━━━━━
📦 <b>Order ID:</b> #${order._id.toString().slice(-8).toUpperCase()}
💰 <b>Total Amount:</b> ₹${order.total.toFixed(0)}
👤 <b>Customer:</b> ${order.shippingAddress?.name || order.user?.name || 'Customer'}
📍 <b>Location:</b> ${order.shippingAddress?.street}, ${order.shippingAddress?.city}
📱 <b>Phone:</b> ${order.shippingAddress?.mobile || 'N/A'}

🔗 <b><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin">Open Admin Panel to Accept</a></b>
━━━━━━━━━━━━━━━━━━━━
`.trim();

            try {
                await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
                    chat_id: boy.deliverySettings.telegramChatId,
                    text: boyMessage,
                    parse_mode: 'HTML'
                });
            } catch (err) {
                console.error(`❌ Failed to notify delivery boy ${boy.name}:`, err.response?.data || err.message);
            }
        }
    } catch (error) {
        console.error('❌ Error in notifyDeliveryBoys:', error.message);
    }
};

/**
 * Sends a Telegram notification for service requests
 * @param {Object} serviceRequest - The service request object
 * @returns {Promise<boolean>} - True if successful
 */
export const sendServiceRequestTelegramNotification = async (serviceRequest) => {
    try {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;

        if (!token || !chatId || token === 'REPLACE_TOKEN' || chatId === 'REPLACE_ID') {
            console.warn('⚠️ Telegram notification skipped: Missing credentials in .env');
            return false;
        }

        const service = serviceRequest.service;
        const user = serviceRequest.user;
        const customerName = user?.name || 'Customer';
        const customerEmail = user?.email || 'N/A';
        const customerPhone = user?.mobile || 'N/A';
        const requestLocation = serviceRequest.location || 'N/A';

        // Prioritize request coordinates, then fallback to user profile location
        const effectiveLocation = serviceRequest.coordinates || user?.location || '';

        let mapsLink = '';
        if (effectiveLocation) {
            if (effectiveLocation.startsWith('http://') || effectiveLocation.startsWith('https://')) {
                mapsLink = effectiveLocation;
            } else if (effectiveLocation.includes(',')) {
                mapsLink = `https://www.google.com/maps?q=${effectiveLocation.replace(/\s/g, '')}`;
            }
        }

        const message = `
🔧 <b>New Service Request!</b>
------------------------
<b>Request ID:</b> #${serviceRequest._id.toString().slice(-8).toUpperCase()}
<b>Service:</b> ${service?.name || 'Unknown Service'}
<b>Status:</b> ${serviceRequest.status || 'Pending'}

👤 <b>Customer Details:</b>
<b>Name:</b> ${customerName}
📧 ${customerEmail}
📞 ${customerPhone}
${user?.address ? `🏠 <b>Registered Address:</b> ${user.address.street || ''}, ${user.address.city || ''} ${user.address.zip || ''}` : ''}

📍 <b>Request Location:</b>
${requestLocation}
${effectiveLocation && effectiveLocation !== requestLocation ? `\n(GPS/Link: ${effectiveLocation})` : ''}
${mapsLink ? `🗺️ <a href="${mapsLink}">View on Map</a>` : ''}

------------------------
<i>ILY mart Service Request Alert</i>
`.trim();

        const url = `https://api.telegram.org/bot${token}/sendMessage`;

        console.log(`📱 Sending Telegram alert for Service Request #${serviceRequest._id}...`);

        await axios.post(url, {
            chat_id: chatId,
            text: message,
            parse_mode: 'HTML'
        });

        console.log('✅ Service request Telegram notification sent successfully.');
        return true;
    } catch (error) {
        console.error('❌ Failed to send service request Telegram notification:', error.response?.data || error.message);
        return false;
    }
};
