import re

file_path = 'src/components/IncomingOrderModal.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Ensure import of formatOrderBannerTime
if 'formatOrderBannerTime' not in content:
    content = content.replace(
        "import { CartoonCoin } from './CartoonCoin';",
        "import { CartoonCoin } from './CartoonCoin';\nimport { formatOrderBannerTime } from '../utils/dateUtils';"
    )

# 2. Update viewMode === 'view' compact modal to have black header bar
old_view_card = """                    {/* Top right: Black X to dismiss */}
                    <div className="absolute top-4 right-4 z-10">
                        <button
                            type="button"
                            onClick={handleDismissView}
                            title={t('Close')}
                            className="p-1 text-black dark:text-white hover:opacity-70 transition-opacity active:scale-90"
                        >
                            <X size={22} className="stroke-[2.5]" />
                        </button>
                    </div>

                    {/* Delivery Charge Header */}
                    <div className="pt-2 pb-1 text-center">"""

new_view_card = """                    {/* Upper Black Header Bar with Order ID, |, Clock Icon, Time, and X on right in white */}
                    <div className="bg-black -mx-6 -mt-6 px-5 py-3 rounded-t-[2.5rem] flex items-center justify-between text-white shrink-0 mb-4">
                        {/* Left: #Order ID | 🕒 Nov 6, 8.00 PM */}
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm sm:text-[15px] font-black tracking-wide text-white font-mono shrink-0">
                                #{orderIdShort}
                            </span>
                            <span className="text-white/40 text-sm font-normal shrink-0">|</span>
                            <Clock size={16} className="text-white shrink-0" />
                            <span className="text-sm sm:text-[15px] font-bold text-white tracking-wide truncate">
                                {formatOrderBannerTime(order.createdAt || order.date) || formattedOrderTime || t('New Order')}
                            </span>
                        </div>

                        {/* Right: X in White */}
                        <button
                            type="button"
                            onClick={handleDismissView}
                            title={t('Close')}
                            className="p-1 -mr-1 hover:bg-white/20 active:scale-90 rounded-full text-white transition-all flex items-center justify-center cursor-pointer shrink-0 ml-2"
                        >
                            <X size={18} className="text-white stroke-[2.5]" />
                        </button>
                    </div>

                    {/* Delivery Charge Header */}
                    <div className="pt-1 pb-1 text-center">"""

if old_view_card in content:
    content = content.replace(old_view_card, new_view_card)
    print("Updated compact view header")
else:
    print("Old compact view not found")

# 3. Update viewMode === 'accept' full view header
old_accept_header = """                {/* Top Header Section - Clean Solid Background, Grey Texts & Green Price */}
                <div className="bg-white dark:bg-gray-800 pt-7 pb-4 px-6 relative text-center shrink-0 border-b border-gray-100 dark:border-gray-750">
                    {/* Top right controls: Black X (no round background) */}
                    <div className="absolute top-4 right-4 flex items-center">
                        <button
                            type="button"
                            onClick={handleDismissView}
                            title={t('Close')}
                            className="p-1 text-black dark:text-white hover:opacity-70 transition-opacity active:scale-90"
                        >
                            <X size={22} className="stroke-[2.5]" />
                        </button>
                    </div>

                    {/* Top Label: Delivery Charge in Dark Grey */}
                    <span className="text-[11px] font-bold uppercase tracking-widest text-gray-600 dark:text-gray-300 block mb-0.5">
                        {t('Delivery Charge')}
                    </span>

                    {/* Delivery Charge Price in BLACK */}
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

                    {/* Plain text: Cash on Delivery in Dark Grey */}
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mt-1">
                        {t(paymentType || 'Cash on Delivery')}
                    </p>

                    {/* User Ordered Time in Dark Grey */}
                    {formattedOrderTime && (
                        <p className="text-xs text-gray-700 dark:text-gray-300 mt-0.5 flex items-center justify-center gap-1 font-semibold">
                            <Clock size={12} className="text-gray-600 dark:text-gray-400" />
                            <span>{t('Ordered at')} {formattedOrderTime}</span>
                        </p>
                    )}
                </div>"""

new_accept_header = """                {/* Upper Black Header Bar with Order ID, |, Clock Icon, Time, and X on right in white */}
                <div className="bg-black px-5 py-3 flex items-center justify-between text-white shrink-0">
                    {/* Left: #Order ID | 🕒 Nov 6, 8.00 PM */}
                    <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm sm:text-[15px] font-black tracking-wide text-white font-mono shrink-0">
                            #{orderIdShort}
                        </span>
                        <span className="text-white/40 text-sm font-normal shrink-0">|</span>
                        <Clock size={16} className="text-white shrink-0" />
                        <span className="text-sm sm:text-[15px] font-bold text-white tracking-wide truncate">
                            {formatOrderBannerTime(order.createdAt || order.date) || formattedOrderTime || t('New Order')}
                        </span>
                    </div>

                    {/* Right: X in White */}
                    <button
                        type="button"
                        onClick={handleDismissView}
                        title={t('Close')}
                        className="p-1 -mr-1 hover:bg-white/20 active:scale-90 rounded-full text-white transition-all flex items-center justify-center cursor-pointer shrink-0 ml-2"
                    >
                        <X size={18} className="text-white stroke-[2.5]" />
                    </button>
                </div>

                {/* Top Delivery Charge Section */}
                <div className="bg-white dark:bg-gray-800 pt-5 pb-3.5 px-6 text-center shrink-0 border-b border-gray-100 dark:border-gray-750">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-gray-600 dark:text-gray-300 block mb-0.5">
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

if old_accept_header in content:
    content = content.replace(old_accept_header, new_accept_header)
    print("Updated accept view header")
else:
    print("Old accept header not found")

# 4. Update the 3 cards (Shipping, Items, Payment)
# Find the scrollable section:
start_cards = content.find('{/* Scrollable Order Details Section */}')
end_cards = content.find('{/* Bottom Action Area with safe mobile footer padding */}')

if start_cards != -1 and end_cards != -1:
    new_cards_section = """{/* Scrollable Order Details Section matching OrderDetails.jsx exactly */}
                <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
                    {/* CARD 1: Shipping Details Card - Matching Order Details Design */}
                    <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="p-5 border-b border-gray-50 dark:border-gray-700 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-50 dark:bg-[#CBF9B2]/20 rounded-lg text-[#2E5A2E] dark:text-[#CBF9B2]">
                                    <MapPin size={18} />
                                </div>
                                <h3 className="font-medium text-gray-900 dark:text-white text-base">{t('Shipping details')}</h3>
                            </div>
                            {customerPhone && (
                                <a
                                    href={`tel:${customerPhone}`}
                                    className="relative overflow-hidden flex items-center gap-2 px-4 py-2 rounded-xl bg-black dark:bg-black text-white text-xs font-black uppercase tracking-wider active:scale-95 transition-transform shadow-md select-none border border-black/80"
                                >
                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent pointer-events-none"
                                        animate={{ x: ['-100%', '150%'] }}
                                        transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                                    />
                                    <Phone size={14} className="stroke-[2.5] relative z-10 text-white" />
                                    <span className="relative z-10">{t('Call')}</span>
                                </a>
                            )}
                        </div>
                        <div className="p-6">
                            <div className="pl-2 sm:pl-4 space-y-1.5">
                                {/* 1. Name */}
                                <p className="font-bold text-[16px] text-gray-900 dark:text-white">
                                    {customerName}
                                </p>

                                {/* 2. Number */}
                                {customerPhone && (
                                    <p className="text-[13px] font-semibold text-gray-600 dark:text-gray-300">
                                        {customerPhone}
                                    </p>
                                )}

                                {/* 3. Address */}
                                <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed">
                                    {street}{city ? `, ${city}` : ''}{zip ? ` - ${zip}` : ''}
                                </p>

                                {/* 4. Pin / View on Map */}
                                {dropMapsUrl && (
                                    <div className="pt-1">
                                        <a
                                            href={dropMapsUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 text-[#2E5A2E] dark:text-[#CBF9B2] text-[11px] font-bold bg-green-50 dark:bg-[#CBF9B2]/10 px-3 py-1.5 rounded-full hover:bg-green-100 dark:hover:bg-[#CBF9B2]/20 transition-all border border-[#2E5A2E]/10 dark:border-[#CBF9B2]/20 shadow-xs"
                                        >
                                            <Navigation size={13} className="text-[#2E5A2E] dark:text-[#CBF9B2]" />
                                            <span>{t('View on Map')}</span>
                                        </a>
                                    </div>
                                )}
                            </div>

                            {/* 5. Scheduled Delivery Time */}
                            {scheduledTimeDisplay && !String(scheduledTimeDisplay).toLowerCase().includes('instant') && (
                                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                    <div className="flex items-center gap-3 text-[#2E5A2E] dark:text-[#CBF9B2]">
                                        <div className="w-10 h-10 rounded-full bg-green-50 dark:bg-[#CBF9B2]/10 flex items-center justify-center shrink-0">
                                            <Clock size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{t('Scheduled Delivery')}</p>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {scheduledTimeDisplay}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* CARD 2: Items Ordered Card - Matching Order Details Design */}
                    <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="p-4 border-b border-gray-50 dark:border-gray-700 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-green-50 dark:bg-[#CBF9B2]/10 rounded-lg text-[#2E5A2E] dark:text-[#CBF9B2]">
                                    <Package size={18} />
                                </div>
                                <h3 className="font-bold text-gray-900 dark:text-white">{t('Items Ordered')} ({items.length})</h3>
                            </div>
                            <span className="text-xs font-mono font-bold text-gray-400">
                                #{orderIdShort}
                            </span>
                        </div>
                        <div className="divide-y divide-gray-50 dark:divide-gray-700">
                            {items.map((item, index) => (
                                <div key={index} className="p-5 flex gap-4 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors first:pt-5">
                                    <div className="h-16 w-16 bg-gray-50 border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden flex-shrink-0 relative">
                                        <img
                                            src={getItemImage(item)}
                                            alt={item.name}
                                            className="h-full w-full object-cover"
                                            onError={(e) => { e.target.onerror = null; e.target.src = "https://via.placeholder.com/150?text=Product"; }}
                                        />
                                        {/* Status Tags */}
                                        <div className="absolute top-0 left-0 flex flex-col items-start gap-0 z-10">
                                            {((item.isGold) || (item.product && item.product.isGold)) && (
                                                <span className="bg-[#16A34A] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-br-lg shadow-sm mb-[1px]">
                                                    {t('Free Delivery')}
                                                </span>
                                            )}
                                            {item.isFromAd && !item.isGold && !(item.product && item.product.isGold) && (
                                                <span className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-br-lg shadow-sm">
                                                    {t('Special Offer')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate mb-0.5" title={item.name}>
                                            {item.name}
                                        </h4>
                                        {(item.storeId || item.storeName) && (
                                            <p className="text-xs font-normal text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                                {getItemStoreName(item)}
                                            </p>
                                        )}
                                        <div className="flex items-center justify-between mt-1">
                                            <div>
                                                <p className="text-[15px] font-bold text-gray-900 dark:text-white leading-none">
                                                    ₹{Number(item.price * item.quantity).toFixed(0)}
                                                </p>
                                                {(item.unit || item.product?.unit) && (
                                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium mt-1">
                                                        {item.unit || item.product?.unit}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700/50 rounded-md text-xs font-bold text-gray-500 dark:text-gray-400 shrink-0">
                                                x{item.quantity}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* CARD 3: Payment Summary Card - Matching Order Details Design */}
                    <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 p-6 text-[15px]">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <CreditCard size={18} className="text-gray-400" />
                            {t('Payment Summary')}
                        </h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between text-gray-500 dark:text-gray-400">
                                <span>{t('Item Total')}</span>
                                <span className="font-medium text-gray-900 dark:text-white">₹{Number(subtotal).toFixed(0)}</span>
                            </div>
                            <div className="flex justify-between text-gray-500 dark:text-gray-400">
                                <span>{t('Delivery Fee')}</span>
                                {Number(deliveryCharge) <= 0 ? (
                                    <div className="text-right">
                                        <span className="text-[#2E5A2E] dark:text-[#CBF9B2] font-bold">{t('FREE')}</span>
                                        <p className="text-[11px] text-amber-700 dark:text-amber-400 font-bold flex items-center justify-end gap-1.5">
                                            <CartoonCoin size={17} /> <span>{t('Coin Applied')}</span>
                                        </p>
                                    </div>
                                ) : (
                                    <span className="font-medium text-gray-900 dark:text-white">₹{Number(deliveryCharge).toFixed(0)}</span>
                                )}
                            </div>
                            {order.discount > 0 && (
                                <div className="flex justify-between text-green-600">
                                    <span>{t('Discount')}</span>
                                    <span>-₹{Number(order.discount).toFixed(0)}</span>
                                </div>
                            )}
                            <div className="pt-3 border-t border-gray-100 dark:border-gray-700 mt-3 pt-3 flex justify-between items-end">
                                <span className="font-bold text-gray-900 dark:text-white">{t('Total to Collect')}</span>
                                <span className="text-2xl font-black text-gray-900 dark:text-white">
                                    ₹{Number(totalAmount).toFixed(0)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                """
    content = content[:start_cards] + new_cards_section + content[end_cards:]
    print("Updated 3 cards section")
else:
    print(f"Cards section not found: {start_cards}, {end_cards}")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("SUCCESSFULLY APPLIED TO IncomingOrderModal.jsx")

