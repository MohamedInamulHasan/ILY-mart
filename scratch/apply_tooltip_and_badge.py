import re

print("--- 1. Updating App.jsx ---")
with open('src/App.jsx', 'r', encoding='utf-8') as f:
    app_code = f.read()

# Replace the Link floating delivery badge with non-clickable showcase div with bg-red-600
old_badge_pattern = re.compile(
    r'\{/\* Floating Delivery Charge Card[^\}]*\*/\}\s*\{showFloatingDeliveryBadge && \(\s*<Link\s+to="/cart"[^>]*>[\s\S]*?</Link>\s*\)\}',
    re.MULTILINE
)

new_badge = """{/* Floating Delivery Charge Card - right side (Solid Red - Showcase only, not clickable) */}
            {showFloatingDeliveryBadge && (
                <div
                    className="fixed right-0 top-[25%] -translate-y-1/2 z-[90] select-none pointer-events-none"
                    aria-hidden="true"
                >
                    <div
                        className="rounded-l-2xl py-2 px-3 flex flex-col items-center shadow-lg border-2 border-r-0 border-white text-center bg-red-600"
                    >
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider mb-0.5 select-none leading-none">
                            {t('Delivery')}
                        </span>
                        <span className="text-[14px] font-black text-white select-none leading-none">
                            {deliveryCharge === 0 ? t('Free') : `₹${deliveryCharge}`}
                        </span>
                    </div>
                </div>
            )}"""

match = old_badge_pattern.search(app_code)
if match:
    app_code = app_code[:match.start()] + new_badge + app_code[match.end():]
    print("Replaced floating badge with non-clickable red showcase div.")
else:
    print("Direct pattern match failed, trying alternative replacement...")
    # fallback
    find_str = """            {/* Floating Delivery Charge Card - right side (Leaf Green matching user screenshot) */}
            {showFloatingDeliveryBadge && (
                <Link
                    to="/cart"
                    className="fixed right-0 top-[25%] -translate-y-1/2 z-[90] active:scale-95 transition-transform"
                    title={t('View Cart')}
                >
                    <div
                        className="rounded-l-2xl py-2 px-3 flex flex-col items-center shadow-lg border-2 border-r-0 border-white text-center bg-[#2E5A2E]"
                    >
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider mb-0.5 select-none leading-none">
                            {t('Delivery')}
                        </span>
                        <span className="text-[14px] font-black text-white select-none leading-none">
                            {deliveryCharge === 0 ? t('Free') : `₹${deliveryCharge}`}
                        </span>
                    </div>
                </Link>
            )}"""
    if find_str in app_code:
        app_code = app_code.replace(find_str, new_badge)
        print("Replaced using direct string match.")
    else:
        print("Warning: Could not match floating badge in App.jsx!")

with open('src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(app_code)

print("--- 2. Updating Checkout.jsx Tooltips ---")
with open('src/pages/Checkout.jsx', 'r', encoding='utf-8') as f:
    co_code = f.read()

# Replace all error tooltips in Checkout.jsx with the EditAddress style:
# bg-white dark:bg-gray-850 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-800 dark:text-gray-200 text-[13px] font-normal flex items-center gap-2.5 w-fit shadow-md z-10
# <div className="absolute -top-[5px] left-4 w-2 h-2 bg-white dark:bg-gray-855 border-t border-l border-gray-300 dark:border-gray-600 rotate-45 transform"></div>
# <div className="w-5 h-5 rounded bg-[#F59E0B] text-white flex items-center justify-center text-[12px] font-black flex-shrink-0">!</div>

# 1. location error
old_loc_err = """                                        {fieldErrors.location && (
                                            <div className="relative mt-2 bg-white dark:bg-gray-850 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-[#2E5A2E] dark:text-[#CBF9B2] text-[13px] italic font-medium flex items-center gap-2.5 w-fit shadow-md z-10">
                                                <div className="absolute -top-[5px] left-4 w-2 h-2 bg-white dark:bg-gray-855 border-t border-l border-gray-300 dark:border-gray-600 rotate-45 transform"></div>
                                                <div className="w-5 h-5 rounded bg-[#2E5A2E] text-white flex items-center justify-center text-[12px] font-black flex-shrink-0">!</div>
                                                <span>{t('GPS Location is required')}</span>
                                            </div>
                                        )}"""

new_loc_err = """                                        {fieldErrors.location && (
                                            <div className="relative mt-2 bg-white dark:bg-gray-850 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-800 dark:text-gray-200 text-[13px] font-normal flex items-center gap-2.5 w-fit shadow-md z-10">
                                                <div className="absolute -top-[5px] left-4 w-2 h-2 bg-white dark:bg-gray-855 border-t border-l border-gray-300 dark:border-gray-600 rotate-45 transform"></div>
                                                <div className="w-5 h-5 rounded bg-[#F59E0B] text-white flex items-center justify-center text-[12px] font-black flex-shrink-0">!</div>
                                                <span>{t('GPS Location is required')}</span>
                                            </div>
                                        )}"""
if old_loc_err in co_code:
    co_code = co_code.replace(old_loc_err, new_loc_err)
    print("Updated location error tooltip.")

# 2. fullName error
old_fn_err = """                                            {fieldErrors.fullName && (
                                                <div className="relative mt-2 bg-white dark:bg-gray-855 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-[#2E5A2E] dark:text-[#CBF9B2] text-[13px] italic font-medium flex items-center gap-2.5 w-fit shadow-md z-10">
                                                    <div className="absolute -top-[5px] left-4 w-2 h-2 bg-white dark:bg-gray-855 border-t border-l border-gray-300 dark:border-gray-600 rotate-45 transform"></div>
                                                    <div className="w-5 h-5 rounded bg-[#2E5A2E] text-white flex items-center justify-center text-[12px] font-black flex-shrink-0">!</div>
                                                    <span>{language === 'ta' ? 'தயவுசெய்து இந்த புலத்தை நிரப்பவும்.' : 'Please fill out this field.'}</span>
                                                </div>
                                            )}"""

new_fn_err = """                                            {fieldErrors.fullName && (
                                                <div className="relative mt-2 bg-white dark:bg-gray-850 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-800 dark:text-gray-200 text-[13px] font-normal flex items-center gap-2.5 w-fit shadow-md z-10">
                                                    <div className="absolute -top-[5px] left-4 w-2 h-2 bg-white dark:bg-gray-855 border-t border-l border-gray-300 dark:border-gray-600 rotate-45 transform"></div>
                                                    <div className="w-5 h-5 rounded bg-[#F59E0B] text-white flex items-center justify-center text-[12px] font-black flex-shrink-0">!</div>
                                                    <span>{language === 'ta' ? 'தயவுசெய்து இந்த புலத்தை நிரப்பவும்.' : 'Please fill out this field.'}</span>
                                                </div>
                                            )}"""
if old_fn_err in co_code:
    co_code = co_code.replace(old_fn_err, new_fn_err)
    print("Updated fullName error tooltip.")

# 3. mobile error
old_mob_err = """                                            {fieldErrors.mobile && (
                                                <div className="relative mt-2 bg-white dark:bg-gray-855 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-[#2E5A2E] dark:text-[#CBF9B2] text-[13px] italic font-medium flex items-center gap-2.5 w-fit shadow-md z-10">
                                                    <div className="absolute -top-[5px] left-4 w-2 h-2 bg-white dark:bg-gray-855 border-t border-l border-gray-300 dark:border-gray-600 rotate-45 transform"></div>
                                                    <div className="w-5 h-5 rounded bg-[#2E5A2E] text-white flex items-center justify-center text-[12px] font-black flex-shrink-0">!</div>
                                                    <span>{language === 'ta' ? 'தயவுசெய்து இந்த புலத்தை நிரப்பவும்.' : 'Please fill out this field.'}</span>
                                                </div>
                                            )}"""

new_mob_err = """                                            {fieldErrors.mobile && (
                                                <div className="relative mt-2 bg-white dark:bg-gray-850 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-800 dark:text-gray-200 text-[13px] font-normal flex items-center gap-2.5 w-fit shadow-md z-10">
                                                    <div className="absolute -top-[5px] left-4 w-2 h-2 bg-white dark:bg-gray-855 border-t border-l border-gray-300 dark:border-gray-600 rotate-45 transform"></div>
                                                    <div className="w-5 h-5 rounded bg-[#F59E0B] text-white flex items-center justify-center text-[12px] font-black flex-shrink-0">!</div>
                                                    <span>{language === 'ta' ? 'தயவுசெய்து இந்த புலத்தை நிரப்பவும்.' : 'Please fill out this field.'}</span>
                                                </div>
                                            )}"""
if old_mob_err in co_code:
    co_code = co_code.replace(old_mob_err, new_mob_err)
    print("Updated mobile error tooltip.")

# 4. address error
old_addr_err = """                                            {fieldErrors.address && (
                                                <div className="relative mt-2 bg-white dark:bg-gray-855 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-[#2E5A2E] dark:text-[#CBF9B2] text-[13px] italic font-medium flex items-center gap-2.5 w-fit shadow-md z-10">
                                                    <div className="absolute -top-[5px] left-4 w-2 h-2 bg-white dark:bg-gray-855 border-t border-l border-gray-300 dark:border-gray-600 rotate-45 transform"></div>
                                                    <div className="w-5 h-5 rounded bg-[#2E5A2E] text-white flex items-center justify-center text-[12px] font-black flex-shrink-0">!</div>
                                                    <span>{language === 'ta' ? 'தயவுசெய்து இந்த புலத்தை நிரப்பவும்.' : 'Please fill out this field.'}</span>
                                                </div>
                                            )}"""

new_addr_err = """                                            {fieldErrors.address && (
                                                <div className="relative mt-2 bg-white dark:bg-gray-850 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-800 dark:text-gray-200 text-[13px] font-normal flex items-center gap-2.5 w-fit shadow-md z-10">
                                                    <div className="absolute -top-[5px] left-4 w-2 h-2 bg-white dark:bg-gray-855 border-t border-l border-gray-300 dark:border-gray-600 rotate-45 transform"></div>
                                                    <div className="w-5 h-5 rounded bg-[#F59E0B] text-white flex items-center justify-center text-[12px] font-black flex-shrink-0">!</div>
                                                    <span>{language === 'ta' ? 'தயவுசெய்து இந்த புலத்தை நிரப்பவும்.' : 'Please fill out this field.'}</span>
                                                </div>
                                            )}"""
if old_addr_err in co_code:
    co_code = co_code.replace(old_addr_err, new_addr_err)
    print("Updated address error tooltip.")

# 5. city error
old_city_err = """                                            {fieldErrors.city && (
                                                <div className="relative mt-2 bg-white dark:bg-gray-855 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-[#2E5A2E] dark:text-[#CBF9B2] text-[13px] italic font-medium flex items-center gap-2.5 w-fit shadow-md z-10">
                                                    <div className="absolute -top-[5px] left-4 w-2 h-2 bg-white dark:bg-gray-855 border-t border-l border-gray-300 dark:border-gray-600 rotate-45 transform"></div>
                                                    <div className="w-5 h-5 rounded bg-[#2E5A2E] text-white flex items-center justify-center text-[12px] font-black flex-shrink-0">!</div>
                                                    <span>{language === 'ta' ? 'தயவுசெய்து இந்த புலத்தை நிரப்பவும்.' : 'Please fill out this field.'}</span>
                                                </div>
                                            )}"""

new_city_err = """                                            {fieldErrors.city && (
                                                <div className="relative mt-2 bg-white dark:bg-gray-850 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-800 dark:text-gray-200 text-[13px] font-normal flex items-center gap-2.5 w-fit shadow-md z-10">
                                                    <div className="absolute -top-[5px] left-4 w-2 h-2 bg-white dark:bg-gray-855 border-t border-l border-gray-300 dark:border-gray-600 rotate-45 transform"></div>
                                                    <div className="w-5 h-5 rounded bg-[#F59E0B] text-white flex items-center justify-center text-[12px] font-black flex-shrink-0">!</div>
                                                    <span>{language === 'ta' ? 'தயவுசெய்து இந்த புலத்தை நிரப்பவும்.' : 'Please fill out this field.'}</span>
                                                </div>
                                            )}"""
if old_city_err in co_code:
    co_code = co_code.replace(old_city_err, new_city_err)
    print("Updated city error tooltip.")

# 6. deliveryTime dropdown and error tooltip
old_dt_block = """                                    <select
                                        value={selectedTimeSlot || ''}
                                        onChange={(e) => {
                                            setSelectedTimeSlot(e.target.value);
                                            setFieldErrors(prev => ({ ...prev, deliveryTime: false }));
                                        }}
                                        className={`w-full px-4 py-3 bg-white dark:bg-gray-800 border ${fieldErrors.deliveryTime ? 'border-red-500 ring-2 ring-red-500/20' : 'border-gray-200 dark:border-gray-600'} rounded-xl text-gray-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-0 focus:border-[#2E5A2E] appearance-none cursor-pointer pr-10 transition-colors shadow-none outline-none`}
                                    >
                                        <option value="" disabled className="bg-white dark:bg-gray-800 text-gray-400">
                                            -- {t('Select Delivery Time Slot')} --
                                        </option>
                                        {availableDeliverySlots && availableDeliverySlots.length > 0 ? (
                                            availableDeliverySlots.map(slotId => (
                                                <option key={slotId} value={slotId} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white py-2">
                                                    {formatDeliveryRange(slotId)}
                                                </option>
                                            ))
                                        ) : (
                                            <option value="" disabled className="bg-white dark:bg-gray-800 text-gray-400">
                                                {t('No delivery slots available')}
                                            </option>
                                        )}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-gray-500 dark:text-gray-400">
                                        <ChevronDown size={18} />
                                    </div>
                                </div>
                                {fieldErrors.deliveryTime && (
                                    <div className="relative mt-2 bg-white dark:bg-gray-855 border border-red-300 dark:border-red-600 rounded-lg px-3 py-2 text-red-600 dark:text-red-400 text-[13px] italic font-medium flex items-center gap-2.5 w-fit shadow-md z-10">
                                        <div className="w-5 h-5 rounded bg-red-500 text-white flex items-center justify-center text-[12px] font-black flex-shrink-0">!</div>
                                        <span>{language === 'ta' ? 'தயவுசெய்து டெலிவரி நேரத்தைத் தேர்ந்தெடுக்கவும்.' : 'Please select a delivery time slot.'}</span>
                                    </div>
                                )}"""

new_dt_block = """                                    <select
                                        value={selectedTimeSlot || ''}
                                        onChange={(e) => {
                                            setSelectedTimeSlot(e.target.value);
                                            setFieldErrors(prev => ({ ...prev, deliveryTime: false }));
                                        }}
                                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-0 focus:border-[#2E5A2E] appearance-none cursor-pointer pr-10 transition-colors shadow-none outline-none"
                                    >
                                        <option value="" disabled className="bg-white dark:bg-gray-800 text-gray-400">
                                            -- {t('Select Delivery Time Slot')} --
                                        </option>
                                        {availableDeliverySlots && availableDeliverySlots.length > 0 ? (
                                            availableDeliverySlots.map(slotId => (
                                                <option key={slotId} value={slotId} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white py-2">
                                                    {formatDeliveryRange(slotId)}
                                                </option>
                                            ))
                                        ) : (
                                            <option value="" disabled className="bg-white dark:bg-gray-800 text-gray-400">
                                                {t('No delivery slots available')}
                                            </option>
                                        )}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-gray-500 dark:text-gray-400">
                                        <ChevronDown size={18} />
                                    </div>
                                </div>
                                {fieldErrors.deliveryTime && (
                                    <div className="relative mt-2 bg-white dark:bg-gray-850 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-800 dark:text-gray-200 text-[13px] font-normal flex items-center gap-2.5 w-fit shadow-md z-10">
                                        <div className="absolute -top-[5px] left-4 w-2 h-2 bg-white dark:bg-gray-855 border-t border-l border-gray-300 dark:border-gray-600 rotate-45 transform"></div>
                                        <div className="w-5 h-5 rounded bg-[#F59E0B] text-white flex items-center justify-center text-[12px] font-black flex-shrink-0">!</div>
                                        <span>{language === 'ta' ? 'தயவுசெய்து டெலிவரி நேரத்தைத் தேர்ந்தெடுக்கவும்.' : 'Please select a delivery time slot.'}</span>
                                    </div>
                                )}"""

if old_dt_block in co_code:
    co_code = co_code.replace(old_dt_block, new_dt_block)
    print("Updated deliveryTime error tooltip.")
else:
    print("Warning: old_dt_block not matched directly!")

with open('src/pages/Checkout.jsx', 'w', encoding='utf-8') as f:
    f.write(co_code)
print("Updated Checkout.jsx successfully.")
