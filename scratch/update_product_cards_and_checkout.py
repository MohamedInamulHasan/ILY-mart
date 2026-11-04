import re

# 1. Update ProductCard.jsx to make quantity pill rectangular
with open('src/components/ProductCard.jsx', 'r', encoding='utf-8') as f:
    pc_content = f.read()

pc_content = pc_content.replace(
    'className="flex items-center gap-1 bg-gray-100/80 dark:bg-gray-700/80 p-0.5 rounded-2xl shadow-sm"',
    'className="flex items-center gap-1 bg-gray-100/80 dark:bg-gray-700/80 p-0.5 rounded-lg shadow-sm"'
)

with open('src/components/ProductCard.jsx', 'w', encoding='utf-8') as f:
    f.write(pc_content)
print("Updated ProductCard.jsx: quantity pill is now rectangular (rounded-lg)!")

# 2. Update SimpleProductCard.jsx to make quantity pill rectangular
with open('src/components/SimpleProductCard.jsx', 'r', encoding='utf-8') as f:
    spc_content = f.read()

spc_content = spc_content.replace(
    'className="flex items-center gap-1 bg-gray-100/80 dark:bg-gray-700/80 p-0.5 rounded-2xl shadow-sm"',
    'className="flex items-center gap-1 bg-gray-100/80 dark:bg-gray-700/80 p-0.5 rounded-lg shadow-sm"'
)

with open('src/components/SimpleProductCard.jsx', 'w', encoding='utf-8') as f:
    f.write(spc_content)
print("Updated SimpleProductCard.jsx: quantity pill is now rectangular (rounded-lg)!")

# 3. Update Checkout.jsx:
# - Remove inner grey card from Shipping details, put address directly in card
# - Remove outer Payment Method card, make Cash on Delivery directly as white card with black svg outline and black text
with open('src/pages/Checkout.jsx', 'r', encoding='utf-8') as f:
    co_content = f.read()

# Replace Shipping details inner card:
# Target:
old_shipping_block = """                            <div className="flex items-center gap-2.5 mb-3.5">
                                <div className="w-9 h-9 rounded-xl bg-green-50 dark:bg-[#CBF9B2]/10 flex items-center justify-center text-[#2E5A2E] dark:text-[#CBF9B2]">
                                    <MapPin size={18} />
                                </div>
                                <h2 className="text-[17px] font-bold text-gray-900 dark:text-white">{t('Shipping details')}</h2>
                            </div>

                            {!isInitialized || authLoading ? (
                                <div className="animate-pulse space-y-4">
                                     <div className="h-32 bg-gray-50 dark:bg-gray-700 rounded-2xl w-full"></div>
                                </div>
                            ) : !isEditingAddress ? (
                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3.5 sm:p-4 border border-gray-100 dark:border-gray-600 relative group">
                                    <button 
                                        type="button"
                                        onClick={() => setIsEditingAddress(true)}
                                        className="absolute top-4 right-4 p-2 text-gray-400 hover:text-[#2E5A2E] dark:hover:text-[#CBF9B2] transition-colors"
                                    >
                                        <Pencil size={16} />
                                    </button>
                                    <div className="space-y-1.5">
                                        {/* 1. Name */}
                                        <p className="font-bold text-[16px] text-gray-900 dark:text-white">
                                            {formData.fullName || t('No Name')}
                                        </p>

                                        {/* 2. Number */}
                                        {formData.mobile && (
                                            <p className="text-[13px] font-semibold text-gray-600 dark:text-gray-300">
                                                {formData.mobile}
                                            </p>
                                        )}

                                        {/* 3. Address */}
                                        <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed">
                                            {formData.address}{formData.city ? `, ${formData.city}` : ''}
                                        </p>
                                        
                                        {/* 4. Pin / View on Map */}
                                        {formData.location && (
                                            <div className="pt-1">
                                                <button
                                                    type="button"
                                                    onClick={() => openExternalLink(formData.location)}
                                                    className="inline-flex items-center gap-1.5 text-[#2E5A2E] dark:text-[#CBF9B2] text-[11px] font-bold bg-green-50 dark:bg-[#CBF9B2]/10 px-3 py-1.5 rounded-full hover:bg-green-100 dark:hover:bg-[#CBF9B2]/20 transition-all border border-[#2E5A2E]/10 dark:border-[#CBF9B2]/20"
                                                >
                                                    <MapPin size={13} className="text-[#2E5A2E] dark:text-[#CBF9B2]" />
                                                    <span>{t('View on Map')}</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : ("""

new_shipping_block = """                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-xl bg-green-50 dark:bg-[#CBF9B2]/10 flex items-center justify-center text-[#2E5A2E] dark:text-[#CBF9B2]">
                                        <MapPin size={18} />
                                    </div>
                                    <h2 className="text-[17px] font-bold text-gray-900 dark:text-white">{t('Shipping details')}</h2>
                                </div>
                                {!isEditingAddress && (
                                    <button 
                                        type="button"
                                        onClick={() => setIsEditingAddress(true)}
                                        className="p-2 text-gray-400 hover:text-[#2E5A2E] dark:hover:text-[#CBF9B2] transition-colors"
                                        title={t('Edit Address')}
                                    >
                                        <Pencil size={16} />
                                    </button>
                                )}
                            </div>

                            {!isInitialized || authLoading ? (
                                <div className="animate-pulse space-y-2">
                                     <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-1/3"></div>
                                     <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-1/4"></div>
                                     <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-3/4"></div>
                                </div>
                            ) : !isEditingAddress ? (
                                <div className="space-y-1.5 pl-1 sm:pl-2">
                                    {/* 1. Name */}
                                    <p className="font-bold text-[16px] text-gray-900 dark:text-white">
                                        {formData.fullName || t('No Name')}
                                    </p>

                                    {/* 2. Number */}
                                    {formData.mobile && (
                                        <p className="text-[13px] font-semibold text-gray-600 dark:text-gray-300">
                                            {formData.mobile}
                                        </p>
                                    )}

                                    {/* 3. Address */}
                                    <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed">
                                        {formData.address}{formData.city ? `, ${formData.city}` : ''}
                                    </p>
                                    
                                    {/* 4. Pin / View on Map */}
                                    {formData.location && (
                                        <div className="pt-1.5">
                                            <button
                                                type="button"
                                                onClick={() => openExternalLink(formData.location)}
                                                className="inline-flex items-center gap-1.5 text-[#2E5A2E] dark:text-[#CBF9B2] text-[11px] font-bold bg-green-50 dark:bg-[#CBF9B2]/10 px-3 py-1.5 rounded-full hover:bg-green-100 dark:hover:bg-[#CBF9B2]/20 transition-all border border-[#2E5A2E]/10 dark:border-[#CBF9B2]/20"
                                            >
                                                <MapPin size={13} className="text-[#2E5A2E] dark:text-[#CBF9B2]" />
                                                <span>{t('View on Map')}</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : ("""

# Replace Payment Method block
old_payment_block = """                        {/* Payment Method */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-3.5 sm:p-4">
                            <div className="flex items-center gap-2.5 mb-3.5">
                                <div className="w-10 h-10 rounded-2xl bg-green-50 dark:bg-[#CBF9B2]/20 flex items-center justify-center text-[#2E5A2E] dark:text-[#CBF9B2]">
                                    <CreditCard size={20} />
                                </div>
                                <h2 className="text-[17px] font-bold text-gray-900 dark:text-white">{t('Payment Method')}</h2>
                            </div>

                            <div className="space-y-4">
                                <label className={`flex items-center p-3.5 sm:p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                                    formData.paymentMethod === 'cod'
                                        ? 'bg-black text-white border-black shadow-md'
                                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300'
                                }`}>
                                    {/* 3 Green Cash Notes with White Outline (No outer square) */}
                                    <div className="mr-3.5 flex-shrink-0 flex items-center justify-center select-none">
                                        <svg width="42" height="34" viewBox="0 0 42 34" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 drop-shadow-sm">
                                            {/* Back note (tilted left) */}
                                            <g transform="rotate(-9 19 15)">
                                                <rect x="3" y="5" width="29" height="16" rx="3" fill="#009922" stroke="#FFFFFF" strokeWidth="1.6" />
                                                <circle cx="17.5" cy="13" r="3" stroke="#FFFFFF" strokeWidth="1.1" fill="none" />
                                                <circle cx="7.5" cy="13" r="1.1" fill="#FFFFFF" />
                                                <circle cx="27.5" cy="13" r="1.1" fill="#FFFFFF" />
                                            </g>
                                            {/* Middle note (tilted right) */}
                                            <g transform="rotate(7 21 16)">
                                                <rect x="5" y="6" width="29" height="16" rx="3" fill="#00B329" stroke="#FFFFFF" strokeWidth="1.6" />
                                                <circle cx="19.5" cy="14" r="3" stroke="#FFFFFF" strokeWidth="1.1" fill="none" />
                                                <circle cx="9.5" cy="14" r="1.1" fill="#FFFFFF" />
                                                <circle cx="29.5" cy="14" r="1.1" fill="#FFFFFF" />
                                            </g>
                                            {/* Front note (prominent, straight) */}
                                            <g>
                                                <rect x="5" y="10" width="31" height="17.5" rx="3.2" fill="#00B329" stroke="#FFFFFF" strokeWidth="1.8" />
                                                <circle cx="20.5" cy="18.7" r="3.5" stroke="#FFFFFF" strokeWidth="1.2" fill="none" />
                                                <circle cx="10" cy="18.7" r="1.2" fill="#FFFFFF" />
                                                <circle cx="31" cy="18.7" r="1.2" fill="#FFFFFF" />
                                                <rect x="7.5" y="12" width="26" height="13.5" rx="2" stroke="#FFFFFF" strokeWidth="0.8" strokeDasharray="1.5 1.5" fill="none" opacity="0.85" />
                                            </g>
                                        </svg>
                                    </div>
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="cod"
                                        checked={formData.paymentMethod === 'cod'}
                                        onChange={handleChange}
                                        className="hidden"
                                    />
                                    <div className="flex-1">
                                        <span className="block font-bold text-[15.5px] leading-tight text-white">
                                            {t('Cash on Delivery')}
                                        </span>
                                        <span className="block text-[12.5px] font-medium mt-0.5 text-gray-300">
                                            {t('Pay when you receive your order')}
                                        </span>
                                    </div>
                                </label>
                            </div>
                        </div>"""

new_payment_block = """                        {/* Cash on Delivery Card (Direct White Card with Black outline SVG & Black Texts) */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-3.5 sm:p-4">
                            <label className="flex items-center cursor-pointer w-full select-none">
                                {/* 3 Green Cash Notes with Black Outline */}
                                <div className="mr-3.5 flex-shrink-0 flex items-center justify-center">
                                    <svg width="42" height="34" viewBox="0 0 42 34" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                                        {/* Back note (tilted left) */}
                                        <g transform="rotate(-9 19 15)">
                                            <rect x="3" y="5" width="29" height="16" rx="3" fill="#009922" stroke="#000000" strokeWidth="1.6" />
                                            <circle cx="17.5" cy="13" r="3" stroke="#000000" strokeWidth="1.1" fill="none" />
                                            <circle cx="7.5" cy="13" r="1.1" fill="#000000" />
                                            <circle cx="27.5" cy="13" r="1.1" fill="#000000" />
                                        </g>
                                        {/* Middle note (tilted right) */}
                                        <g transform="rotate(7 21 16)">
                                            <rect x="5" y="6" width="29" height="16" rx="3" fill="#00B329" stroke="#000000" strokeWidth="1.6" />
                                            <circle cx="19.5" cy="14" r="3" stroke="#000000" strokeWidth="1.1" fill="none" />
                                            <circle cx="9.5" cy="14" r="1.1" fill="#000000" />
                                            <circle cx="29.5" cy="14" r="1.1" fill="#000000" />
                                        </g>
                                        {/* Front note (prominent, straight) */}
                                        <g>
                                            <rect x="5" y="10" width="31" height="17.5" rx="3.2" fill="#00B329" stroke="#000000" strokeWidth="1.8" />
                                            <circle cx="20.5" cy="18.7" r="3.5" stroke="#000000" strokeWidth="1.2" fill="none" />
                                            <circle cx="10" cy="18.7" r="1.2" fill="#000000" />
                                            <circle cx="31" cy="18.7" r="1.2" fill="#000000" />
                                            <rect x="7.5" y="12" width="26" height="13.5" rx="2" stroke="#000000" strokeWidth="0.8" strokeDasharray="1.5 1.5" fill="none" opacity="0.85" />
                                        </g>
                                    </svg>
                                </div>
                                <input
                                    type="radio"
                                    name="paymentMethod"
                                    value="cod"
                                    checked={formData.paymentMethod === 'cod'}
                                    onChange={handleChange}
                                    className="hidden"
                                />
                                <div className="flex-1">
                                    <span className="block font-bold text-[16px] leading-tight text-gray-900 dark:text-white">
                                        {t('Cash on Delivery')}
                                    </span>
                                    <span className="block text-[12.5px] font-medium mt-0.5 text-gray-500 dark:text-gray-400">
                                        {t('Pay when you receive your order')}
                                    </span>
                                </div>
                            </label>
                        </div>"""

co_content = co_content.replace(old_shipping_block.replace('\r\n', '\n'), new_shipping_block.replace('\r\n', '\n'))
co_content = co_content.replace(old_payment_block.replace('\r\n', '\n'), new_payment_block.replace('\r\n', '\n'))

with open('src/pages/Checkout.jsx', 'w', encoding='utf-8') as f:
    f.write(co_content)
print("Updated Checkout.jsx: shipping details without inner grey card, and COD direct white card with black outline & black text!")
