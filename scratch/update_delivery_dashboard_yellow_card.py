with open('src/pages/admin/DeliveryDashboard.jsx', 'r', encoding='utf-8') as f:
    code = f.read().replace('\r\n', '\n')

# 1. Remove the toggle from the header, keeping only the red Logout button
header_target = """                    {/* Right: Floating Toggle + Logout */}
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={toggleFloatingOverlay}
                            title={isFloatingEnabled ? t('Floating Image: ON (Tap to Disable)') : t('Floating Image: OFF (Tap to Enable)')}
                            className={`px-2.5 py-1.5 rounded-xl transition-all active:scale-95 flex items-center gap-1.5 text-xs font-bold border ${
                                isFloatingEnabled
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                                    : 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
                            }`}
                        >
                            <Layers size={15} className={isFloatingEnabled ? 'text-emerald-600' : 'text-gray-400'} />
                            <span>{isFloatingEnabled ? 'ON' : 'OFF'}</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setShowLogoutModal(true)}
                            title={t('Logout')}
                            className="p-1.5 text-red-500 hover:opacity-70 transition-opacity active:scale-95"
                        >
                            <LogOut size={22} className="stroke-[2.5]" />
                        </button>
                    </div>"""

header_replace = """                    {/* Right: Logout button */}
                    <button
                        type="button"
                        onClick={() => setShowLogoutModal(true)}
                        title={t('Logout')}
                        className="p-1.5 text-red-500 hover:opacity-70 transition-opacity active:scale-95"
                    >
                        <LogOut size={22} className="stroke-[2.5]" />
                    </button>"""

assert header_target in code, "header_target not found"
code = code.replace(header_target, header_replace, 1)

# 2. Replace the white toggle card and duplicate permission banner with the yellow card like before
card_target = """                        {/* Floating Image Toggle Card - Always visible at top of Delivery Panel */}
                        <div className="mb-4 p-4 bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700 rounded-3xl flex items-center justify-between shadow-xs">
                            <div className="flex items-center gap-3.5">
                                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-colors shadow-xs ${
                                    isFloatingEnabled 
                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' 
                                        : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-400'
                                }`}>
                                    <Layers size={22} />
                                </div>
                                <div className="text-left">
                                    <div className="flex items-center gap-2">
                                        <p className="text-[14px] font-black text-gray-900 dark:text-white leading-tight">
                                            {t('Floating Screen Image')}
                                        </p>
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                            isFloatingEnabled
                                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                                                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                                        }`}>
                                            {isFloatingEnabled ? t('ACTIVE') : t('DISABLED')}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                                        {isFloatingEnabled 
                                            ? t('App icon floats on screen when app is closed') 
                                            : t('Floating icon is turned off')}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={toggleFloatingOverlay}
                                title={isFloatingEnabled ? t('Tap to Disable') : t('Tap to Enable')}
                                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                    isFloatingEnabled ? 'bg-[#2E5A2E]' : 'bg-gray-300 dark:bg-gray-600'
                                }`}
                            >
                                <span
                                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                        isFloatingEnabled ? 'translate-x-5' : 'translate-x-0'
                                    }`}
                                />
                            </button>
                        </div>

                        {/* Porter-style Floating Logo Banner (when permission not yet granted on Android) */}
                        {isNativeAndroid() && !hasOverlayPermission && (
                            <div className="mb-4 p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-center justify-between shadow-xs">
                                <div className="flex items-center gap-2.5">
                                    <span className="text-xl">🔘</span>
                                    <div className="text-left">
                                        <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                                            {t('Enable Floating Screen Logo')}
                                        </p>
                                        <p className="text-[11px] text-amber-700 dark:text-amber-400">
                                            {t('Show app logo on screen when closed, like Porter Partner')}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={async () => {
                                        await requestOverlayPermission();
                                        setTimeout(async () => {
                                            const g = await checkOverlayPermission();
                                            setHasOverlayPermission(g);
                                        }, 1000);
                                    }}
                                    className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-black rounded-xl shadow-xs transition-transform"
                                >
                                    {t('Enable')}
                                </button>
                            </div>
                        )}"""

card_replace = """                        {/* Porter-style Yellow Card (like before with Enable/Disable) */}
                        <div className="mb-4 p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-center justify-between shadow-xs">
                            <div className="flex items-center gap-2.5">
                                <span className="text-xl">🔘</span>
                                <div className="text-left">
                                    <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                                        {isFloatingEnabled ? t('Floating Screen Logo Active') : t('Enable Floating Screen Logo')}
                                    </p>
                                    <p className="text-[11px] text-amber-700 dark:text-amber-400">
                                        {isFloatingEnabled 
                                            ? t('Show app logo on screen when closed, like Porter Partner') 
                                            : t('Tap to enable floating logo over other apps')}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={toggleFloatingOverlay}
                                className={`px-3.5 py-1.5 active:scale-95 text-white text-xs font-black rounded-xl shadow-xs transition-transform ${
                                    isFloatingEnabled 
                                        ? 'bg-red-500 hover:bg-red-600' 
                                        : 'bg-amber-500 hover:bg-amber-600'
                                }`}
                            >
                                {isFloatingEnabled ? t('Disable') : t('Enable')}
                            </button>
                        </div>"""

assert card_target in code, "card_target not found"
code = code.replace(card_target, card_replace, 1)

with open('src/pages/admin/DeliveryDashboard.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Updated DeliveryDashboard.jsx successfully!")
