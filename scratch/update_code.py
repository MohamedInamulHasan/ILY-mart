import re

# 1. Update src/components/NotificationOverlay.jsx
with open('src/components/NotificationOverlay.jsx', 'r', encoding='utf-8') as f:
    notif_code = f.read()

# Replace handleOrderCreated block
pattern = r'        const handleOrderCreated = \(order\) => \{.*?        \};'
replacement = '''        const handleOrderCreated = (order) => {
            // Strictly only for Delivery Boys, NOT for customers or other roles
            if (!isDeliveryBoy) return;

            // Invalidate orders cache so new order list card immediately appears in the Delivery Panel screen
            queryClient.invalidateQueries({ queryKey: ['orders'] });

            // Play notification chime and vibrate to notify the delivery boy without disrupting their screen
            playSuccessSound();
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate([200, 100, 200]);
            }

            // Only show OS desktop/mobile push notification if the app is minimized/hidden in background
            if (typeof document !== 'undefined' && document.hidden && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                try {
                    const orderIdShort = String(order._id || order.id || '000').slice(-6).toUpperCase();
                    const notif = new Notification(`🚨 New Delivery Order #${orderIdShort} - ₹${order.total || order.subtotal || 0}`, {
                        body: `Pickup: ${order.items?.[0]?.storeName || 'Store'} → Drop: ${order.shippingAddress?.street || 'Customer'}`,
                        icon: '/floating-logo.jpg',
                        tag: `delivery-${order._id}`
                    });
                    notif.onclick = () => {
                        window.focus();
                        navigate('/admin');
                    };
                } catch (err) {
                    console.warn('System notification error:', err);
                }
            }
        };'''

notif_code = re.sub(pattern, replacement, notif_code, count=1, flags=re.DOTALL)

with open('src/components/NotificationOverlay.jsx', 'w', encoding='utf-8') as f:
    f.write(notif_code)

print("NotificationOverlay updated successfully!")

