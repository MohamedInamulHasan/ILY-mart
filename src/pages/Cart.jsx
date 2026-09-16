import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useUserProfile } from '../hooks/queries/useUsers';
import { useLanguage } from '../context/LanguageContext';
import { renderBilingualTitle } from '../utils/titleHelpers';
import { useData } from '../context/DataContext';
import { calculateDeliveryCharge, getStoreName } from '../utils/storeHelpers';
import { API_BASE_URL } from '../utils/api';

const Cart = () => {
    const { cartItems, removeFromCart, updateQuantity, cartTotal } = useCart();
    const { user } = useAuth();
    const { data: userProfile } = useUserProfile(); 
    const { t, language } = useLanguage();
    const { stores } = useData();
    const navigate = useNavigate();

    const currentUser = userProfile?.data || user;
    const hasCoins = currentUser?.coins > 0;
    const hasGoldProduct = cartItems.some(item => item.isGold);
    const baseDeliveryCharge = calculateDeliveryCharge(cartItems);
    const deliveryCharge = (hasCoins || hasGoldProduct) ? 0 : baseDeliveryCharge;
    const finalTotal = cartTotal + deliveryCharge;

    if (cartItems.length === 0) {
        return (
            <div className="min-h-screen bg-[#E8EAEF] dark:bg-gray-900 flex flex-col transition-colors duration-200">
                {/* Premium Green Header */}
                <div className="fixed top-0 left-0 right-0 z-50 w-full bg-[#CBF9B2] rounded-b-[2.5rem] px-4 pt-4 pb-4 shadow-sm overflow-hidden">
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/30 rounded-full blur-3xl pointer-events-none" />
                    <div className="relative z-10">
                        <div className="max-w-7xl mx-auto px-2 relative min-h-[42px]">
                            <div className="absolute left-2 top-1/2 -translate-y-1/2">
                                <button 
                                    onClick={() => navigate(-1)} 
                                    className="w-[42px] h-[42px] flex items-center justify-center bg-white dark:bg-white/80 rounded-full text-gray-900 transition-transform active:scale-95 shadow-sm border border-gray-100/50"
                                >
                                    <ArrowLeft size={22} />
                                </button>
                            </div>
                            <div className="flex flex-col items-center text-center pt-1">
                                <h1 className="text-[18px] font-bold text-gray-900 tracking-tight leading-tight">{t('Cart')}</h1>
                                <p className="text-[11px] font-semibold text-gray-700 mt-0.5">{t('Your selected items')}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Centered Empty State Content (Minimal Image 2 Style) */}
                <div className="flex-1 flex flex-col items-center justify-center text-center px-4 pt-[120px] pb-24 min-h-[60vh]">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white/90 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 shadow-sm">
                        <ShoppingBag className="text-gray-400 dark:text-gray-500" size={38} strokeWidth={1.5} />
                    </div>
                    <h2 className="text-[18px] sm:text-[20px] font-bold text-gray-900 dark:text-white mb-1.5 text-center">
                        {t('Your cart is empty')}
                    </h2>
                    <p className="text-[13px] sm:text-[14px] text-gray-500 dark:text-gray-400 max-w-xs mx-auto text-center font-normal">
                        {t('Products you add to your cart will appear here for checkout.')}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#E8EAEF] dark:bg-gray-900 flex flex-col transition-colors duration-200 relative overflow-hidden mx-auto max-w-md w-full my-auto pb-2">
            
            {/* Premium Green Header — matches Orders / Profile style */}
            <div className="fixed top-0 left-0 right-0 z-50 w-full bg-[#CBF9B2] dark:bg-[#CBF9B2] rounded-b-[2.5rem] px-4 pt-4 pb-4 shadow-sm overflow-hidden">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/30 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10">
                    <div className="w-full px-4 relative flex items-center justify-center min-h-[42px]">
                        <div className="absolute left-2 top-1/2 -translate-y-1/2">
                            <button onClick={() => navigate(-1)} className="w-[42px] h-[42px] flex items-center justify-center bg-white dark:bg-white/80 rounded-full text-gray-900 transition-transform active:scale-95 shadow-sm border border-gray-100/50">
                                <ArrowLeft size={22} />
                            </button>
                        </div>
                        <div className="flex flex-col text-center">
                            <h1 className="text-[18px] font-bold text-gray-900 tracking-tight leading-tight">{t('Cart')}</h1>
                            <p className="text-[11px] font-semibold text-gray-700 mt-0.5">{cartItems.length} {t('items')}</p>
                        </div>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            <div className="w-[42px] h-[42px] flex items-center justify-center bg-white dark:bg-white/80 rounded-full shadow-sm border border-gray-100/50">
                                <ShoppingCart size={20} className="text-[#2E5A2E]" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Scrollable Container */}
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
                                                 <span className="text-[15px] font-bold text-gray-900 dark:text-white leading-none">
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
                          <h2 className="text-[16px] font-bold text-gray-900 dark:text-white">{t('Payment')}</h2>
                          <span className="text-[12px] font-semibold text-gray-400">{cartItems.length} item{cartItems.length > 1 ? 's' : ''}</span>
                     </div>
    
                     <div className="space-y-4 mb-8">
                          <div className="flex justify-between items-center">
                               <span className="text-[14px] text-gray-400 font-medium">{t('Payment')}</span>
                               <span className="text-[15px] font-bold text-gray-900 dark:text-white">₹ {cartTotal.toFixed(0)}</span>
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
                
            </div>
        </div>
    );
};

export default Cart;
