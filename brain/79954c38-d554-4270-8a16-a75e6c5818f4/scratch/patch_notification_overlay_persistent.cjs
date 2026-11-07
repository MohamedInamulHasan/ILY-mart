const fs = require('fs');
const path = 'src/components/NotificationOverlay.jsx';
let content = fs.readFileSync(path, 'utf8').replace(/\r\n/g, '\n');

const oldEffect = `    // Auto-dismiss in-app modal if the order is no longer pending/processing (e.g. taken by another driver or cancelled)
    useEffect(() => {
        if (!incomingOrder) return;
        const currentInList = allOrders.find(o => (o._id || o.id) === (incomingOrder._id || incomingOrder.id));
        if (currentInList) {
            const s = String(currentInList.status || '').toLowerCase().trim();
            if (s !== 'pending' && s !== 'processing' && s !== 'order placed' && s !== 'confirmed') {
                setIncomingOrder(null);
            }
        }
    }, [allOrders, incomingOrder]);

    const handleOrderSkip = () => {
        setIncomingOrder(null);
    };

    const handleModalClose = () => {
        setIncomingOrder(null);
    };`;

const newEffect = `    // Helper to check if order is processing
    const isProcessingStatus = (status) => {
        const s = String(status || '').toLowerCase().trim();
        return s === 'pending' || s === 'processing' || s === 'order placed' || s === 'confirmed';
    };

    // Filter processing orders for delivery boy
    const processingOrders = useMemo(() => {
        if (!isDeliveryBoy) return [];
        return allOrders.filter(o => isProcessingStatus(o.status));
    }, [allOrders, isDeliveryBoy]);

    // Keep delivery alert showing in mobile screen until there is NO processing card in the panel
    useEffect(() => {
        if (!isDeliveryBoy) return;

        if (processingOrders.length === 0) {
            if (incomingOrder) setIncomingOrder(null);
            return;
        }

        const currentId = incomingOrder ? (incomingOrder._id || incomingOrder.id) : null;
        const stillProcessing = currentId && processingOrders.some(o => (o._id || o.id) === currentId);

        if (!stillProcessing) {
            setIncomingOrder(processingOrders[0]);
            triggerIncomingOrderAlert();
        }
    }, [isDeliveryBoy, processingOrders, incomingOrder]);

    const handleOrderSkip = () => {
        const currentId = incomingOrder ? (incomingOrder._id || incomingOrder.id) : null;
        const remaining = processingOrders.filter(o => (o._id || o.id) !== currentId);
        if (remaining.length > 0) {
            setIncomingOrder(remaining[0]);
        } else if (processingOrders.length > 0) {
            setIncomingOrder(processingOrders[0]);
        } else {
            setIncomingOrder(null);
        }
    };

    const handleModalClose = () => {
        const currentId = incomingOrder ? (incomingOrder._id || incomingOrder.id) : null;
        const remaining = processingOrders.filter(o => (o._id || o.id) !== currentId);
        if (remaining.length > 0) {
            setIncomingOrder(remaining[0]);
        } else if (processingOrders.length > 0) {
            setIncomingOrder(processingOrders[0]);
        } else {
            setIncomingOrder(null);
        }
    };`;

if (content.includes(oldEffect)) {
    content = content.replace(oldEffect, newEffect);
    fs.writeFileSync(path, content, 'utf8');
    console.log('SUCCESS: patched NotificationOverlay with persistent processing alert');
} else {
    console.log('WARNING: oldEffect not found in NotificationOverlay');
}
