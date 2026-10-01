// Green-API WhatsApp Notification Service
// Sends instant direct WhatsApp messages to admin/store owner on order creation & service requests

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
    // Add India country code 91 if 10 digits
    const formatted = cleaned.length === 10 ? `91${cleaned}` : cleaned;
    return `${formatted}@c.us`;
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

        let header = '📦 *New Order Placed on ILY-mart!*';
        if (eventType === 'status_updated') {
            header = `🔄 *Order Status Updated: ${order.status}*`;
        } else if (eventType === 'cancelled') {
            header = '❌ *Order Cancelled!*';
        }

        const itemsList = (order.items || [])
            .map(item => `- ${item.quantity || 1}x ${item.name || item.product?.title || 'Item'} (₹${item.price || 0})`)
            .join('\n');

        const messageText = `
${header}
----------------------------------
*Order ID:* #${orderId}
*Customer:* ${customerName}
*Mobile:* ${customerMobile}
*Address:* ${fullAddress}
*Total:* ₹${(order.total || 0).toFixed(0)}
*Payment:* ${order.paymentMethod || 'COD'}
*Schedule:* ${order.scheduledDeliveryTime || 'Standard'}

🛒 *Items:*
${itemsList}

----------------------------------
_ILY-mart Direct WhatsApp Notification_
`.trim();

        // Send to Admin
        await sendGreenApiMessage(targetPhone, messageText);

        // Optionally send confirmation to Customer if customer mobile exists
        if (customerMobile && customerMobile !== targetPhone) {
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

        const messageText = `
🔧 *New Service Request Received!*
----------------------------------
*Service:* ${serviceName}
*Customer:* ${customerName}
*Mobile:* ${customerMobile}
*Location:* ${location}

----------------------------------
_ILY-mart Direct WhatsApp Notification_
`.trim();

        return await sendGreenApiMessage(targetPhone, messageText);
    } catch (error) {
        console.error('❌ Failed to process WhatsApp service request notification:', error);
        return { success: false, error: error.message };
    }
};
