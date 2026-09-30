// n8n Webhook Integration Service
// Sends real-time non-blocking webhook events to self-hosted or cloud n8n instances
// Allows setting up automated workflows: Telegram/WhatsApp alerts, Google Sheets auto-sync, customer emails, admin reports, etc.

const getWebhookUrl = (specificUrl) => {
    return specificUrl || process.env.N8N_ORDER_WEBHOOK_URL || process.env.N8N_SERVICE_WEBHOOK_URL || process.env.N8N_WEBHOOK_URL;
};

/**
 * Core function to send an HTTP POST request to an n8n Webhook endpoint
 * @param {string} targetUrl 
 * @param {object} payload 
 */
export const sendN8nWebhook = async (targetUrl, payload) => {
    if (!targetUrl) {
        // n8n webhook URL is not configured yet - skip silently
        return { success: false, reason: 'N8N_WEBHOOK_URL not configured' };
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'ILY-mart-Backend/1.5'
            },
            body: JSON.stringify(payload),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
            console.log(`⚡ [n8n] Webhook event "${payload.event}" sent successfully to n8n`);
            return { success: true };
        } else {
            console.warn(`⚠️ [n8n] Webhook responded with status: ${response.status} ${response.statusText}`);
            return { success: false, status: response.status };
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            console.warn('⚠️ [n8n] Webhook request timed out after 5s');
        } else {
            console.error('❌ [n8n] Failed to send webhook event:', error.message);
        }
        return { success: false, error: error.message };
    }
};

/**
 * Send order event to n8n (Order Created, Status Updated, Cancelled)
 * @param {object} order - Mongoose Order object
 * @param {string} eventType - e.g. 'order.created', 'order.status_updated', 'order.cancelled'
 */
export const sendN8nOrderEvent = async (order, eventType = 'order.created') => {
    const targetUrl = getWebhookUrl(process.env.N8N_ORDER_WEBHOOK_URL);
    if (!targetUrl) return { success: false, reason: 'N8N_WEBHOOK_URL not configured' };

    try {
        const customerName = order.shippingAddress?.name || order.user?.name || 'Guest';
        const customerMobile = order.shippingAddress?.mobile || order.user?.mobile || 'N/A';
        const fullAddress = [
            order.shippingAddress?.street,
            order.shippingAddress?.city,
            order.shippingAddress?.zip
        ].filter(Boolean).join(', ') || 'N/A';

        const payload = {
            event: eventType,
            timestamp: new Date().toISOString(),
            data: {
                orderId: order._id?.toString(),
                orderType: order.orderType || 'Store',
                status: order.status || 'Pending',
                subtotal: order.subtotal || 0,
                shipping: order.shipping || 0,
                tax: order.tax || 0,
                discount: order.discount || 0,
                total: order.total || 0,
                paymentMethod: order.paymentMethod || 'COD',
                isPaid: Boolean(order.isPaid),
                scheduledDeliveryTime: order.scheduledDeliveryTime || null,
                deliveredAt: order.deliveredAt || null,
                customer: {
                    id: order.user?._id?.toString() || null,
                    name: customerName,
                    mobile: customerMobile,
                    address: fullAddress,
                    location: order.shippingAddress?.location || order.user?.location || ''
                },
                items: (order.items || []).map(item => ({
                    productId: item.product?._id?.toString() || item.product?.toString() || item.id,
                    name: item.name || item.product?.title || 'Item',
                    quantity: item.quantity || 1,
                    price: item.price || 0,
                    storeName: item.storeName || item.storeId?.name || 'Store',
                    isGold: Boolean(item.isGold)
                }))
            }
        };

        return await sendN8nWebhook(targetUrl, payload);
    } catch (error) {
        console.error('❌ [n8n] Error formatting order event payload:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Send service request event to n8n (Service Created, Status Updated)
 * @param {object} serviceRequest - Mongoose ServiceRequest object
 * @param {string} eventType - e.g. 'service.created', 'service.status_updated'
 */
export const sendN8nServiceRequestEvent = async (serviceRequest, eventType = 'service.created') => {
    const targetUrl = getWebhookUrl(process.env.N8N_SERVICE_WEBHOOK_URL);
    if (!targetUrl) return { success: false, reason: 'N8N_WEBHOOK_URL not configured' };

    try {
        const customerName = serviceRequest.user?.name || 'Customer';
        const customerMobile = serviceRequest.user?.mobile || 'N/A';
        const serviceName = serviceRequest.service?.name || serviceRequest.serviceTitle || 'Service';

        const payload = {
            event: eventType,
            timestamp: new Date().toISOString(),
            data: {
                requestId: serviceRequest._id?.toString(),
                status: serviceRequest.status || 'Pending',
                service: {
                    id: serviceRequest.service?._id?.toString() || serviceRequest.service?.toString(),
                    name: serviceName
                },
                customer: {
                    id: serviceRequest.user?._id?.toString() || null,
                    name: customerName,
                    mobile: customerMobile,
                    location: serviceRequest.location || serviceRequest.user?.location || ''
                },
                items: serviceRequest.items || [],
                createdAt: serviceRequest.createdAt
            }
        };

        return await sendN8nWebhook(targetUrl, payload);
    } catch (error) {
        console.error('❌ [n8n] Error formatting service request event payload:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Send generic event payload to n8n
 * @param {string} eventName 
 * @param {object} data 
 */
export const sendN8nGenericEvent = async (eventName, data) => {
    const targetUrl = getWebhookUrl();
    if (!targetUrl) return { success: false, reason: 'N8N_WEBHOOK_URL not configured' };

    return await sendN8nWebhook(targetUrl, {
        event: eventName,
        timestamp: new Date().toISOString(),
        data
    });
};
