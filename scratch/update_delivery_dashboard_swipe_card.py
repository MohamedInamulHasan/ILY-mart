with open('src/pages/admin/DeliveryDashboard.jsx', 'r', encoding='utf-8') as f:
    code = f.read().replace('\r\n', '\n')

old_card = """                        {/* Porter-style Yellow Card (like before with Enable/Disable) */}
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

new_card = """                        {/* Porter-style Yellow Card with Swipe to Enable / Swipe to Disable */}
                        <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-3xl space-y-3 shadow-xs">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <span className="text-xl">🔘</span>
                                    <div className="text-left">
                                        <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                                            {isFloatingEnabled ? t('Floating Screen Logo Active') : t('Floating Screen Logo Disabled')}
                                        </p>
                                        <p className="text-[11px] text-amber-700 dark:text-amber-400">
                                            {isFloatingEnabled 
                                                ? t('App icon floats on screen when app is closed') 
                                                : t('Show app logo on screen when closed, like Porter Partner')}
                                        </p>
                                    </div>
                                </div>
                                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                                    isFloatingEnabled 
                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300' 
                                        : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                                }`}>
                                    {isFloatingEnabled ? t('ON') : t('OFF')}
                                </span>
                            </div>

                            {/* Swipe to Enable / Swipe to Disable */}
                            <div className="pt-1">
                                <SwipeActionButton
                                    key={isFloatingEnabled ? 'disable-floating' : 'enable-floating'}
                                    variant={isFloatingEnabled ? 'red' : 'amber'}
                                    label={isFloatingEnabled ? t('Swipe to Disable') : t('Swipe to Enable')}
                                    loadingLabel={isFloatingEnabled ? t('Disabling...') : t('Enabling...')}
                                    onSuccess={toggleFloatingOverlay}
                                    autoReset={true}
                                    heightClass="h-[52px]"
                                    knobSizeClass="w-[42px] h-[42px]"
                                />
                            </div>
                        </div>"""

assert old_card in code, "old_card not found"
code = code.replace(old_card, new_card, 1)

with open('src/pages/admin/DeliveryDashboard.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Updated DeliveryDashboard.jsx with Swipe to Enable / Swipe to Disable successfully!")

