import os

cart_path = r'src\pages\Cart.jsx'
with open(cart_path, 'r', encoding='utf-8') as f:
    content = f.read().replace('\r\n', '\n')

old_cart_body = """            {/* Scrollable Container */}
            <div className="flex-1 overflow-y-auto px-5 pt-[90px] pb-12 no-scrollbar">

                {/* Items */}
                <div className="space-y-4 mb-6">
                    {cartItems.map((item) => (
                        <div key={item.id} className="bg-white dark:bg-gray-800 rounded-3xl p-3 flex gap-4 items-center relative shadow-[0_4px_20px_-5px_rgba(0,0,0,0.03)] border border-gray-100 dark:border-gray-700 transition-all duration-300">
                             {/* Image block */}
                             <div className="h-[90px] w-[100px] rounded-2xl overflow-hidden bg-[#F9FAFB] dark:bg-gray-800 flex-shrink-0 relative">
                                  <img 
                                      src={item.image || `${API_BASE_URL}/products/${item.id}/image`} 
                                      alt={item.title}
                                      className="h-full w-full object-cover" 
                                      onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/100x100?text=No+Image'; }}
                                  />
                                  <div className="absolute top-0 left-0 flex flex-col items-start gap-0 z-10">
                                      {item.isGold && (
                                          <span className="bg-[#16A34A] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-br-lg shadow-sm mb-[1px]">
                                              {t('Free Delivery')}
                                          </span>
                                      )}
                                      {item.isFromAd && (
                                          <span className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-br-lg shadow-sm">
                                              {t('Special Offer')}
                                          </span>
                                      )}
                                  </div>
                             </div>
                             
                             {/* Content block */}
                             <div className="flex-1 min-w-0 py-0.5 flex flex-col justify-between h-[90px]">
                                  {/* Top row: Title and Trash */}
                                  <div className="flex justify-between items-start">
                                       <div className="flex-1 min-w-0 pr-2">
                                            <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white truncate">
                                                {renderBilingualTitle(t(item, 'title') || item.title || item.name, language)}
                                            </h3>
                                            <p className="text-[12px] text-gray-400 dark:text-gray-500 mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
                                                {getStoreName(item.storeId, stores) || "ILY mart Direct"}
                                            </p>
                                       </div>
                                       <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500 mt-1 transition-colors">
                                            <Trash2 size={16} />
                                       </button>
                                  </div>

                                  {/* Bottom row: Price and Controls */}
                                  <div className="flex justify-between items-end mt-auto">
                                       <div className="flex flex-col">
                                            <div className="flex items-center gap-1.5">
                                                 <span className="text-[15px] font-extrabold text-gray-900 dark:text-white leading-none">
                                                     ₹ {(item.price * item.quantity).toFixed(0)}
                                                 </span>

                                            </div>
                                            {item.unit && (
                                                <span className="text-[10px] text-gray-400 font-medium mt-1">
                                                    {item.unit}
                                                </span>
                                            )}
                                       </div>

                                       <div className="flex items-center gap-3">
                                            <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="text-[#2E5A2E] hover:text-[#1E3A1E] active:scale-90 transition-transform">
                                                <Minus size={14} strokeWidth={2.5} />
                                            </button>
                                            <div className="w-8 h-8 rounded-full bg-[#2E5A2E] text-white flex items-center justify-center font-bold text-xs">
                                                {item.quantity}
                                            </div>
                                            <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="text-[#2E5A2E] hover:text-[#1E3A1E] active:scale-90 transition-transform">
                                                <Plus size={14} strokeWidth={2.5} />
                                            </button>
                                       </div>
                                  </div>
                             </div>
                        </div>
                    ))}
                </div>
                
                {/* Order Summary Integrated in Flow */}
                <div className="mt-4 bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.03)] border border-gray-100 dark:border-gray-700">
                     <div className="flex justify-between items-center mb-6">
                          <h2 className="text-[16px] font-extrabold text-gray-900 dark:text-white">{t('Payment')}</h2>
                          <span className="text-[12px] font-semibold text-gray-400">{cartItems.length} item{cartItems.length > 1 ? 's' : ''}</span>
                     </div>
    
                     <div className="space-y-4 mb-8">
                          <div className="flex justify-between items-center">
                               <span className="text-[14px] text-gray-400 font-medium">{t('Payment')}</span>
                               <span className="text-[15px] font-extrabold text-gray-900 dark:text-white">₹ {cartTotal.toFixed(0)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                               <span className="text-[14px] text-gray-400 font-medium">{t('Delivery')}</span>
                               {deliveryCharge === 0 ? (
                                   <span className="text-[15px] font-bold text-[#2E5A2E]">{t('FREE')}</span>
                               ) : (
                                   <span className="text-[15px] font-bold text-gray-900 dark:text-white">₹ {deliveryCharge.toFixed(0)}</span>
                               )}
                          </div>
                          <div className="flex justify-between items-center pt-2">
                               <span className="text-[15px] text-gray-500 font-medium">{t('Total')}</span>
                               <span className="text-[16px] font-bold text-gray-900 dark:text-white">₹ {finalTotal.toFixed(0)}</span>
                          </div>
                     </div>
    
                     <Link to="/checkout" className="w-full bg-black text-white rounded-full py-4 flex items-center justify-center font-normal text-[15px] active:scale-[0.98] transition-transform gap-2">
                           <span>{t('Proceed to Checkout')}</span>
                           <ShoppingBag size={20} />
                     </Link>
                </div>
                
            </div>"""

new_cart_body = """            {/* Scrollable Container */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-5 pt-[88px] pb-10 no-scrollbar">

                {/* Items */}
                <div className="space-y-2.5 sm:space-y-3 mb-3.5 sm:mb-4">
                    {cartItems.map((item) => (
                        <div key={item.id} className="bg-white dark:bg-gray-800 rounded-2xl p-2.5 sm:p-3 flex gap-3 items-center relative shadow-sm border border-gray-100 dark:border-gray-700 transition-all duration-300">
                             {/* Image block */}
                             <div className="h-[74px] w-[78px] sm:h-[80px] sm:w-[84px] rounded-xl overflow-hidden bg-[#F9FAFB] dark:bg-gray-800 flex-shrink-0 relative border border-gray-100/60 dark:border-gray-700/60">
                                  <img 
                                      src={item.image || `${API_BASE_URL}/products/${item.id}/image`} 
                                      alt={item.title}
                                      className="h-full w-full object-cover" 
                                      onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/100x100?text=No+Image'; }}
                                  />
                                  <div className="absolute top-0 left-0 flex flex-col items-start gap-0 z-10">
                                      {item.isGold && (
                                          <span className="bg-[#16A34A] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-br-lg shadow-sm mb-[1px]">
                                              {t('Free Delivery')}
                                          </span>
                                      )}
                                      {item.isFromAd && (
                                          <span className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-br-lg shadow-sm">
                                              {t('Special Offer')}
                                          </span>
                                      )}
                                  </div>
                             </div>
                             
                             {/* Content block */}
                             <div className="flex-1 min-w-0 py-0.5 flex flex-col justify-between h-[74px] sm:h-[80px]">
                                  {/* Top row: Title and Trash */}
                                  <div className="flex justify-between items-start">
                                       <div className="flex-1 min-w-0 pr-2">
                                            <h3 className="text-[13px] sm:text-[14px] font-semibold text-gray-900 dark:text-white truncate">
                                                {renderBilingualTitle(t(item, 'title') || item.title || item.name, language)}
                                            </h3>
                                            <p className="text-[11px] font-normal text-gray-400 dark:text-gray-500 mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
                                                {getStoreName(item.storeId, stores) || "ILY mart Direct"}
                                            </p>
                                       </div>
                                       <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500 p-0.5 transition-colors">
                                            <Trash2 size={16} />
                                       </button>
                                  </div>

                                  {/* Bottom row: Price and Controls */}
                                  <div className="flex justify-between items-end mt-auto">
                                       <div className="flex flex-col">
                                            <div className="flex items-center gap-1.5">
                                                 <span className="text-[14px] sm:text-[15px] font-extrabold text-gray-900 dark:text-white leading-none">
                                                     ₹ {(item.price * item.quantity).toFixed(0)}
                                                 </span>
                                            </div>
                                            {item.unit && (
                                                <span className="text-[10px] text-gray-400 font-medium mt-0.5">
                                                    {item.unit}
                                                </span>
                                            )}
                                       </div>

                                       <div className="flex items-center gap-2 sm:gap-2.5">
                                            <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 text-[#2E5A2E] hover:text-[#1E3A1E] active:scale-90 transition-transform">
                                                <Minus size={13} strokeWidth={2.5} />
                                            </button>
                                            <div className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-full bg-[#2E5A2E] text-white flex items-center justify-center font-bold text-xs">
                                                {item.quantity}
                                            </div>
                                            <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 text-[#2E5A2E] hover:text-[#1E3A1E] active:scale-90 transition-transform">
                                                <Plus size={13} strokeWidth={2.5} />
                                            </button>
                                       </div>
                                  </div>
                             </div>
                        </div>
                    ))}
                </div>
                
                {/* Order Summary Integrated in Flow */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                     <div className="flex justify-between items-center mb-3.5 pb-2.5 border-b border-gray-100/60 dark:border-gray-700/60">
                          <h2 className="text-[15px] sm:text-[16px] font-bold text-gray-900 dark:text-white">{t('Payment')}</h2>
                          <span className="text-[12px] font-medium text-gray-400">{cartItems.length} {t('items')}</span>
                     </div>
    
                     <div className="space-y-2.5 mb-4 sm:mb-5">
                          <div className="flex justify-between items-center">
                               <span className="text-[14px] text-gray-400 font-medium">{t('Subtotal')}</span>
                               <span className="text-[15px] font-extrabold text-gray-900 dark:text-white">₹ {cartTotal.toFixed(0)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                               <span className="text-[14px] text-gray-400 font-medium">{t('Delivery')}</span>
                               {deliveryCharge === 0 ? (
                                   <span className="text-[15px] font-bold text-[#2E5A2E]">{t('FREE')}</span>
                               ) : (
                                   <span className="text-[15px] font-bold text-gray-900 dark:text-white">₹ {deliveryCharge.toFixed(0)}</span>
                               )}
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-gray-50 dark:border-gray-700/40">
                               <span className="text-[15px] text-gray-500 font-medium">{t('Total')}</span>
                               <span className="text-[16px] font-extrabold text-gray-900 dark:text-white">₹ {finalTotal.toFixed(0)}</span>
                          </div>
                     </div>
    
                     <Link to="/checkout" className="w-full bg-black text-white rounded-full py-3 sm:py-3.5 flex items-center justify-center font-normal text-sm active:scale-[0.98] transition-transform gap-2">
                           <span>{t('Proceed to Checkout')}</span>
                           <ShoppingBag size={18} />
                     </Link>
                </div>
                
            </div>"""

if old_cart_body in content:
    content = content.replace(old_cart_body, new_cart_body)
    print("Cart.jsx body updated successfully!")
else:
    print("WARNING: old_cart_body not found!")

with open(cart_path, 'w', encoding='utf-8') as f:
    f.write(content)

