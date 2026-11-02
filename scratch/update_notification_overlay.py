with open('src/components/NotificationOverlay.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

target = """import { triggerIncomingOrderAlert, showPorterOrderCard, dismissPorterOrderCard } from '../utils/floatingOverlay';
import { apiService } from '../utils/api';"""

replacement = """import { triggerIncomingOrderAlert, showPorterOrderCard, dismissPorterOrderCard } from '../utils/floatingOverlay';
import { apiService } from '../utils/api';
import { registerModalBackHandler } from '../utils/useBackButton';"""

target2 = """    useEffect(() => {
        // Request system notification permission for delivery boys"""

replacement2 = """    useEffect(() => {
        if (!incomingOrder) return;
        return registerModalBackHandler(() => setIncomingOrder(null));
    }, [incomingOrder]);

    useEffect(() => {
        // Request system notification permission for delivery boys"""

old_handler = """        const handleOrderCreated = (order) => {
            // Show Porter-style full incoming order alert ONLY to Delivery Boys
            if (isDeliveryBoy) {
                setIncomingOrder(order);
                const isFloatingAlertEnabled = localStorage.getItem('delivery_floating_overlay_enabled') !== 'false';
                if (isFloatingAlertEnabled) {
                    triggerIncomingOrderAlert();
                    showPorterOrderCard(order);
                }

                // Show Native System Notification (pops up outside browser if minimized)
                if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                    try {
                        const orderIdShort = String(order._id || order.id || '000').slice(-6).toUpperCase();
                        const notif = new Notification(`🚨 New Delivery Order #${orderIdShort} - ₹${order.total || order.subtotal || 0}`, {
                            body: `Pickup: ${order.items?.[0]?.storeName || 'Store'} → Drop: ${order.shippingAddress?.street || 'Customer'}`,
                            icon: '/favicon.ico',
                            requireInteraction: true,
                            tag: `delivery-${order._id}`
                        });
                        notif.onclick = () => {
                            window.focus();
                            setIncomingOrder(order);
                        };
                    } catch (err) {
                        console.warn('System notification error:', err);
                    }
                }
            } else if (isAdmin) {
                // Admins who are not delivery boys receive a standard quiet notification toast
                addNotification({
                    id: Date.now(),
                    type: 'new_order',
                    title: t('New Order Received!'),
                    message: `${t('Order')} #${String(order._id || order.id).slice(-6).toUpperCase()} ${t('from')} ${order.shippingAddress?.name || t('Guest')}`,
                    icon: <Bell className="text-orange-500" />,
                    onClick: () => navigate('/admin')
                });
            }
        };"""

new_handler = """        const handleOrderCreated = (order) => {
            // Show Porter-style incoming order alert to Delivery Boys and Admins
            if (isDeliveryBoy || isAdmin) {
                setIncomingOrder(order);
                const isFloatingAlertEnabled = localStorage.getItem('delivery_floating_overlay_enabled') !== 'false';
                if (isFloatingAlertEnabled) {
                    triggerIncomingOrderAlert();
                    showPorterOrderCard(order);
                }

                // Show Native System Notification (pops up outside browser if minimized)
                if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                    try {
                        const orderIdShort = String(order._id || order.id || '000').slice(-6).toUpperCase();
                        const notif = new Notification(`🚨 New Delivery Order #${orderIdShort} - ₹${order.total || order.subtotal || 0}`, {
                            body: `Pickup: ${order.items?.[0]?.storeName || 'Store'} → Drop: ${order.shippingAddress?.street || 'Customer'}`,
                            icon: '/floating-logo.jpg',
                            requireInteraction: true,
                            tag: `delivery-${order._id}`
                        });
                        notif.onclick = () => {
                            window.focus();
                            setIncomingOrder(order);
                        };
                    } catch (err) {
                        console.warn('System notification error:', err);
                    }
                }
            }
        };"""

if target in text and target2 in text and old_handler in text:
    text = text.replace(target, replacement, 1)
    text = text.replace(target2, replacement2, 1)
    text = text.replace(old_handler, new_handler, 1)
    with open('src/components/NotificationOverlay.jsx', 'w', encoding='utf-8') as f:
        f.write(text)
    print('SUCCESS')
else:
    print('FAILED: one of the targets not found')

