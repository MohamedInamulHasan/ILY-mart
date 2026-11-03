import os

# 1. Update OrderConfirmation.jsx
order_conf_path = r'src\pages\OrderConfirmation.jsx'
with open(order_conf_path, 'r', encoding='utf-8') as f:
    conf_content = f.read()

# Replace Total Summary in items card
conf_content = conf_content.replace(
    "<h3 className=\"font-medium text-gray-900 dark:text-white text-base\">{t('Total Summary')}</h3>",
    "<h3 className=\"font-medium text-gray-900 dark:text-white text-base\">{t('Order Items')}</h3>"
)

# Replace Payment with Payment Summary
conf_content = conf_content.replace(
    "<h2 className=\"text-[17px] font-bold text-gray-900 dark:text-white\">{t('Payment')}</h2>",
    "<h2 className=\"text-[17px] font-bold text-gray-900 dark:text-white\">{t('Payment Summary')}</h2>"
)

# Make the green flower bigger and adjust star burst / rings
old_flower_section = """                                <div className="relative w-40 h-40 sm:w-44 sm:h-44 mx-auto mb-5 flex items-center justify-center">
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
                                                    transform: `rotate(${angle}deg) translateY(-86px)`,
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
                                        className="absolute w-36 h-36 sm:w-40 sm:h-40 rounded-full border-2 border-green-500/40 pointer-events-none"
                                    />

                                    {/* GPay Scalloped Flower Badge (Large, Bold, No Shadow) */}
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: [0, 1.15, 1] }}
                                        transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1], delay: 0.05 }}
                                        className="w-32 h-32 sm:w-36 sm:h-36 flex items-center justify-center relative z-10"
                                    >"""

new_flower_section = """                                <div className="relative w-44 h-44 sm:w-48 sm:h-48 mx-auto mb-5 flex items-center justify-center">
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
                                                    transform: `rotate(${angle}deg) translateY(-100px)`,
                                                    transformOrigin: 'center center'
                                                }}
                                                className="absolute"
                                            >
                                                {/* 4-point green star (GPay style) */}
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="#22C55E">
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
                                        className="absolute w-40 h-40 sm:w-44 sm:h-44 rounded-full border-2 border-green-500/40 pointer-events-none"
                                    />

                                    {/* GPay Scalloped Flower Badge (Large, Bold, No Shadow) */}
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: [0, 1.15, 1] }}
                                        transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1], delay: 0.05 }}
                                        className="w-36 h-36 sm:w-40 sm:h-40 flex items-center justify-center relative z-10"
                                    >"""

# Normalize line endings before replace
conf_content_normalized = conf_content.replace('\r\n', '\n')
old_flower_section_normalized = old_flower_section.replace('\r\n', '\n')
new_flower_section_normalized = new_flower_section.replace('\r\n', '\n')

if old_flower_section_normalized in conf_content_normalized:
    conf_content_normalized = conf_content_normalized.replace(old_flower_section_normalized, new_flower_section_normalized)
    print("Flower section updated successfully!")
else:
    print("Flower section NOT matched!")

# Remove Back to Home button
old_back_home = """                                <button
                                    onClick={() => navigate('/', { replace: true })}
                                    className="w-full mt-3 py-3 text-sm font-bold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors text-center"
                                >
                                    {t('Back to Home')}
                                </button>"""
old_back_home_normalized = old_back_home.replace('\r\n', '\n')

if old_back_home_normalized in conf_content_normalized:
    conf_content_normalized = conf_content_normalized.replace(old_back_home_normalized, "")
    print("Back to Home button removed successfully!")
else:
    print("Back to Home button NOT matched!")

with open(order_conf_path, 'w', encoding='utf-8') as f:
    f.write(conf_content_normalized)

# 2. Update Checkout.jsx
checkout_path = r'src\pages\Checkout.jsx'
with open(checkout_path, 'r', encoding='utf-8') as f:
    checkout_content = f.read().replace('\r\n', '\n')

# Replace Total Summary in items card
checkout_content = checkout_content.replace(
    "<h3 className=\"font-medium text-gray-900 dark:text-white text-base\">{t('Total Summary')}</h3>",
    "<h3 className=\"font-medium text-gray-900 dark:text-white text-base\">{t('Order Items')}</h3>"
)

# Replace Total Summary in payment card
checkout_content = checkout_content.replace(
    "<h2 className=\"text-[17px] font-bold text-gray-900 dark:text-white\">{t('Total Summary')}</h2>",
    "<h2 className=\"text-[17px] font-bold text-gray-900 dark:text-white\">{t('Payment Summary')}</h2>"
)

# Fix hasGoldProduct in handleSubmit line 311
old_gold = "const hasGoldProduct = displayItems.some(item => item.isGold);"
new_gold = "const hasGoldProduct = displayItems.some(item => item.isGold || (item.product && item.product.isGold)) || location.state?.hasGoldProduct;"
checkout_content = checkout_content.replace(old_gold, new_gold)

with open(checkout_path, 'w', encoding='utf-8') as f:
    f.write(checkout_content)
print("Checkout.jsx updated successfully!")

# 3. Fix Orders.jsx sm:px-4.5
orders_path = r'src\pages\Orders.jsx'
with open(orders_path, 'r', encoding='utf-8') as f:
    orders_content = f.read().replace('\r\n', '\n')

orders_content = orders_content.replace('sm:px-4.5', 'sm:px-5')

with open(orders_path, 'w', encoding='utf-8') as f:
    f.write(orders_content)
print("Orders.jsx updated successfully!")
