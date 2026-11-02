# Update DeliveryDashboard.jsx
with open('src/pages/admin/DeliveryDashboard.jsx', 'r', encoding='utf-8') as f:
    dd_code = f.read().replace('\r\n', '\n')

dd_import_target = """import { 
    isNativeAndroid, 
    checkOverlayPermission, 
    requestOverlayPermission, 
    showFloatingOverlay, 
    hideFloatingOverlay 
} from '../../utils/floatingOverlay';"""

dd_import_replace = """import { 
    isNativeAndroid, 
    checkOverlayPermission, 
    requestOverlayPermission, 
    showFloatingOverlay, 
    hideFloatingOverlay,
    setOverlayAuthToken 
} from '../../utils/floatingOverlay';"""

dd_init_target = """            const granted = await checkOverlayPermission();
            if (isMounted) {
                setHasOverlayPermission(granted);
            }"""

dd_init_replace = """            const granted = await checkOverlayPermission();
            if (isMounted) {
                setHasOverlayPermission(granted);
            }

            // Sync auth token with native background service so orders poll when closed
            const currentToken = localStorage.getItem('authToken');
            if (currentToken) {
                setOverlayAuthToken(currentToken);
            }"""

assert dd_import_target in dd_code, "dd_import_target not found"
assert dd_init_target in dd_code, "dd_init_target not found"

dd_code = dd_code.replace(dd_import_target, dd_import_replace).replace(dd_init_target, dd_init_replace)

with open('src/pages/admin/DeliveryDashboard.jsx', 'w', encoding='utf-8') as f:
    f.write(dd_code)

print("DeliveryDashboard.jsx updated successfully")

# Update NotificationOverlay.jsx
with open('src/components/NotificationOverlay.jsx', 'r', encoding='utf-8') as f:
    notif_code = f.read().replace('\r\n', '\n')

notif_import_target = """import { triggerIncomingOrderAlert } from '../utils/floatingOverlay';"""
notif_import_replace = """import { triggerIncomingOrderAlert, showPorterOrderCard, dismissPorterOrderCard } from '../utils/floatingOverlay';
import { apiService } from '../utils/api';"""

notif_native_listener_target = """    useEffect(() => {
        // Allows testing the Porter-style incoming order modal"""

notif_native_listener_replace = """    // Listen for native intent/card clicks when app was closed/backgrounded
    useEffect(() => {
        const handleNativeOpenOrder = async (e) => {
            const orderId = e.detail?.id;
            if (!orderId) return;
            try {
                const res = await apiService.getOrder(orderId);
                if (res.success && res.data) {
                    setIncomingOrder(res.data);
                }
            } catch (err) {
                console.warn('Failed to fetch order from native event:', err);
            }
        };

        window.addEventListener('native:open-order', handleNativeOpenOrder);
        return () => window.removeEventListener('native:open-order', handleNativeOpenOrder);
    }, []);

    useEffect(() => {
        // Allows testing the Porter-style incoming order modal"""

notif_created_target = """        const handleOrderCreated = (order) => {
            // Show Porter-style full incoming order alert ONLY to Delivery Boys
            if (isDeliveryBoy) {
                setIncomingOrder(order);
                triggerIncomingOrderAlert();"""

notif_created_replace = """        const handleOrderCreated = (order) => {
            // Show Porter-style full incoming order alert ONLY to Delivery Boys
            if (isDeliveryBoy) {
                setIncomingOrder(order);
                triggerIncomingOrderAlert();
                showPorterOrderCard(order);"""

assert notif_import_target in notif_code, "notif_import_target not found"
assert notif_native_listener_target in notif_code, "notif_native_listener_target not found"
assert notif_created_target in notif_code, "notif_created_target not found"

notif_code = notif_code.replace(notif_import_target, notif_import_replace)
notif_code = notif_code.replace(notif_native_listener_target, notif_native_listener_replace)
notif_code = notif_code.replace(notif_created_target, notif_created_replace)

with open('src/components/NotificationOverlay.jsx', 'w', encoding='utf-8') as f:
    f.write(notif_code)

print("NotificationOverlay.jsx updated successfully")
