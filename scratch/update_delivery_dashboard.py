with open('src/pages/admin/DeliveryDashboard.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Add registerModalBackHandler import
target1 = """import { 
    isNativeAndroid, 
    checkOverlayPermission, 
    requestOverlayPermission, 
    showFloatingOverlay, 
    hideFloatingOverlay,
    setOverlayAuthToken 
} from '../../utils/floatingOverlay';"""

replacement1 = """import { 
    isNativeAndroid, 
    checkOverlayPermission, 
    requestOverlayPermission, 
    showFloatingOverlay, 
    hideFloatingOverlay,
    setOverlayAuthToken 
} from '../../utils/floatingOverlay';
import { registerModalBackHandler } from '../../utils/useBackButton';"""

# 2. Add back handlers and overlay starter
target2 = """    const toggleFloatingOverlay = async () => {
        const nextState = !isFloatingEnabled;
        setIsFloatingEnabled(nextState);
        localStorage.setItem('delivery_floating_overlay_enabled', String(nextState));
        if (!nextState) {
            await hideFloatingOverlay();
        } else {
            const granted = await checkOverlayPermission();
            if (!granted) {
                await requestOverlayPermission();
            }
        }
    };"""

replacement2 = """    // Register Android back button handlers to dismiss modals before navigating
    useEffect(() => {
        if (!selectedOrderForAccept) return;
        return registerModalBackHandler(() => setSelectedOrderForAccept(null));
    }, [selectedOrderForAccept]);

    useEffect(() => {
        if (!showOrdersFeed) return;
        return registerModalBackHandler(() => setShowOrdersFeed(false));
    }, [showOrdersFeed]);

    useEffect(() => {
        if (!showLogoutModal) return;
        return registerModalBackHandler(() => setShowLogoutModal(false));
    }, [showLogoutModal]);

    const toggleFloatingOverlay = async () => {
        const nextState = !isFloatingEnabled;
        setIsFloatingEnabled(nextState);
        localStorage.setItem('delivery_floating_overlay_enabled', String(nextState));
        if (!nextState) {
            await hideFloatingOverlay();
        } else {
            const granted = await checkOverlayPermission();
            setHasOverlayPermission(granted);
            if (!granted) {
                await requestOverlayPermission();
            } else {
                await showFloatingOverlay();
            }
        }
    };"""

# 3. In initOverlay, ensure showFloatingOverlay is called if enabled
target3 = """            // Sync auth token with native background service so orders poll when closed
            const currentToken = localStorage.getItem('authToken');
            if (currentToken) {
                setOverlayAuthToken(currentToken);
            }"""

replacement3 = """            // Sync auth token with native background service so orders poll when closed
            const currentToken = localStorage.getItem('authToken');
            if (currentToken) {
                setOverlayAuthToken(currentToken);
            }

            if (isFloatingEnabled && granted) {
                showFloatingOverlay();
            }"""

# 4. Add permission warning banner above search pill if permission is missing
target4 = """                        {/* Search Pill */}"""

replacement4 = """                        {/* Permission Warning Banner if Display Over Other Apps is missing */}
                        {!hasOverlayPermission && (
                            <div className="mb-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm">
                                <div className="flex items-center gap-2.5">
                                    <span className="text-xl">⚠️</span>
                                    <div className="text-left">
                                        <p className="text-xs font-bold text-amber-900 dark:text-amber-200">{t('Display Over Other Apps Required')}</p>
                                        <p className="text-[11px] text-amber-700 dark:text-amber-300">{t('Enable permission so floating screen image and order alerts appear')}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={requestOverlayPermission}
                                    className="shrink-0 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                                >
                                    {t('Allow')}
                                </button>
                            </div>
                        )}

                        {/* Search Pill */}"""

if target1 in text and target2 in text and target3 in text and target4 in text:
    text = text.replace(target1, replacement1, 1)
    text = text.replace(target2, replacement2, 1)
    text = text.replace(target3, replacement3, 1)
    text = text.replace(target4, replacement4, 1)
    with open('src/pages/admin/DeliveryDashboard.jsx', 'w', encoding='utf-8') as f:
        f.write(text)
    print('SUCCESS')
else:
    print('FAILED to match all targets')

