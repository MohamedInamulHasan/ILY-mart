import React from 'react';
import { MapPin, ShoppingCart, ChevronDown } from 'lucide-react';
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
        <header className="flex items-center justify-between px-2 sm:px-4 py-0 bg-transparent transition-colors duration-200 min-h-[42px]">
            {/* Location Selector */}
            <div className="flex items-center gap-3">
                <div className="w-[42px] h-[42px] bg-white dark:bg-white/80 rounded-full flex items-center justify-center border border-black/5 dark:border-gray-200/50 shadow-sm transition-transform active:scale-95 flex-shrink-0">
                    <MapPin className="text-red-500 dark:text-red-500" size={22} />
                </div>
                <div className="flex flex-col min-w-0">
                    <span className="text-[10px] text-gray-700 dark:text-gray-700 font-semibold uppercase tracking-wider leading-tight">{t('Delivery to')}</span>
                    <Link to="/edit-address" className="flex items-center gap-1 group cursor-pointer border-b border-dashed border-gray-400 dark:border-gray-600 max-w-[190px] sm:max-w-[260px] mt-0.5">
                        <span className="text-[14px] sm:text-[15px] font-bold text-gray-900 dark:text-gray-900 truncate leading-tight">{displayAddress}</span>
                        <ChevronDown size={15} className="text-gray-600 dark:text-gray-700 flex-shrink-0" />
                    </Link>
                </div>
            </div>

            {/* Icons */}
            <div className="flex items-center gap-3">
                <Link 
                    to="/cart"
                    className="w-[42px] h-[42px] bg-white dark:bg-white/80 rounded-full flex items-center justify-center border border-black/5 dark:border-gray-200/50 relative hover:bg-gray-50 dark:hover:bg-white/70 shadow-sm transition-all active:scale-95 flex-shrink-0"
                >
                    <ShoppingCart size={22} className="text-[#2E5A2E] dark:text-[#2E5A2E]" />
                    {cartCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center shadow-sm border-2 border-white dark:border-gray-800">
                            {cartCount}
                        </span>
                    )}
                </Link>
            </div>
        </header>
    );
};

export default HomeHeader;
