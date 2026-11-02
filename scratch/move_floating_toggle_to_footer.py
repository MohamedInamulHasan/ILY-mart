with open('src/pages/admin/DeliveryDashboard.jsx', 'r', encoding='utf-8') as f:
    code = f.read().replace('\r\n', '\n')

# 1. Remove the yellow card from the top of the feed
old_box = """                        {/* Porter-style Yellow Card with Swipe to Enable / Swipe to Disable */}
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

assert old_box in code, "old_box not found"
code = code.replace(old_box, "", 1)

# 2. Add floating footer bar before DeliveryOrdersFeedModal
target_footer_insertion = """            {/* Available Orders Feed Modal (placed outside PullToRefreshLayout to prevent CSS transform conflicts) */}"""

footer_code = """            {/* Floating Action Footer (Elevated like Home Footer) */}
            <div 
                className="fixed z-40 left-1/2 -translate-x-1/2 w-full max-w-sm px-4 pointer-events-auto select-none"
                style={{ bottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}
            >
                <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl p-2 rounded-full border border-gray-200/80 dark:border-gray-700/80 shadow-2xl shadow-black/15">
                    <SwipeActionButton
                        key={isFloatingEnabled ? 'disable-floating' : 'enable-floating'}
                        variant={isFloatingEnabled ? 'red' : 'amber'}
                        label={isFloatingEnabled ? t('Swipe to Disable') : t('Swipe to Enable')}
                        loadingLabel={isFloatingEnabled ? t('Disabling...') : t('Enabling...')}
                        onSuccess={toggleFloatingOverlay}
                        autoReset={true}
                        heightClass="h-[52px] sm:h-[56px]"
                        knobSizeClass="w-[42px] h-[42px] sm:w-[46px] sm:h-[46px]"
                    />
                </div>
            </div>

            {/* Available Orders Feed Modal (placed outside PullToRefreshLayout to prevent CSS transform conflicts) */}"""

assert target_footer_insertion in code, "target_footer_insertion not found"
code = code.replace(target_footer_insertion, footer_code, 1)

with open('src/pages/admin/DeliveryDashboard.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Moved floating toggle to footer successfully!")
