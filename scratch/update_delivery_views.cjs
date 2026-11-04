const fs = require('fs');

// 1. DeliveryDashboard.jsx
let dd = fs.readFileSync('src/pages/admin/DeliveryDashboard.jsx', 'utf8');

// Update import
dd = dd.replace(
    'setOverlayAuthToken \r\n} from \'../../utils/floatingOverlay\';',
    'setOverlayAuthToken,\r\n    setOverlayHasAcceptedOrder\r\n} from \'../../utils/floatingOverlay\';'
);
dd = dd.replace(
    'setOverlayAuthToken \n} from \'../../utils/floatingOverlay\';',
    'setOverlayAuthToken,\n    setOverlayHasAcceptedOrder\n} from \'../../utils/floatingOverlay\';'
);

// Add hasAcceptedCard and effect
const oldOverlayHook = `    // Porter Partner Style Floating Logo: check permission & listen to app state change
    useEffect(() => {
        let isMounted = true;
        let appStateListener = null;

        const initOverlay = async () => {
            if (!isNativeAndroid()) return;

            const granted = await checkOverlayPermission();
            if (isMounted) {
                setHasOverlayPermission(granted);
            }

            // Sync auth token with native background service so orders poll when closed
            const currentToken = localStorage.getItem('authToken');
            if (currentToken) {
                setOverlayAuthToken(currentToken);
            }

            if (isFloatingEnabled && granted) {
                showFloatingOverlay();
            }

            try {
                const { App } = await import('@capacitor/app');
                appStateListener = await App.addListener('appStateChange', ({ isActive }) => {
                    const enabled = localStorage.getItem('delivery_floating_overlay_enabled') !== 'false';
                    if (!isActive) {
                        // When app is closed/minimized -> show floating logo only if enabled
                        if (enabled) {
                            showFloatingOverlay();
                        }
                    } else {
                        // When app is reopened -> hide floating logo
                        hideFloatingOverlay();
                    }
                });
            } catch (err) {
                console.warn('Error setting up overlay appStateListener:', err);
            }
        };

        initOverlay();

        return () => {
            isMounted = false;
            if (appStateListener && appStateListener.remove) {
                appStateListener.remove();
            }
            hideFloatingOverlay();
        };
    }, []);`;

const newOverlayHook = `    // Check if there is an accepted delivery card in the panel (Out for Delivery, Shipped, Accepted)
    const hasAcceptedCard = useMemo(() => {
        return orders.some(o => ['Accepted', 'Out for Delivery', 'Shipped'].includes(o.status));
    }, [orders]);

    // Keep native overlay accepted order state synced whenever orders change
    useEffect(() => {
        if (!isNativeAndroid()) return;
        setOverlayHasAcceptedOrder(hasAcceptedCard);
        if (!hasAcceptedCard) {
            hideFloatingOverlay();
        }
    }, [hasAcceptedCard]);

    // Porter Partner Style Floating Logo: check permission & listen to app state change
    useEffect(() => {
        let isMounted = true;
        let appStateListener = null;

        const initOverlay = async () => {
            if (!isNativeAndroid()) return;

            const granted = await checkOverlayPermission();
            if (isMounted) {
                setHasOverlayPermission(granted);
            }

            // Sync auth token with native background service so orders poll when closed
            const currentToken = localStorage.getItem('authToken');
            if (currentToken) {
                setOverlayAuthToken(currentToken);
            }

            // Only show floating overlay if enabled AND there is an accepted order
            if (isFloatingEnabled && granted && hasAcceptedCard) {
                showFloatingOverlay();
            } else {
                hideFloatingOverlay();
            }

            try {
                const { App } = await import('@capacitor/app');
                appStateListener = await App.addListener('appStateChange', ({ isActive }) => {
                    const enabled = localStorage.getItem('delivery_floating_overlay_enabled') !== 'false';
                    if (!isActive) {
                        // When app is closed/minimized -> show floating logo ONLY if enabled AND there is an accepted card
                        if (enabled && hasAcceptedCard) {
                            showFloatingOverlay();
                        } else {
                            hideFloatingOverlay();
                        }
                    } else {
                        // When app is reopened -> hide floating logo
                        hideFloatingOverlay();
                    }
                });
            } catch (err) {
                console.warn('Error setting up overlay appStateListener:', err);
            }
        };

        initOverlay();

        return () => {
            isMounted = false;
            if (appStateListener && appStateListener.remove) {
                appStateListener.remove();
            }
            hideFloatingOverlay();
        };
    }, [hasAcceptedCard, isFloatingEnabled]);`;

if (dd.includes(oldOverlayHook)) {
    dd = dd.replace(oldOverlayHook, newOverlayHook);
} else {
    dd = dd.replace(oldOverlayHook.replace(/\r\n/g, '\n'), newOverlayHook.replace(/\r\n/g, '\n'));
}

// Update toggleFloatingOverlay
const oldToggle = `            if (isFloatingEnabled) {
                await showFloatingOverlay();
            }`;
const newToggle = `            if (hasAcceptedCard) {
                await showFloatingOverlay();
            }`;
dd = dd.replace(oldToggle, newToggle);

fs.writeFileSync('src/pages/admin/DeliveryDashboard.jsx', dd, 'utf8');
console.log('Updated DeliveryDashboard.jsx');

// 2. DeliveryActiveOrder.jsx
let dao = fs.readFileSync('src/pages/admin/DeliveryActiveOrder.jsx', 'utf8');
if (!dao.includes('setOverlayHasAcceptedOrder')) {
    dao = dao.replace(
        "import { playSuccessSound } from '../../utils/soundHelper';",
        "import { playSuccessSound } from '../../utils/soundHelper';\r\nimport { isNativeAndroid, setOverlayHasAcceptedOrder, hideFloatingOverlay } from '../../utils/floatingOverlay';"
    );
    const syncHook = `
    const isAcceptedOrder = useMemo(() => {
        const curStatus = localStatus || singleOrder?.status;
        return ['Accepted', 'Out for Delivery', 'Shipped'].includes(curStatus);
    }, [localStatus, singleOrder?.status]);

    useEffect(() => {
        if (!isNativeAndroid()) return;
        setOverlayHasAcceptedOrder(isAcceptedOrder);
        if (!isAcceptedOrder) {
            hideFloatingOverlay();
        }
    }, [isAcceptedOrder]);
`;
    dao = dao.replace('const [popupState, setPopupState] = useState({', syncHook + '\n    const [popupState, setPopupState] = useState({');
    fs.writeFileSync('src/pages/admin/DeliveryActiveOrder.jsx', dao, 'utf8');
    console.log('Updated DeliveryActiveOrder.jsx');
}
