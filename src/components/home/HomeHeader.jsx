import React from 'react';
import { ShoppingCart, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

const HomeHeader = () => {
    const { cartCount } = useCart();
    const { user } = useAuth();
    const { t } = useLanguage();

    const displayAddress = (() => {
        if (!user) return t('Select Location');
        
        // Priority 1: Structured address fields (Street, City)
        if (user.address && (user.address.street || user.address.city || user.address.address)) {
            const parts = [];
            if (user.address.street) parts.push(user.address.street);
            if (user.address.city) parts.push(user.address.city);
            if (parts.length === 0 && user.address.address) {
                // Handle cases where full address is in a single field
                return user.address.address.length > 30 ? user.address.address.substring(0, 30) + '...' : user.address.address;
            }
            return parts.join(', ');
        }
        
        // Priority 2: Full user.location (if not a URL)
        if (user.location && !user.location.startsWith('http')) {
            return user.location;
        }
        
        // Priority 3: Fallback to structured fields even if partial
        if (user.address?.street) return user.address.street;
        if (user.address?.city) return user.address.city;
        
        return t('Add Location');
    })();

    return (
        <header className="flex items-center justify-between px-0 py-0 bg-transparent transition-colors duration-200 min-h-[38px]">
            {/* Location Selector */}
            <div className="flex items-center gap-2.5">
                <div className="w-[38px] h-[38px] bg-white dark:bg-white/80 rounded-full flex items-center justify-center border border-black/5 dark:border-gray-200/50 shadow-sm transition-transform active:scale-95 flex-shrink-0">
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" className="flex-shrink-0" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C8.13401 2 5 5.13401 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13401 15.866 2 12 2Z" fill="#EF4444" />
                        <circle cx="12" cy="9" r="2.6" fill="white" />
                    </svg>
                </div>
                <div className="flex flex-col min-w-0">
                    <span className="text-[9px] text-gray-700 dark:text-gray-700 font-semibold uppercase tracking-wider leading-tight">{t('Delivery to')}</span>
                    <Link to="/edit-address" className="flex items-center gap-1 group cursor-pointer border-b border-dashed border-gray-400 dark:border-gray-600 max-w-[180px] sm:max-w-[250px] mt-0.5">
                        <span className="text-[13px] sm:text-[13.5px] font-bold text-gray-900 dark:text-gray-900 truncate leading-tight">{displayAddress}</span>
                        <ChevronDown size={14} className="text-gray-600 dark:text-gray-700 flex-shrink-0" />
                    </Link>
                </div>
            </div>

            {/* Cart Icon */}
            <div className="flex items-center gap-2.5">
                <Link 
                    to="/cart"
                    className="w-[38px] h-[38px] bg-white dark:bg-white/80 rounded-full flex items-center justify-center border border-black/5 dark:border-gray-200/50 relative hover:bg-gray-50 dark:hover:bg-white/70 shadow-sm transition-all active:scale-95 flex-shrink-0"
                    aria-label="View cart"
                >
                    <ShoppingCart size={19} className="text-[#2E5A2E] dark:text-[#2E5A2E]" />
                    {cartCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold h-[18px] w-[18px] rounded-full flex items-center justify-center shadow-sm border-2 border-white dark:border-gray-800">
                            {cartCount}
                        </span>
                    )}
                </Link>
            </div>
        </header>
    );
};

export default HomeHeader;
