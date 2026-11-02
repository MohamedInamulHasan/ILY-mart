with open('src/pages/admin/DeliveryDashboard.jsx', 'r', encoding='utf-8') as f:
    code = f.read().replace('\r\n', '\n')

# 1. Add Layers to lucide-react import
target_import = "    Check\n} from 'lucide-react';"
replace_import = "    Check,\n    Layers\n} from 'lucide-react';"

assert target_import in code, "target_import not found"
code = code.replace(target_import, replace_import, 1)

# 2. Add state & toggle handler
target_state = "    const [hasOverlayPermission, setHasOverlayPermission] = useState(true);"
replace_state = """    const [hasOverlayPermission, setHasOverlayPermission] = useState(true);
    const [isFloatingEnabled, setIsFloatingEnabled] = useState(() => {
        const saved = localStorage.getItem('delivery_floating_overlay_enabled');
        return saved !== null ? saved === 'true' : true;
    });

    const toggleFloatingOverlay = async () => {
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

assert target_state in code, "target_state not found"
code = code.replace(target_state, replace_state, 1)

# 3. Update appStateListener to respect isFloatingEnabled
target_listener = """                appStateListener = await App.addListener('appStateChange', ({ isActive }) => {
                    if (!isActive) {
                        // When app is closed/minimized -> show floating Porter-style logo on screen
                        showFloatingOverlay();
                    } else {
                        // When app is reopened -> hide floating logo
                        hideFloatingOverlay();
                    }
                });"""

replace_listener = """                appStateListener = await App.addListener('appStateChange', ({ isActive }) => {
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
                });"""

assert target_listener in code, "target_listener not found"
code = code.replace(target_listener, replace_listener, 1)

# 4. Add UI Toggle component right above the permission banner
target_banner = """                        {/* Porter-style Floating Logo Banner (when permission not yet granted on Android) */}"""

replace_banner = """                        {/* Porter-style Floating Logo Toggle & Permission Banner */}
                        {isNativeAndroid() && (
                            <div className="mb-4 p-3.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/80 rounded-2xl flex items-center justify-between shadow-xs">
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                                        isFloatingEnabled 
                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' 
                                            : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-400'
                                    }`}>
                                        <Layers size={18} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-900 dark:text-white">
                                            {t('Floating Screen Image')}
                                        </p>
                                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                            {isFloatingEnabled ? t('Active when app is closed') : t('Disabled')}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={toggleFloatingOverlay}
                                    title={isFloatingEnabled ? t('Disable Floating Image') : t('Enable Floating Image')}
                                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                        isFloatingEnabled ? 'bg-[#2E5A2E]' : 'bg-gray-300 dark:bg-gray-600'
                                    }`}
                                >
                                    <span
                                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                            isFloatingEnabled ? 'translate-x-5' : 'translate-x-0'
                                        }`}
                                    />
                                </button>
                            </div>
                        )}

                        {/* Porter-style Floating Logo Banner (when permission not yet granted on Android) */}"""

assert target_banner in code, "target_banner not found"
code = code.replace(target_banner, replace_banner, 1)

with open('src/pages/admin/DeliveryDashboard.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("DeliveryDashboard.jsx updated with floating toggle successfully!")
