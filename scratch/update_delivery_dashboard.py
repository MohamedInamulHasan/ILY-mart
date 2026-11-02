import re

with open('src/pages/admin/DeliveryDashboard.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Imports
if "import { useSocket } from '../../context/SocketContext';" not in code:
    code = code.replace(
        "import { useLanguage } from '../../context/LanguageContext';",
        "import { useLanguage } from '../../context/LanguageContext';\nimport { useSocket } from '../../context/SocketContext';\nimport { useQueryClient } from '@tanstack/react-query';"
    )

# 2. Hooks in component
old_hooks = "    const { logout, user } = useAuth();\n    const { t, language } = useLanguage();"
new_hooks = "    const { logout, user } = useAuth();\n    const { t, language } = useLanguage();\n    const { socket } = useSocket();\n    const queryClient = useQueryClient();"
code = code.replace(old_hooks, new_hooks)

# 3. Socket listener effect
socket_effect = """
    // Listen for incoming orders in real-time to alert delivery boy and refresh list
    useEffect(() => {
        if (!socket) return;
        const handleNewOrder = () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            playSuccessSound();
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate([200, 100, 200]);
            }
        };
        socket.on('order:created', handleNewOrder);
        return () => socket.off('order:created', handleNewOrder);
    }, [socket, queryClient]);
"""

# Place after line "const [isFloatingEnabled, setIsFloatingEnabled] = useState" effect
code = code.replace(
    "    const [isFloatingEnabled, setIsFloatingEnabled] = useState(() => {",
    socket_effect + "\n    const [isFloatingEnabled, setIsFloatingEnabled] = useState(() => {"
)

# 4. pendingOrdersCount
code = code.replace(
    "const pendingOrdersCount = orders.filter(o => ['Processing', 'Pending'].includes(o.status)).length;",
    "const pendingOrdersCount = orders.filter(o => ['Processing', 'Pending', 'Order Placed'].includes(o.status)).length;"
)

# 5. displayOrders
old_display = """    // Filter to Out for Delivery order cards in delivery panel
    const displayOrders = orders
        .filter(order => {
            // "only put the out for delivery order cards in the delivery panel"
            if (!['Out for Delivery', 'Shipped'].includes(order.status)) return false;

            if (!searchQuery) return true;
            const q = searchQuery.toLowerCase();
            const orderId = String(order._id || order.id).toLowerCase();
            const customerName = (order.shippingAddress?.name || order.user || '').toLowerCase();
            const customerMobile = (order.shippingAddress?.mobile || '').toLowerCase();
            return orderId.includes(q) || customerName.includes(q) || customerMobile.includes(q) ||
                order.items?.some(item => (item.name || '').toLowerCase().includes(q));
        })
        .slice()
        .sort((a, b) => getOrderTimeMs(a) - getOrderTimeMs(b));"""

new_display = """    // Filter to delivery order cards in delivery panel
    const displayOrders = orders
        .filter(order => {
            // Include newly placed orders (Pending, Processing, Order Placed) and active deliveries (Out for Delivery, Shipped)
            if (!['Pending', 'Processing', 'Order Placed', 'Out for Delivery', 'Shipped'].includes(order.status)) return false;

            if (!searchQuery) return true;
            const q = searchQuery.toLowerCase();
            const orderId = String(order._id || order.id).toLowerCase();
            const customerName = (order.shippingAddress?.name || order.user || '').toLowerCase();
            const customerMobile = (order.shippingAddress?.mobile || '').toLowerCase();
            return orderId.includes(q) || customerName.includes(q) || customerMobile.includes(q) ||
                order.items?.some(item => (item.name || '').toLowerCase().includes(q));
        })
        .slice()
        .sort((a, b) => {
            // New orders (Pending/Processing) prioritized at the top of the list!
            const aIsPending = ['Pending', 'Processing', 'Order Placed'].includes(a.status);
            const bIsPending = ['Pending', 'Processing', 'Order Placed'].includes(b.status);
            if (aIsPending && !bIsPending) return -1;
            if (!aIsPending && bIsPending) return 1;

            // Within same status group, sort newest first so latest orders are at the top
            return getOrderTimeMs(b) - getOrderTimeMs(a);
        });"""

code = code.replace(old_display, new_display)

with open('src/pages/admin/DeliveryDashboard.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("DeliveryDashboard.jsx updated successfully!")
