import os

file_path = r'c:\Users\moham\ILAYANGUDI PROJECT\src\components\IncomingOrderModal.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Header and remove Top Delivery Charge Section
old_header_section = """                {/* Full Accept View: Time Left & ID Right in grey same thickness, light grey line like green dot line */}
                <div className="px-5 pt-4 pb-2.5 flex items-center justify-between text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 shrink-0">
                    {/* Left: 🕒 Nov 6, 8.00 PM */}
                    <div className="flex items-center gap-1.5 min-w-0">
                        <Clock size={16} className="text-gray-500 dark:text-gray-400 shrink-0" />
                        <span className="text-sm sm:text-[15px] font-bold text-gray-500 dark:text-gray-400 tracking-wide truncate">
                            {formatOrderBannerTime(order.createdAt || order.date) || formattedOrderTime || t('New Order')}
                        </span>
                    </div>

                    {/* Right: #Order ID (same font-bold thickness and grey color) */}
                    <span className="text-sm sm:text-[15px] font-bold text-gray-500 dark:text-gray-400 font-mono shrink-0">
                        #{orderIdShort}
                    </span>
                </div>
                {/* Light grey line matching green dot line */}
                <div className="mx-5 h-[1px] bg-gray-300 dark:bg-gray-600 shrink-0" />

                {/* Top Delivery Charge Section */}
                <div className="bg-white dark:bg-gray-800 pt-5 pb-3.5 px-6 text-center shrink-0 border-b border-gray-100 dark:border-gray-750">
                    <span className="text-[11px] font-black uppercase tracking-widest text-black dark:text-white block mb-0.5">
                        {t('Delivery Charge')}
                    </span>

                    {deliveryCharge > 0 ? (
                        <div className="text-5xl sm:text-6xl font-black text-black dark:text-white tracking-tight font-sans">
                            ₹{deliveryCharge}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center gap-2.5 py-1">
                            <span className="text-4xl sm:text-5xl font-black text-black dark:text-white tracking-tight uppercase">
                                {t('Free Delivery')}
                            </span>
                            <CartoonCoin size={36} />
                        </div>
                    )}

                    <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mt-1">
                        {t(paymentType || 'Cash on Delivery')}
                    </p>
                </div>"""

new_header_section = """                {/* Full Accept View: Time Left & ID Right in grey same thickness, light grey line like green dot line */}
                <div className="bg-white dark:bg-gray-800 shrink-0">
                    <div className="px-5 pt-4 pb-2.5 flex items-center justify-between text-gray-500 dark:text-gray-400">
                        {/* Left: 🕒 Nov 6, 8.00 PM */}
                        <div className="flex items-center gap-1.5 min-w-0">
                            <Clock size={16} className="text-gray-500 dark:text-gray-400 shrink-0" />
                            <span className="text-sm sm:text-[15px] font-bold text-gray-500 dark:text-gray-400 tracking-wide truncate">
                                {formatOrderBannerTime(order.createdAt || order.date) || formattedOrderTime || t('New Order')}
                            </span>
                        </div>

                        {/* Right: #Order ID (same font-bold thickness and grey color) */}
                        <span className="text-sm sm:text-[15px] font-bold text-gray-500 dark:text-gray-400 font-mono shrink-0">
                            #{orderIdShort}
                        </span>
                    </div>
                    {/* Light grey line matching green dot line */}
                    <div className="mx-5 h-[2px] bg-gray-300 dark:bg-gray-600 rounded-full mb-3" />
                </div>"""

if old_header_section in content:
    content = content.replace(old_header_section, new_header_section)
    print("Replaced header and removed top delivery charge section successfully!")
else:
    print("Could not find exact old_header_section, checking partial...")

# 2. Update cancel button: text CANCEL, direct handleConfirmCancel without popup
old_cancel_btn = """                            {/* Cancel Button styled like Accept button in Grey */}
                            <SwipeActionButton
                                variant="gray"
                                label={t('SWIPE TO CANCEL')}
                                loadingLabel={t('Cancelling...')}
                                isLoading={isCancelling}
                                heightClass="h-[60px] sm:h-[64px]"
                                knobSizeClass="w-[48px] h-[48px] sm:w-[52px] sm:h-[52px]"
                                autoReset={true}
                                onSuccess={() => setShowCancelPopup(true)}
                            />"""

new_cancel_btn = """                            {/* Cancel Button styled like Accept button in Grey */}
                            <SwipeActionButton
                                variant="gray"
                                label={t('CANCEL')}
                                loadingLabel={t('Cancelling...')}
                                isLoading={isCancelling}
                                heightClass="h-[60px] sm:h-[64px]"
                                knobSizeClass="w-[48px] h-[48px] sm:w-[52px] sm:h-[52px]"
                                autoReset={true}
                                onSuccess={handleConfirmCancel}
                            />"""

if old_cancel_btn in content:
    content = content.replace(old_cancel_btn, new_cancel_btn)
    print("Updated cancel button to CANCEL and direct handleConfirmCancel!")
else:
    print("Could not find exact old_cancel_btn!")

# 3. Remove Cancel Order popup JSX from IncomingOrderModal.jsx
old_popup_start = "                {/* POPUP: Cancel Order with RED Swipe Button */}"
old_popup_end = "                </AnimatePresence>"
if old_popup_start in content:
    pos_start = content.find(old_popup_start)
    pos_end = content.find(old_popup_end, pos_start) + len(old_popup_end)
    content = content[:pos_start] + content[pos_end:]
    print("Removed Cancel Order popup modal JSX completely!")
else:
    print("Could not find popup JSX to remove")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Saved IncomingOrderModal.jsx successfully!")

