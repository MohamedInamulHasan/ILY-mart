with open('src/pages/admin/DeliveryDashboard.jsx', 'r', encoding='utf-8') as f:
    code = f.read().replace('\r\n', '\n')

# 1. Update the header to include the toggle button next to logout
old_header_right = """                    {/* Right: Logout button */}
                    <button
                        type="button"
                        onClick={() => setShowLogoutModal(true)}
                        title={t('Logout')}
                        className="p-1.5 text-red-500 hover:opacity-70 transition-opacity active:scale-95"
                    >
                        <LogOut size={22} className="stroke-[2.5]" />
                    </button>"""

new_header_right = """                    {/* Right: Floating Toggle + Logout */}
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

assert old_header_right in code, "old_header_right not found"
code = code.replace(old_header_right, new_header_right, 1)

# 2. Make the floating card always visible (remove `isNativeAndroid() &&` so delivery boys see it on any device/preview)
old_toggle_card = """                        {/* Porter-style Floating Logo Toggle & Permission Banner */}
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
                        )}"""

new_toggle_card = """                        {/* Floating Image Toggle Card - Always visible at top of Delivery Panel */}
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
                        </div>"""

assert old_toggle_card in code, "old_toggle_card not found"
code = code.replace(old_toggle_card, new_toggle_card, 1)

with open('src/pages/admin/DeliveryDashboard.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Updated DeliveryDashboard.jsx successfully!")

