checkout_path = 'src/pages/Checkout.jsx'
with open(checkout_path, 'r', encoding='utf-8') as f:
    c = f.read()

target = """                                <label className={`flex items-center p-3.5 sm:p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                                    formData.paymentMethod === 'cod'
                                        ? 'bg-black text-white border-black shadow-md'
                                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300'
                                }`}>
                                    <div className="w-11 h-11 rounded-2xl bg-[#00B329]/20 border border-[#00B329]/40 text-[#00B329] flex items-center justify-center mr-3.5 flex-shrink-0 shadow-xs">
                                        <Banknote size={23} className="text-[#00B329] stroke-[2.2]" />
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
                                        <span className="block font-bold text-[15.5px] leading-tight">
                                            <span className="text-[#00B329]">
                                                {language === 'ta' ? 'பணம்' : 'Cash'}
                                            </span>{' '}
                                            <span className={formData.paymentMethod === 'cod' ? 'text-white' : 'text-gray-900 dark:text-white'}>
                                                {language === 'ta' ? 'செலுத்தும் டெலிவரி' : 'on Delivery'}
                                            </span>
                                        </span>
                                        <span className={`block text-[12.5px] font-medium mt-0.5 ${formData.paymentMethod === 'cod' ? 'text-gray-300' : 'text-gray-400 dark:text-gray-500'}`}>
                                            {t('Pay when you receive your order')}
                                        </span>
                                    </div>
                                </label>"""

replacement = """                                <label className={`flex items-center p-3.5 sm:p-4 rounded-2xl border-2 cursor-pointer transition-all ${
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
                                </label>"""

if target in c:
    c = c.replace(target, replacement)
    with open(checkout_path, 'w', encoding='utf-8') as f:
        f.write(c)
    print("Updated Checkout.jsx with 3 green notes and white cash text!")
else:
    print("ERROR: target not found in Checkout.jsx")
