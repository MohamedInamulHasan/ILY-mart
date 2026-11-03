import re

cart_path = r'src/pages/Cart.jsx'
with open(cart_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern for the entire item card inside cartItems.map
old_card_pattern = r'<div key=\{item\.id\} className="bg-white dark:bg-gray-800 rounded-2xl p-2\.5 sm:p-3 flex gap-3 items-center relative shadow-sm border border-gray-100 dark:border-gray-700 transition-all duration-300">.*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>'

new_card_replacement = """<div key={item.id} className="bg-white dark:bg-gray-800 rounded-2xl p-3 sm:p-3.5 flex gap-3.5 items-center relative shadow-sm border border-gray-100 dark:border-gray-700 transition-all duration-300">
                             {/* Image block */}
                             <div className="w-[78px] h-[78px] sm:w-[82px] sm:h-[82px] rounded-xl overflow-hidden bg-[#F9FAFB] dark:bg-gray-800 flex-shrink-0 relative border border-gray-100/60 dark:border-gray-700/60">
                                  <img 
                                      src={item.image || `${API_BASE_URL}/products/${item.id}/image`} 
                                      alt={item.title}
                                      className="h-full w-full object-cover" 
                                      onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/100x100?text=No+Image'; }}
                                  />
                             </div>
                             
                             {/* Content block */}
                             <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 min-h-[78px] sm:min-h-[82px]">
                                  {/* Top row: Title and Trash */}
                                  <div className="flex justify-between items-start">
                                       <div className="flex-1 min-w-0 pr-2">
                                            <h3 className="text-[13px] sm:text-[14px] font-semibold text-gray-900 dark:text-white leading-tight">
                                                {renderBilingualTitle(t(item, 'title') || item.title || item.name, language, { hideTag: true })}
                                            </h3>
                                            <p className="text-[11px] font-normal text-gray-400 dark:text-gray-500 mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
                                                {getStoreName(item.storeId, stores) || "ILY mart Direct"}
                                            </p>
                                       </div>
                                       <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500 p-0.5 transition-colors flex-shrink-0">
                                            <Trash2 size={16} />
                                       </button>
                                  </div>

                                  {/* Bottom row: Price and Controls */}
                                  <div className="flex justify-between items-end mt-1.5">
                                       <div className="flex flex-col justify-end">
                                            <span className="text-[14px] sm:text-[15px] font-extrabold text-gray-900 dark:text-white leading-tight">
                                                ₹ {(item.price * item.quantity).toFixed(0)}
                                            </span>
                                            {item.unit && (
                                                <span className="text-[10px] text-gray-400 font-medium leading-tight mt-0.5">
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
                        </div>"""

content = re.sub(old_card_pattern, new_card_replacement, content, flags=re.DOTALL)

with open(cart_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated Cart.jsx card padding and structure!")

