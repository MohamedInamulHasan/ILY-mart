with open('src/pages/admin/DeliveryDashboard.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Update list container bottom padding to pb-36
target_padding = '<div className="px-5 mt-2 max-w-3xl mx-auto pb-28">'
replacement_padding = '<div className="px-5 mt-2 max-w-3xl mx-auto pb-36">'

# 2. Replace floating pill footer with attached bottom rectangle footer
target_footer = """            {/* Floating Action Footer (Elevated like Home Footer) */}
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
            </div>"""

replacement_footer = """            {/* Attached Bottom Rectangle Footer */}
            <div 
                className="fixed bottom-0 inset-x-0 z-40 w-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200/80 dark:border-gray-800 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] pointer-events-auto select-none"
                style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))', paddingTop: '0.75rem' }}
            >
                <div className="max-w-md mx-auto px-4">
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
            </div>"""

if target_padding in text and target_footer in text:
    text = text.replace(target_padding, replacement_padding, 1)
    text = text.replace(target_footer, replacement_footer, 1)
    with open('src/pages/admin/DeliveryDashboard.jsx', 'w', encoding='utf-8') as f:
        f.write(text)
    print('SUCCESS')
else:
    print('FAILED to match targets')
    if target_padding not in text:
        print('target_padding not found')
    if target_footer not in text:
        print('target_footer not found')

