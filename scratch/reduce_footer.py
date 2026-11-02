with open('src/components/SwipeActionButton.jsx', 'r', encoding='utf-8') as f:
    btn_code = f.read()

# Add textSizeClass and iconSize props
old_props = """const SwipeActionButton = ({
    onSuccess,
    label = 'Swipe to Accept',
    isLoading = false,
    loadingLabel = 'Processing...',
    heightClass = 'h-[60px] sm:h-[64px]',
    knobSizeClass = 'w-[48px] h-[48px] sm:w-[52px] sm:h-[52px]',
    variant = 'green', // 'yellow' | 'amber' | 'blue' | 'sky' | 'green' | 'red'
    autoReset = false,
    className = ''
}) => {"""

new_props = """const SwipeActionButton = ({
    onSuccess,
    label = 'Swipe to Accept',
    isLoading = false,
    loadingLabel = 'Processing...',
    heightClass = 'h-[60px] sm:h-[64px]',
    knobSizeClass = 'w-[48px] h-[48px] sm:w-[52px] sm:h-[52px]',
    textSizeClass = 'text-base sm:text-lg',
    iconSize = 24,
    variant = 'green', // 'yellow' | 'amber' | 'blue' | 'sky' | 'green' | 'red'
    autoReset = false,
    className = ''
}) => {"""

btn_code = btn_code.replace(old_props, new_props)

# Update icon and text
btn_code = btn_code.replace(
    '<ChevronsRight size={24} className={`stroke-[3.5] ${colors.knob}`} />',
    '<ChevronsRight size={iconSize} className={`stroke-[3.5] ${colors.knob}`} />'
)

btn_code = btn_code.replace(
    '<span className="font-black text-base sm:text-lg tracking-wider uppercase text-white text-center select-none truncate">',
    '<span className={`font-black ${textSizeClass} tracking-wider uppercase text-white text-center select-none truncate`}>'
)

with open('src/components/SwipeActionButton.jsx', 'w', encoding='utf-8') as f:
    f.write(btn_code)
print("Updated SwipeActionButton.jsx")


# Update DeliveryDashboard.jsx footer
with open('src/pages/admin/DeliveryDashboard.jsx', 'r', encoding='utf-8') as f:
    dd_code = f.read()

# Reduce container padding and button size
old_footer = """            {/* Attached Bottom Rectangle Footer */}
            <div 
                className="fixed bottom-0 inset-x-0 z-40 w-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200/80 dark:border-gray-800 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] pointer-events-auto select-none"
                style={{ paddingBottom: 'calc(2.25rem + env(safe-area-inset-bottom, 20px))', paddingTop: '0.85rem' }}
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

new_footer = """            {/* Attached Bottom Rectangle Footer */}
            <div 
                className="fixed bottom-0 inset-x-0 z-40 w-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200/80 dark:border-gray-800 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pointer-events-auto select-none"
                style={{ paddingBottom: 'calc(0.65rem + env(safe-area-inset-bottom, 10px))', paddingTop: '0.45rem' }}
            >
                <div className="max-w-xs sm:max-w-sm mx-auto px-4">
                    <SwipeActionButton
                        key={isFloatingEnabled ? 'disable-floating' : 'enable-floating'}
                        variant={isFloatingEnabled ? 'red' : 'amber'}
                        label={isFloatingEnabled ? t('Swipe to Disable') : t('Swipe to Enable')}
                        loadingLabel={isFloatingEnabled ? t('Disabling...') : t('Enabling...')}
                        onSuccess={toggleFloatingOverlay}
                        autoReset={true}
                        heightClass="h-[44px]"
                        knobSizeClass="w-[34px] h-[34px]"
                        textSizeClass="text-xs sm:text-[13px]"
                        iconSize={18}
                    />
                </div>
            </div>"""

dd_code = dd_code.replace(old_footer, new_footer)

# Reduce page bottom padding
dd_code = dd_code.replace('pb-48', 'pb-28')
dd_code = dd_code.replace('pb-44', 'pb-24')

with open('src/pages/admin/DeliveryDashboard.jsx', 'w', encoding='utf-8') as f:
    f.write(dd_code)
print("Updated DeliveryDashboard.jsx footer")
