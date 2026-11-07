const fs = require('fs');
const path = 'src/components/NotificationOverlay.jsx';
let content = fs.readFileSync(path, 'utf8');

const oldBlock = `        const handleOrderUpdated = (order) => {
            // Only show notification to the user who owns the order
            if (user && order.user === user._id) {
                addNotification({
                    id: Date.now(),
                    type: 'order_status',
                    title: t('Order Status Update'),
                    message: \`\${t('Order')} #\${order._id.slice(-6)} \${t('is now')} \${t(order.status)}\`,
                    icon: order.status === 'Out for Delivery' ? <Truck className="text-blue-500" /> : <Package className="text-green-500" />,
                    onClick: () => navigate(\`/orders/\${order._id}\`)
                });
            }
        };`;

const newBlock = `        const handleOrderUpdated = (order) => {
            // Only show notification to the user who owns the order
            if (user && order.user === user._id) {
                // Play distinct sound based on order status
                const st = String(order.status || '').toLowerCase();
                if (st === 'out for delivery' || st === 'shipped' || st.includes('accept') || st.includes('processing') || st.includes('confirmed')) {
                    playOrderAcceptedSound();
                } else if (st.includes('deliver') || st.includes('completed')) {
                    playOrderDeliveredSound();
                } else if (st.includes('cancel')) {
                    playOrderCancelledSound();
                } else {
                    playSuccessSound();
                }

                addNotification({
                    id: Date.now(),
                    type: 'order_status',
                    title: t('Order Status Update'),
                    message: \`\${t('Order')} #\${order._id.slice(-6)} \${t('is now')} \${t(order.status)}\`,
                    icon: order.status === 'Out for Delivery' ? <Truck className="text-blue-500" /> : <Package className="text-green-500" />,
                    onClick: () => navigate(\`/orders/\${order._id}\`)
                });
            }
        };`;

if (content.includes(oldBlock.trim().split('\n')[0].trim())) {
    // Try normalized replace
    const normalizedOld = oldBlock.replace(/\r\n/g, '\n');
    const normalizedContent = content.replace(/\r\n/g, '\n');
    if (normalizedContent.includes(normalizedOld)) {
        const result = normalizedContent.replace(normalizedOld, newBlock);
        fs.writeFileSync(path, result, 'utf8');
        console.log('SUCCESS: replaced handleOrderUpdated block');
    } else {
        console.log('Could not find exact block. Searching for key lines...');
        // Manual approach: inject sound calls before addNotification
        const marker = "if (user && order.user === user._id) {";
        const addNotifMarker = "addNotification({";
        
        let idx = normalizedContent.indexOf(marker);
        if (idx !== -1) {
            // Find the addNotification after this
            let addIdx = normalizedContent.indexOf(addNotifMarker, idx);
            if (addIdx !== -1) {
                const inject = `                // Play distinct sound based on order status
                const st = String(order.status || '').toLowerCase();
                if (st === 'out for delivery' || st === 'shipped' || st.includes('accept') || st.includes('processing') || st.includes('confirmed')) {
                    playOrderAcceptedSound();
                } else if (st.includes('deliver') || st.includes('completed')) {
                    playOrderDeliveredSound();
                } else if (st.includes('cancel')) {
                    playOrderCancelledSound();
                } else {
                    playSuccessSound();
                }\n\n                `;
                const result = normalizedContent.slice(0, addIdx) + inject + normalizedContent.slice(addIdx);
                fs.writeFileSync(path, result, 'utf8');
                console.log('SUCCESS: injected sound calls before addNotification');
            } else {
                console.log('Could not find addNotification marker');
            }
        } else {
            console.log('Could not find user check marker');
        }
    }
} else {
    console.log('Block start not found in file');
    // Show what's around line 197
    const lines = content.split('\n');
    console.log('Lines 195-212:', lines.slice(194, 212).join('\n'));
}
