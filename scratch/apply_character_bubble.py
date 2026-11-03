# 1. Update src/index.css with custom animations
css_path = r"c:\Users\moham\ILAYANGUDI PROJECT\src\index.css"
with open(css_path, "r", encoding="utf-8") as f:
    css_content = f.read()

animation_styles = """
/* Character Swipe Up & Cloud Thought Bubble Pop */
@keyframes character-swipe-up {
    0% {
        transform: translateY(100%);
        opacity: 0;
    }
    100% {
        transform: translateY(0);
        opacity: 1;
    }
}

@keyframes cloud-pop {
    0% {
        transform: scale(0.7) translateY(20px);
        opacity: 0;
    }
    75% {
        transform: scale(1.03) translateY(-3px);
        opacity: 1;
    }
    100% {
        transform: scale(1) translateY(0);
        opacity: 1;
    }
}

.animate-character-swipe {
    animation: character-swipe-up 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.animate-cloud-pop {
    animation: cloud-pop 0.45s 0.12s cubic-bezier(0.16, 1, 0.3, 1) both;
}
"""

if "animate-character-swipe" not in css_content:
    css_content += animation_styles
    with open(css_path, "w", encoding="utf-8") as f:
        f.write(css_content)
    print("Added animations to src/index.css")
else:
    print("Animations already in index.css")

# 2. Update CartContext.jsx
cart_path = r"c:\Users\moham\ILAYANGUDI PROJECT\src\context\CartContext.jsx"
with open(cart_path, "r", encoding="utf-8") as f:
    cart_content = f.read()

# Add X import if needed
if "import { X } from 'lucide-react';" not in cart_content and "{ X }" not in cart_content:
    cart_content = "import { X } from 'lucide-react';\n" + cart_content

# Replace the multi-store warning popup
old_modal_start = '{/* Multi-Store Warning — Center Right Speech Bubble Popup with Blur Backdrop */}'
if old_modal_start in cart_content:
    parts = cart_content.split(old_modal_start)
    prefix = parts[0]
    # Find closing of provider
    suffix = parts[1].split('</CartContext.Provider>')[1]
    
    new_modal = '''{/* Multi-Store Warning — Character Swipe-Up & Thought Cloud Popup */}
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
                        {/* Floating Thought Cloud Bubble */}
                        <div className="relative bg-white dark:bg-gray-900 rounded-[28px] shadow-2xl border-2 border-emerald-500/20 dark:border-[#CBF9B2]/20 p-4 sm:p-5 max-w-[340px] sm:max-w-[360px] w-full animate-cloud-pop mb-1 z-10">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-sm">
                                        🛵
                                    </span>
                                    <span className="text-[12.5px] font-black text-gray-900 dark:text-white uppercase tracking-wider">
                                        {language === 'ta' ? 'கூடுதல் கட்டண அறிவிப்பு' : 'Different Store Notice'}
                                    </span>
                                </div>
                                <button
                                    onClick={cancelAddToCart}
                                    className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                                    aria-label="Close"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Visual Stores & Extra Charge Breakdown */}
                            <div className="space-y-2 mb-3 bg-gray-50 dark:bg-gray-800/70 p-3 rounded-2xl border border-gray-100 dark:border-gray-700/60 text-[12.5px]">
                                <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                                    <span className="flex items-center gap-1.5 font-medium">
                                        🛒 {language === 'ta' ? 'கூடையில் உள்ள கடை:' : 'In Cart:'}
                                    </span>
                                    <span className="font-bold text-gray-900 dark:text-white truncate max-w-[150px]">
                                        {warningStoreNames}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                                    <span className="flex items-center gap-1.5 font-medium">
                                        ➕ {language === 'ta' ? 'புதிய கடை:' : 'Adding From:'}
                                    </span>
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400 truncate max-w-[150px]">
                                        {newStoreName}
                                    </span>
                                </div>
                                <div className="h-[1px] bg-gray-200/70 dark:bg-gray-700 my-1"></div>
                                <div className="flex items-center justify-between text-gray-900 dark:text-white font-bold">
                                    <span>{language === 'ta' ? 'கூடுதல் டெலிவரி கட்டணம்:' : 'Extra Delivery Fee:'}</span>
                                    <span className="text-emerald-600 dark:text-emerald-400 font-black text-[14px]">
                                        +₹{extraCharge}
                                    </span>
                                </div>
                            </div>

                            {/* Easy-to-understand Explanation Message */}
                            <p className="text-[12px] sm:text-[12.5px] text-gray-600 dark:text-gray-300 text-center mb-3.5 leading-snug font-medium">
                                {language === 'ta' 
                                    ? `வேறு கடையில் இருந்து பொருள் சேர்க்கும்போது ₹${extraCharge} கூடுதல் கட்டணம் வசூலிக்கப்படும். சேர்க்கலாமா?` 
                                    : `Ordering from a different store adds an extra ₹${extraCharge} delivery fee. Do you want to add it?`}
                            </p>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                                <button
                                    onClick={cancelAddToCart}
                                    className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl text-xs sm:text-[13px] active:scale-95 transition-transform"
                                >
                                    {language === 'ta' ? 'வேண்டாம்' : 'Cancel'}
                                </button>
                                <button
                                    onClick={confirmAddToCart}
                                    className="flex-1 py-2.5 bg-[#CBF9B2] hover:bg-[#bbf2a0] text-gray-900 font-black rounded-xl text-xs sm:text-[13px] active:scale-95 transition-transform shadow-sm"
                                >
                                    {language === 'ta' ? `ஆம், சேர் (+₹${extraCharge})` : `Yes, Add (+₹${extraCharge})`}
                                </button>
                            </div>
                        </div>

                        {/* Thought Bubble Dots connecting cloud to delivery character */}
                        <div className="flex flex-col items-center gap-1 -my-0.5 z-10 select-none pointer-events-none">
                            <div className="w-3.5 h-3.5 bg-white dark:bg-gray-900 rounded-full shadow-md border border-emerald-500/20 dark:border-[#CBF9B2]/20"></div>
                            <div className="w-2 h-2 bg-white dark:bg-gray-900 rounded-full shadow-sm border border-emerald-500/20 dark:border-[#CBF9B2]/20"></div>
                        </div>

                        {/* Delivery Character Swiping Up from Bottom */}
                        <div className="relative flex justify-center -mt-2 animate-character-swipe z-0 select-none pointer-events-none">
                            <img 
                                src="/delivery-character.png" 
                                alt="Delivery Character" 
                                className="w-48 sm:w-56 max-h-[36vh] object-contain object-bottom select-none pointer-events-none drop-shadow-2xl"
                            />
                        </div>
                    </div>
                );
            })()}
        </CartContext.Provider>'''
    
    with open(cart_path, "w", encoding="utf-8") as f:
        f.write(prefix + new_modal + suffix)
    print("Updated CartContext.jsx with character swipe-up and thought bubble")
else:
    print("Could not find old modal marker in CartContext.jsx")

