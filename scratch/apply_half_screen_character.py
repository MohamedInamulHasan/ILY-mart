cart_path = r"c:\Users\moham\ILAYANGUDI PROJECT\src\context\CartContext.jsx"
with open(cart_path, "r", encoding="utf-8") as f:
    cart_content = f.read()

# Marker for the multi-store warning section
start_marker = '{/* Multi-Store Warning — Character Swipe-Up & Thought Cloud Popup */}'
end_marker = '</CartContext.Provider>'

new_section = '''{/* Multi-Store Warning — Half-Screen Character & Speech Bubble Above */}
            {showStoreWarning && (() => {
                const currentUniqueStores = new Set(
                    cartItems.map(item => (item.storeId?._id || item.storeId || '').toString()).filter(Boolean)
                );
                const isMultiStore = currentUniqueStores.size > 1;
                const currentCharge = 20 + (currentUniqueStores.size - 1) * 5;
                const newCharge = nextStoreCharge || (currentCharge + 5);
                const extraCharge = newCharge - currentCharge > 0 ? (newCharge - currentCharge) : 5;

                return (
                    <div 
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex flex-col items-center justify-end overflow-hidden pb-0 px-4 animate-in fade-in duration-300 pointer-events-auto"
                        onClick={(e) => { if (e.target === e.currentTarget) cancelAddToCart(); }}
                    >
                        {/* Speech Bubble Above Character - exact styling as before */}
                        <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 p-4 max-w-[290px] sm:max-w-[315px] w-full animate-cloud-pop mb-3 z-10">
                            {/* Speech Bubble Arrow Tail pointing down towards character's head */}
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[9px] border-t-white dark:border-t-gray-900 filter drop-shadow-[0_2px_1px_rgba(0,0,0,0.08)]"></div>

                            {/* Close button */}
                            <button
                                onClick={cancelAddToCart}
                                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-base font-bold"
                                aria-label={language === 'ta' ? 'வேண்டாம்' : 'Cancel'}
                            >
                                ×
                            </button>

                            {/* Label with Forest Green accent */}
                            <div className="flex items-center gap-1.5 mb-2">
                                <p className="text-[12px] font-extrabold text-[#2E5A2E] dark:text-[#CBF9B2] uppercase tracking-wider">
                                    {language === 'ta' ? 'கவனம்!' : 'NOTE!'}
                                </p>
                            </div>

                            {/* Main speech message — exact styling and text as before */}
                            <p className="text-[13px] italic font-semibold text-gray-800 dark:text-gray-100 leading-relaxed mb-3">
                                {isMultiStore ? (
                                    language === 'ta' ? (
                                        <>
                                            நீங்கள் ஏற்கனவே <span className="text-[#2E5A2E] dark:text-[#CBF9B2] font-black">{warningStoreNames}</span> ல் products add பண்ணிருக்கீங்க. Current delivery charge: <span className="text-[#2E5A2E] dark:text-[#CBF9B2] font-black">₹{currentCharge}</span>.
                                            <br />
                                            இப்போ <span className="text-[#2E5A2E] dark:text-[#CBF9B2] font-black">{newStoreName}</span> ல் இருந்து products add பண்ண, delivery charge <span className="text-[#2E5A2E] dark:text-[#CBF9B2] font-black">₹{newCharge}</span> (<span className="text-[#2E5A2E] dark:text-[#CBF9B2] font-bold">₹{extraCharge} extra</span>) ஆகும்.
                                            <br />
                                            Add பண்ணலாமா?
                                        </>
                                    ) : (
                                        <>
                                            Neenga already <span className="text-[#2E5A2E] dark:text-[#CBF9B2] font-black">{warningStoreNames}</span> la products add pannirukeenga. Current delivery charge: <span className="text-[#2E5A2E] dark:text-[#CBF9B2] font-black">₹{currentCharge}</span>.
                                            <br />
                                            Ippo <span className="text-[#2E5A2E] dark:text-[#CBF9B2] font-black">{newStoreName}</span> la irundhu products add panna, delivery charge <span className="text-[#2E5A2E] dark:text-[#CBF9B2] font-black">₹{newCharge}</span> (<span className="text-[#2E5A2E] dark:text-[#CBF9B2] font-bold">₹{extraCharge} extra</span>) aagum.
                                            <br />
                                            Add pannava?
                                        </>
                                    )
                                ) : (
                                    language === 'ta' ? (
                                        <>
                                            நீங்கள் ஏற்கனவே <span className="text-[#2E5A2E] dark:text-[#CBF9B2] font-black">{warningStoreNames}</span> ல் products add பண்ணிருக்கீங்க. Current delivery charge: <span className="text-[#2E5A2E] dark:text-[#CBF9B2] font-black">₹{currentCharge}</span>.
                                            <br />
                                            <span className="text-[#2E5A2E] dark:text-[#CBF9B2] font-black">{newStoreName}</span> ல் இருந்து add பண்ண <span className="text-[#2E5A2E] dark:text-[#CBF9B2] font-bold">₹5 extra charge</span> ஆகும்.
                                            <br />
                                            Add பண்ணலாமா?
                                        </>
                                    ) : (
                                        <>
                                            Neenga already <span className="text-[#2E5A2E] dark:text-[#CBF9B2] font-black">{warningStoreNames}</span> la products add pannirukeenga. Current delivery charge: <span className="text-[#2E5A2E] dark:text-[#CBF9B2] font-black">₹{currentCharge}</span>.
                                            <br />
                                            <span className="text-[#2E5A2E] dark:text-[#CBF9B2] font-black">{newStoreName}</span> la irundhu add panna <span className="text-[#2E5A2E] dark:text-[#CBF9B2] font-bold">₹5 extra charge</span> aagum.
                                            <br />
                                            Add pannava?
                                        </>
                                    )
                                )}
                            </p>

                            {/* Buttons */}
                            <div className="flex gap-2">
                                <button
                                    onClick={cancelAddToCart}
                                    className="flex-1 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl text-xs active:scale-95 transition-transform"
                                >
                                    {language === 'ta' ? 'வேண்டாம்' : 'Cancel'}
                                </button>
                                <button
                                    onClick={confirmAddToCart}
                                    className="flex-1 py-2 bg-[#CBF9B2] hover:bg-[#bbf2a0] text-gray-900 font-bold rounded-xl text-xs active:scale-95 transition-transform shadow-none border-none"
                                >
                                    {language === 'ta' ? 'ஆமாம்' : 'Yes'}
                                </button>
                            </div>
                        </div>

                        {/* Delivery Character — Half Screen Swipe-Up from Bottom */}
                        <div className="h-[46vh] sm:h-[50vh] flex justify-center items-end select-none pointer-events-none animate-character-swipe z-0 -mt-2">
                            <img 
                                src="/delivery-character.png" 
                                alt="Delivery Character" 
                                className="h-full w-auto max-w-full object-contain object-bottom drop-shadow-2xl"
                            />
                        </div>
                    </div>
                );
            })()}
        '''

if start_marker in cart_content:
    parts = cart_content.split(start_marker)
    prefix = parts[0]
    suffix = parts[1].split(end_marker)[1]
    with open(cart_path, "w", encoding="utf-8") as f:
        f.write(prefix + new_section + end_marker + suffix)
    print("Updated CartContext.jsx with half-screen character and original bubble style above")
else:
    print("Start marker not found in CartContext.jsx")

