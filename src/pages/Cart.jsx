import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useUserProfile } from '../hooks/queries/useUsers';
import { useLanguage } from '../context/LanguageContext';
import { safeNavigateBack } from '../utils/useBackButton';
import { renderBilingualTitle, getSelectedUnitDisplay } from '../utils/titleHelpers';
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
    const isItemFree = (item) => Boolean(
        item && (item.isGold === true || (item.product && item.product.isGold === true) || item.deliveryCharge === 0 || item.isFreeDelivery === true || item.freeDelivery === true)
    );
    const isOnlyFreeProducts = cartItems.length > 0 && cartItems.every(isItemFree);
    const hasGoldProduct = isOnlyFreeProducts;
    const nonFreeItems = cartItems.filter(item => !isItemFree(item));
    const baseDeliveryCharge = calculateDeliveryCharge(nonFreeItems.length > 0 ? nonFreeItems : cartItems);
    const deliveryCharge = isOnlyFreeProducts ? 0 : baseDeliveryCharge;
    const finalTotal = cartTotal + deliveryCharge;

    const handleBackNav = () => {
        safeNavigateBack(navigate, '/');
    };

    if (cartItems.length === 0) {
        return (
            <div className="min-h-screen bg-[#E8EAEF] dark:bg-gray-900 flex flex-col transition-colors duration-200">
                {/* Premium Green Header */}
                <div className="fixed top-0 left-0 right-0 z-[100] w-full bg-[#CBF9B2] rounded-b-[2.5rem] px-4 pt-3.5 pb-3.5 shadow-sm overflow-hidden">
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/30 dark:bg-[#CBF9B2]/20 rounded-full blur-3xl pointer-events-none" />
                    <div className="relative z-10">
                        <div className="w-full px-4 relative flex items-center justify-center min-h-[38px]">
                            <div className="absolute left-2 top-1/2 -translate-y-1/2">
                                <button 
                                    onClick={handleBackNav} 
                                    className="w-[38px] h-[38px] flex items-center justify-center bg-white dark:bg-white/80 rounded-full text-gray-900 transition-transform active:scale-95 shadow-sm border border-gray-100/50 dark:border-gray-200/50"
                                >
                                    <ArrowLeft size={19} />
                                </button>
                            </div>
                            <div className="flex flex-col text-center">
                                <h1 className="text-[14.5px] font-bold text-gray-900 tracking-tight leading-tight">{t('Cart')}</h1>
                                <p className="text-[10px] font-semibold text-gray-700 mt-0.5">{t('Your selected items')}</p>
                            </div>
                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                <div className="w-[38px] h-[38px]" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Centered Empty State Content (Minimal Image 2 Style) */}
                <div className="flex-1 flex flex-col items-center justify-center text-center px-4 pt-[120px] pb-24 min-h-[60vh]">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white/90 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 shadow-sm">
                        <ShoppingBag className="text-gray-400 dark:text-gray-500" size={38} strokeWidth={1.5} />
                    </div>
                    <h2 className="text-[16px] sm:text-[20px] font-bold text-gray-900 dark:text-white mb-1.5 text-center">
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
        <div className="min-h-screen bg-[#E8EAEF] dark:bg-gray-900 flex flex-col transition-colors duration-200 relative mx-auto max-w-md w-full pb-20 md:pb-40">
            
            {/* Premium Green Header — matches Orders / Profile style */}
            <div className="fixed top-0 left-0 right-0 z-[100] w-full bg-[#CBF9B2] dark:bg-[#CBF9B2] rounded-b-[2.5rem] px-4 pt-3.5 pb-3.5 shadow-sm overflow-hidden">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/30 dark:bg-[#CBF9B2]/20 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10">
                    <div className="w-full px-4 relative flex items-center justify-center min-h-[38px]">
                        <div className="absolute left-2 top-1/2 -translate-y-1/2">
                            <button onClick={handleBackNav} className="w-[38px] h-[38px] flex items-center justify-center bg-white dark:bg-white/80 rounded-full text-gray-900 transition-transform active:scale-95 shadow-sm border border-gray-100/50 dark:border-gray-200/50">
                                <ArrowLeft size={19} />
                            </button>
                        </div>
                        <div className="flex flex-col text-center">
                            <h1 className="text-[14.5px] font-bold text-gray-900 tracking-tight leading-tight">{t('Cart')}</h1>
                            <p className="text-[10px] font-semibold text-gray-700 mt-0.5">{cartItems.length} {t('items')}</p>
                        </div>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            <div className="w-[38px] h-[38px]" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Scrollable Container */}
            <div className="flex-1 w-full px-3.5 sm:px-4 pt-[88px]">

                {/* Items */}
                <div className="space-y-2 sm:space-y-2.5 mb-3">
                    {cartItems.map((item) => (
                        <div key={item.id} className="bg-white dark:bg-gray-800 rounded-2xl p-3 sm:p-3.5 flex gap-3.5 items-center relative shadow-sm border border-gray-100 dark:border-gray-700 transition-all duration-300">
                             {/* Image block */}
                             <div className="w-[78px] h-[78px] sm:w-[82px] sm:h-[82px] rounded-xl overflow-hidden bg-[#F9FAFB] dark:bg-gray-800 flex-shrink-0 relative border border-gray-100/60 dark:border-gray-700/60">
                                   {isItemFree(item) && (
                                       <div className="absolute top-0 left-0 right-0 z-[10] bg-[#E11D48] text-white text-[7.5px] sm:text-[8px] font-black uppercase tracking-wider py-0.5 text-center leading-tight shadow-xs select-none pointer-events-none">
                                           {t('Free Delivery')}
                                       </div>
                                   )}
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
                                       <div className="flex items-baseline gap-1.5">
                                             <span className="text-[14px] sm:text-[15px] font-extrabold text-gray-900 dark:text-white leading-tight">
                                                 ₹ {(item.price * item.quantity).toFixed(0)}
                                             </span>
                                             {(() => {
                                                 const unitDisplay = getSelectedUnitDisplay(item);
                                                 if (!unitDisplay) return null;
                                                 return (
                                                     <span className="text-xs text-gray-400 dark:text-gray-500 font-medium leading-tight">
                                                         ({unitDisplay})
                                                     </span>
                                                 );
                                             })()}
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
                
                {/* Order Summary / Payment Card — exactly matching Checkout.jsx design */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-gray-700 relative overflow-hidden">
                    <div className="flex justify-between items-center mb-3.5">
                        <h2 className="text-[17px] font-bold text-gray-900 dark:text-white">{t('Payment Summary')}</h2>
                        <span className="text-[13px] font-medium text-gray-400 tracking-tight">{cartItems.length} {t('items')}</span>
                    </div>

                    <div className="space-y-2.5 mb-5">
                        <div className="flex justify-between items-center">
                            <span className="text-[14px] text-gray-400 font-medium">{t('Subtotal')}</span>
                            <span className="text-[15px] font-extrabold text-gray-900 dark:text-white">₹{cartTotal.toFixed(0)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[14px] text-gray-400 font-medium">{t('Delivery')}</span>
                            {deliveryCharge === 0 ? (
                                <span className="text-[15px] font-extrabold text-[#2E5A2E] dark:text-[#CBF9B2]">FREE</span>
                            ) : (
                                <span className="text-[15px] font-extrabold text-gray-900 dark:text-white">₹{deliveryCharge.toFixed(0)}</span>
                            )}
                        </div>
                        <div className="flex justify-between items-center pt-2">
                            <span className="text-[15px] text-gray-500 font-medium">{t('Total')}</span>
                            <span className="text-[17px] font-extrabold text-gray-900 dark:text-white">₹{finalTotal.toFixed(0)}</span>
                        </div>
                    </div>

                    <Link
                        to="/checkout"
                        className="w-full bg-black text-white rounded-full py-3 sm:py-3.5 flex items-center justify-center font-normal text-sm active:scale-[0.98] transition-transform"
                    >
                        <span>{t('Place Order')}</span>
                    </Link>
                </div>
                
            </div>
        </div>
    );
};

export default Cart;
