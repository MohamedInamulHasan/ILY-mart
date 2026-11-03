import os

# 1. Update OrderConfirmation.jsx
order_conf_path = r'src\pages\OrderConfirmation.jsx'
with open(order_conf_path, 'r', encoding='utf-8') as f:
    conf = f.read().replace('\r\n', '\n')

# Replace items card title to Order Summary
conf = conf.replace(
    "<h3 className=\"font-medium text-gray-900 dark:text-white text-base\">{t('Total Summary')}</h3>",
    "<h3 className=\"font-medium text-gray-900 dark:text-white text-base\">{t('Order Summary')}</h3>"
)
conf = conf.replace(
    "<h3 className=\"font-medium text-gray-900 dark:text-white text-base\">{t('Order Items')}</h3>",
    "<h3 className=\"font-medium text-gray-900 dark:text-white text-base\">{t('Order Summary')}</h3>"
)

# Replace Payment with Payment Summary
conf = conf.replace(
    "<h2 className=\"text-[17px] font-bold text-gray-900 dark:text-white\">{t('Payment')}</h2>",
    "<h2 className=\"text-[17px] font-bold text-gray-900 dark:text-white\">{t('Payment Summary')}</h2>"
)

# Update Modal in OrderConfirmation.jsx
# Reduce popup gaps, make flower big, make tick little small
old_modal_start = """                        <motion.div
                            initial={{ scale: 0.4, opacity: 0, y: 30 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.7, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 450, damping: 22 }}
                            className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl max-w-sm w-full p-8 relative overflow-hidden"
                        >"""

new_modal_start = """                        <motion.div
                            initial={{ scale: 0.4, opacity: 0, y: 30 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.7, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 450, damping: 22 }}
                            className="bg-white dark:bg-gray-800 rounded-3xl sm:rounded-[2rem] shadow-2xl max-w-sm w-full p-6 sm:p-7 relative overflow-hidden"
                        >"""

conf = conf.replace(old_modal_start, new_modal_start)

# Replace inner flower and content with reduced gaps and smaller tick
# Locate from <div className="text-center"> to </motion.div>
import re

modal_body_pattern = re.compile(
    r'<div className="text-center">\s*<div className="relative.*?</div>\s*<h2 className="text-2xl.*?</h2>\s*<p className="text-gray-500.*?<div className="bg-gray-50.*?</div>\s*<button\s+onClick=\{handleCloseSuccess\}.*?</button>\s*</div>',
    re.DOTALL
)

new_modal_body = """<div className="text-center">
                                <div className="relative w-32 h-32 sm:w-36 sm:h-36 mx-auto mb-3 flex items-center justify-center">
                                    {/* Green star burst rotating ONLY during the entrance movement like GPay */}
                                    <motion.div
                                        initial={{ rotate: -40, scale: 0.2, opacity: 0 }}
                                        animate={{ rotate: 30, scale: 1, opacity: 1 }}
                                        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                                        className="absolute inset-0 pointer-events-none flex items-center justify-center"
                                    >
                                        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                                            <motion.div
                                                key={angle}
                                                initial={{ scale: 0, opacity: 0 }}
                                                animate={{ scale: [0, 1.25, 1], opacity: [0, 1, 0.95] }}
                                                transition={{ duration: 0.5, delay: 0.1 + i * 0.02, ease: "easeOut" }}
                                                style={{
                                                    transform: `rotate(${angle}deg) translateY(-76px)`,
                                                    transformOrigin: 'center center'
                                                }}
                                                className="absolute"
                                            >
                                                {/* 4-point green star (GPay style) */}
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="#22C55E">
                                                    <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
                                                </svg>
                                            </motion.div>
                                        ))}
                                    </motion.div>

                                    {/* Expanding soft ring */}
                                    <motion.div
                                        initial={{ scale: 0.8, opacity: 0.8 }}
                                        animate={{ scale: 1.45, opacity: 0 }}
                                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                                        className="absolute w-32 h-32 sm:w-36 sm:h-36 rounded-full border-2 border-green-500/40 pointer-events-none"
                                    />

                                    {/* GPay Scalloped Flower Badge (Large flower with compact tight viewBox) */}
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: [0, 1.15, 1] }}
                                        transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1], delay: 0.05 }}
                                        className="w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center relative z-10"
                                    >
                                        <svg
                                            viewBox="16 16 68 68"
                                            className="w-full h-full"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            {/* Large Scalloped Flower Base */}
                                            <path
                                                d="M 79.70 42.04 A 11.5 11.5 0 0 1 79.70 57.96 A 11.5 11.5 0 0 1 71.74 71.74 A 11.5 11.5 0 0 1 57.96 79.70 A 11.5 11.5 0 0 1 42.04 79.70 A 11.5 11.5 0 0 1 28.26 71.74 A 11.5 11.5 0 0 1 20.30 57.96 A 11.5 11.5 0 0 1 20.30 42.04 A 11.5 11.5 0 0 1 28.26 28.26 A 11.5 11.5 0 0 1 42.04 20.30 A 11.5 11.5 0 0 1 57.96 20.30 A 11.5 11.5 0 0 1 71.74 28.26 A 11.5 11.5 0 0 1 79.70 42.04 Z"
                                                fill="#1EA34B"
                                            />
                                            {/* Animated Checkmark Tick (Little small, centered & proportionate) */}
                                            <motion.path
                                                d="M 36 50.5 L 45.5 59 L 63 41.5"
                                                stroke="#FFFFFF"
                                                strokeWidth="6.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                initial={{ pathLength: 0, opacity: 0 }}
                                                animate={{ pathLength: 1, opacity: 1 }}
                                                transition={{ duration: 0.45, delay: 0.25, ease: "easeOut" }}
                                            />
                                        </svg>
                                    </motion.div>
                                </div>
                                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">
                                    {t('Order Placed!')}
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 font-medium">
                                    {t('Your order has been placed successfully.')}
                                </p>
                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-3.5 sm:p-4 mb-4 sm:mb-5 border border-gray-100 dark:border-gray-600/50">
                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-0.5 tracking-widest uppercase font-bold">{t('Order ID')}</p>
                                    <p className="font-mono font-bold text-gray-900 dark:text-white text-lg sm:text-xl">
                                        #{String(createdOrderId || '000').slice(-6).toUpperCase()}
                                    </p>
                                </div>
                                <button
                                    onClick={handleCloseSuccess}
                                    className="w-full bg-black text-white py-3 sm:py-3.5 px-6 rounded-full font-medium text-sm sm:text-base shadow-lg shadow-gray-200 dark:shadow-gray-900/20 active:scale-[0.98] transition-transform"
                                >
                                    {t('Go to Orders')}
                                </button>
                            </div>"""

if modal_body_pattern.search(conf):
    conf = modal_body_pattern.sub(new_modal_body, conf)
    print("OrderConfirmation modal updated with reduced gaps, big flower and smaller tick!")
else:
    print("WARNING: Modal body regex did not match!")

with open(order_conf_path, 'w', encoding='utf-8') as f:
    f.write(conf)

# 2. Update Checkout.jsx
checkout_path = r'src\pages\Checkout.jsx'
with open(checkout_path, 'r', encoding='utf-8') as f:
    checkout = f.read().replace('\r\n', '\n')

checkout = checkout.replace(
    "<h3 className=\"font-medium text-gray-900 dark:text-white text-base\">{t('Total Summary')}</h3>",
    "<h3 className=\"font-medium text-gray-900 dark:text-white text-base\">{t('Order Summary')}</h3>"
)
checkout = checkout.replace(
    "<h3 className=\"font-medium text-gray-900 dark:text-white text-base\">{t('Order Items')}</h3>",
    "<h3 className=\"font-medium text-gray-900 dark:text-white text-base\">{t('Order Summary')}</h3>"
)
checkout = checkout.replace(
    "<h2 className=\"text-[17px] font-bold text-gray-900 dark:text-white\">{t('Total Summary')}</h2>",
    "<h2 className=\"text-[17px] font-bold text-gray-900 dark:text-white\">{t('Payment Summary')}</h2>"
)

with open(checkout_path, 'w', encoding='utf-8') as f:
    f.write(checkout)

print("Checkout.jsx updated with Order Summary and Payment Summary!")
