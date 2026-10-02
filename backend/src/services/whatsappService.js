// Green-API WhatsApp Notification Service
// Sends instant direct WhatsApp messages with clean IST dates, formatted payment info, delivery charge, and delivery time ranges

const getGreenApiCredentials = () => {
    const idInstance = process.env.GREEN_API_ID_INSTANCE || '710722753410';
    const tokenInstance = process.env.GREEN_API_TOKEN_INSTANCE || 'f9099767240d433d87517a9e6d720a96dda0c71b5e724e709f';
    const host = process.env.GREEN_API_HOST || 'https://7107.api.greenapi.com';
    const targetPhone = process.env.ADMIN_WHATSAPP_PHONE || '919500171980';

    return { idInstance, tokenInstance, host, targetPhone };
};

/**
 * Format phone number to Green-API chatId format (e.g. 919500171980@c.us)
 */
const formatChatId = (phone) => {
    if (!phone) return null;
    const cleaned = String(phone).replace(/\D/g, '');
    if (!cleaned) return null;
    const formatted = cleaned.length === 10 ? `91${cleaned}` : cleaned;
    return `${formatted}@c.us`;
};

/**
 * Format date into Indian Standard Time (IST) e.g. "02 Oct 2026, 02:05 AM"
 */
const formatIstDateTime = (dateVal) => {
    try {
        const date = new Date(dateVal || Date.now());
        if (isNaN(date.getTime())) return 'N/A';
        return date.toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    } catch (e) {
        return 'N/A';
    }
};

/**
 * Format scheduled delivery time range cleanly (e.g. "11 PM - 12 AM" or "Instant Delivery")
 */
const formatScheduledTime = (rawTime) => {
    if (!rawTime) return 'Instant Delivery';
    const strTime = String(rawTime).trim();
    if (!strTime || strTime.toLowerCase().includes('instant')) return 'Instant Delivery';

    // Handle "2026-10-02T10:00|10:00" format
    if (strTime.includes('|')) {
        const parts = strTime.split('|');
        const timePart = parts[1] || parts[0];
        const [hours, minutes] = timePart.split(':');
        const hStart = parseInt(hours, 10);
        if (!isNaN(hStart)) {
            const formatShortTime = (h, m) => {
                const ampm = h >= 12 ? 'PM' : 'AM';
                const h12 = h % 12 || 12;
                const mStr = parseInt(m, 10) === 0 ? '' : `:${m}`;
                return `${h12}${mStr} ${ampm}`;
            };
            const hEnd = (hStart + 1) % 24;
            return `${formatShortTime(hStart, minutes || '00')} - ${formatShortTime(hEnd, minutes || '00')}`;
        }
    }

    // Handle ISO date string
    const date = new Date(strTime);
    if (!isNaN(date.getTime())) {
        const istTimeString = date.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour12: false, hour: '2-digit', minute: '2-digit' });
        const [hours, minutes] = istTimeString.split(':');
        const hStart = parseInt(hours, 10);
        const hEnd = (hStart + 1) % 24;
        const formatShortTime = (h, m) => {
            const ampm = h >= 12 ? 'PM' : 'AM';
            const h12 = h % 12 || 12;
            const mStr = parseInt(m, 10) === 0 ? '' : `:${m}`;
            return `${h12}${mStr} ${ampm}`;
        };
        return `${formatShortTime(hStart, minutes || '00')} - ${formatShortTime(hEnd, minutes || '00')}`;
    }

    return strTime;
};

/**
 * Format Payment Method cleanly (e.g. "Cash on Delivery (COD)" or "Online Payment (Paid)")
 */
const formatPaymentMethod = (paymentMethod, isPaid) => {
    let methodStr = 'Cash on Delivery (COD)';

    if (typeof paymentMethod === 'object' && paymentMethod !== null) {
        methodStr = paymentMethod.type || paymentMethod.name || paymentMethod.method || 'COD';
    } else if (typeof paymentMethod === 'string' && paymentMethod.trim()) {
        methodStr = paymentMethod.trim();
    }

    if (isPaid || methodStr.toLowerCase().includes('online')) {
        return 'Online Payment ✅ (Paid)';
    }

    return `${methodStr} 💵`;
};

/**
 * Core function to send WhatsApp message via Green-API
 */
export const sendGreenApiMessage = async (targetPhone, messageText) => {
    const { idInstance, tokenInstance, host } = getGreenApiCredentials();

    if (!idInstance || !tokenInstance) {
        console.warn('⚠️ WhatsApp notification skipped: Missing Green-API credentials');
        return { success: false, reason: 'Missing Green-API credentials' };
    }

    const chatId = formatChatId(targetPhone);
    if (!chatId) {
        console.warn('⚠️ WhatsApp notification skipped: Invalid target phone number');
        return { success: false, reason: 'Invalid phone number' };
    }

    const endpoint = `${host}/waInstance${idInstance}/sendMessage/${tokenInstance}`;

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                chatId,
                message: messageText
            })
        });

        const data = await response.json();

        if (response.ok && data.idMessage) {
            console.log(`💬 [Green-API WhatsApp] Message sent to ${chatId} (ID: ${data.idMessage})`);
            return { success: true, idMessage: data.idMessage };
        } else {
            console.warn(`⚠️ [Green-API WhatsApp] API warning:`, data);
            return { success: false, error: data };
        }
    } catch (error) {
        console.error('❌ [Green-API WhatsApp] Error sending message:', error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Send WhatsApp notification when a new order is placed or updated
 */
export const sendOrderWhatsAppNotification = async (order, eventType = 'created') => {
    try {
        const { targetPhone } = getGreenApiCredentials();

        const shippingAddr = order.shippingAddress || {};
        const customerName = shippingAddr.name || order.user?.name || 'Customer';
        const customerMobile = shippingAddr.mobile || order.user?.mobile || 'N/A';
        const fullAddress = [shippingAddr.street, shippingAddr.city, shippingAddr.zip].filter(Boolean).join(', ') || 'N/A';
        const orderId = order._id?.toString().slice(-8).toUpperCase() || 'ORDER';

        const orderedAtIST = formatIstDateTime(order.createdAt || Date.now());
        const rawDeliveryTime = order.scheduledDeliveryTime || order.deliveryTime || shippingAddr.deliveryTime;
        const scheduledTimeFormatted = formatScheduledTime(rawDeliveryTime);
        const paymentFormatted = formatPaymentMethod(order.paymentMethod, order.isPaid);

        // Format delivery charge cleanly
        const shippingFee = Number(order.shipping ?? order.shippingFee ?? order.deliveryCharge ?? 0);
        let shippingText = `₹${shippingFee}`;
        if (shippingFee === 0) {
            const hasGold = (order.items || []).some(i => i.isGold);
            shippingText = hasGold ? 'FREE ⚡ (Gold Product)' : 'FREE 🪙 (Coin Applied)';
        }

        const subtotal = Number(order.subtotal || 0);
        const discount = Number(order.discount || 0);
        const total = Number(order.total || (subtotal + (shippingFee === 0 ? 0 : shippingFee) - discount));

        let header = '📦 *New Order Placed on ILY-mart!*';
        if (eventType === 'status_updated') {
            header = `🔄 *Order Status Updated: ${order.status}*`;
        } else if (eventType === 'cancelled') {
            header = '❌ *Order Cancelled!*';
        }

        const itemsList = (order.items || [])
            .map(item => {
                const unitStr = (item.unit || item.product?.unit || item.weight || '').trim();
                const unitTag = unitStr ? ` (${unitStr})` : '';
                return `- ${item.quantity || 1}x ${item.name || item.product?.title || 'Item'}${unitTag} (₹${item.price || 0})`;
            })
            .join('\n');

        let mapsLink = '';
        const locationStr = shippingAddr.location || order.user?.location || '';
        if (locationStr) {
            if (locationStr.startsWith('http://') || locationStr.startsWith('https://')) {
                mapsLink = `\n📍 *Map Location:* ${locationStr}`;
            } else if (locationStr.includes(',')) {
                mapsLink = `\n📍 *Map Location:* https://www.google.com/maps?q=${locationStr.replace(/\s/g, '')}`;
            }
        }

        const messageText = `
${header}
----------------------------------
🆔 *Order ID:* #${orderId}
📅 *Ordered Time:* ${orderedAtIST}
⏰ *Scheduled Delivery:* ${scheduledTimeFormatted}

👤 *Customer Details:*
- Name: ${customerName}
- Mobile: ${customerMobile}
- Address: ${fullAddress}${mapsLink}

💳 *Payment & Bill Breakdown:*
- Subtotal: ₹${subtotal.toFixed(0)}
- Delivery Charge: ${shippingText}
${discount > 0 ? `- Discount: -₹${discount.toFixed(0)}\n` : ''}- *Total Amount:* ₹${total.toFixed(0)}
- Payment Method: ${paymentFormatted}

🛒 *Ordered Items (${(order.items || []).length}):*
${itemsList}

----------------------------------
_ILY-mart Real-Time WhatsApp Alert_
`.trim();

        // Send to Admin
        await sendGreenApiMessage(targetPhone, messageText);

        // Send confirmation to Customer if valid mobile exists and is different from admin phone
        if (customerMobile && customerMobile !== 'N/A' && customerMobile !== targetPhone) {
            await sendGreenApiMessage(customerMobile, messageText);
        }

        return { success: true };
    } catch (error) {
        console.error('❌ Failed to process WhatsApp order notification:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Send WhatsApp notification when a service request is placed
 */
export const sendServiceRequestWhatsAppNotification = async (serviceRequest) => {
    try {
        const { targetPhone } = getGreenApiCredentials();

        const customerName = serviceRequest.user?.name || 'Customer';
        const customerMobile = serviceRequest.user?.mobile || 'N/A';
        const serviceName = serviceRequest.service?.name || serviceRequest.serviceTitle || 'Service';
        const location = serviceRequest.location || 'N/A';
        const requestedAtIST = formatIstDateTime(serviceRequest.createdAt || Date.now());

        let mapsLink = '';
        if (location && (location.startsWith('http://') || location.startsWith('https://'))) {
            mapsLink = `\n📍 *Map Location:* ${location}`;
        } else if (location && location.includes(',')) {
            mapsLink = `\n📍 *Map Location:* https://www.google.com/maps?q=${location.replace(/\s/g, '')}`;
        }

        const messageText = `
🔧 *New Service Request Received!*
----------------------------------
📅 *Requested Time:* ${requestedAtIST}
🔧 *Service:* ${serviceName}

👤 *Customer Details:*
- Name: ${customerName}
- Mobile: ${customerMobile}
- Location: ${location}${mapsLink}

----------------------------------
_ILY-mart Direct WhatsApp Alert_
`.trim();

        return await sendGreenApiMessage(targetPhone, messageText);
    } catch (error) {
        console.error('❌ Failed to process WhatsApp service request notification:', error);
        return { success: false, error: error.message };
    }
};
