import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import deliveryCharacterImg from '../assets/delivery-character.png';
import { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../utils/api';
import { useData } from './DataContext';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';
import { isStoreOpen, calculateDeliveryCharge } from '../utils/storeHelpers';

const CartContext = createContext();

export const useCart = () => {
    return useContext(CartContext);
};

export const CartProvider = ({ children }) => {
    // Get current user ID from localStorage
    const getUserId = () => {
        try {
            const userInfo = localStorage.getItem('userInfo');
            if (userInfo) {
                const user = JSON.parse(userInfo);
                return user._id || user.id || 'guest';
            }
        } catch (e) {
            console.error('Failed to get user info:', e);
        }
        return 'guest';
    };

    const [userId, setUserId] = useState(getUserId());
    const { user } = useAuth();
    const { t, language } = useLanguage();
    const [showStoreReminder, setShowStoreReminder] = useState(false);



    const [cartItems, setCartItems] = useState(() => {
        const currentUserId = getUserId();
        const cartKey = `cart_${currentUserId}`;

        // Clean up old cart data (migration)
        const oldCart = localStorage.getItem('cart');
        if (oldCart && !localStorage.getItem(cartKey)) {
            // If old cart exists and no user-specific cart, migrate it
            try {
                const oldItems = JSON.parse(oldCart);
                localStorage.setItem(cartKey, JSON.stringify(oldItems));
                localStorage.removeItem('cart'); // Remove old cart
            } catch (e) {
                console.error('Failed to migrate old cart:', e);
            }
        } else if (oldCart) {
            // Just remove the old cart if user already has a new one
            localStorage.removeItem('cart');
        }

        const localData = localStorage.getItem(cartKey);
        if (!localData) return [];

        try {
            const items = JSON.parse(localData);
            return items;
        } catch (e) {
            console.error('Failed to parse cart from localStorage:', e);
            return [];
        }
    });

    // Refresh cart data from backend on mount
    useEffect(() => {
        const refreshCartData = async () => {
            if (cartItems.length === 0) return;

            try {
                const updatedItems = await Promise.all(cartItems.map(async (item) => {
                    try {
                        const response = await apiService.getProduct(item.id);
                        const product = response.data;
                        if (!product) return item; // Keep existing if fetch fails

                        return {
                            ...item,
                            title: product.title || item.title,
                            price: product.price, // Update price if changed
                            image: product.image || (product.images && product.images.length > 0 ? product.images[0] : item.image), // Update image if changed, fallback to existing
                            unit: product.unit || item.unit || '', // update unit, keeping existing if backend misses it
                            storeId: product.storeId?._id || product.storeId || item.storeId,
                            isAvailable: product.isAvailable, // Update availability
                            isGold: product.isGold, // Update gold status
                            // Preserve ad-related fields from original cart item
                            isFromAd: item.isFromAd || false,
                            adTitle: item.adTitle || null,
                            storeName: item.storeName || product.storeName || null
                        };
                    } catch (err) {
                        console.warn(`Failed to refresh item ${item.id}`, err);
                        return item; // Keep existing on error
                    }
                }));

                // Only update if there are changes to avoid loop (JSON stringify comparison)
                if (JSON.stringify(updatedItems) !== JSON.stringify(cartItems)) {
                    setCartItems(updatedItems);
                }
            } catch (error) {
                console.error('Failed to refresh cart data:', error);
            }
        };

        refreshCartData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run once on mount

    // NEW: Auto-remove items if store closes or product becomes unavailable
    const { products, stores, loading } = useData();

    useEffect(() => {
        // Skip validation if data is still loading to prevent accidental clearing
        if (loading.products || loading.stores || products.length === 0) return;

        if (cartItems.length === 0) return;

        let itemsRemoved = false;
        const validatedItems = cartItems.filter(item => {
            // 1. Check Product Availability (using fresh data from DataContext)
            const freshProduct = products.find(p => (p._id || p.id) === item.id);
            if (freshProduct) {
                // If product exists, check its explicit availability status
                if (freshProduct.isAvailable === false) {
                    return false; // Remove: Product is toggled OFF
                }
            }
            // Note: If freshProduct is NOT found, we keep the item. 
            // It might be a momentary sync issue or product deleted (which is handled elsewhere/rarer).
            // Safest to only remove if we KNOW it's unavailable.

            // 2. Check Store Status
            const sId = item.storeId?._id || item.storeId;
            if (sId) {
                const store = stores.find(s => (s._id || s.id) === sId);
                // If store found and is CLOSED, remove item
                if (store && !isStoreOpen(store)) {
                    return false; // Remove: Store is CLOSED
                }
            }

            return true; // Keep item
        });

        if (validatedItems.length !== cartItems.length) {
            console.log('🧹 Cart cleanup: Removed unavailable items', cartItems.length - validatedItems.length);
            setCartItems(validatedItems);
            itemsRemoved = true;
        }

    }, [products, stores, loading, cartItems]);

    // Listen for user changes (login/logout)
    useEffect(() => {
        const handleStorageChange = () => {
            const newUserId = getUserId();
            if (newUserId !== userId) {
                setUserId(newUserId);
                // Load cart for new user
                const cartKey = `cart_${newUserId}`;
                const localData = localStorage.getItem(cartKey);
                if (localData) {
                    try {
                        const items = JSON.parse(localData);
                        setCartItems(items);
                    } catch (e) {
                        setCartItems([]);
                    }
                } else {
                    setCartItems([]);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        // Also listen for custom event when user logs in/out
        window.addEventListener('userChanged', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('userChanged', handleStorageChange);
        };
    }, [userId]);

    useEffect(() => {
        try {
            const cartKey = `cart_${userId}`;
            localStorage.setItem(cartKey, JSON.stringify(cartItems));
        } catch (error) {
            console.error("Failed to save cart to localStorage:", error);
            // If quota exceeded, we could try to clear old items or just warn
            if (error.name === 'QuotaExceededError') {
                console.warn("LocalStorage quota exceeded. Cart changes may not be saved.");
            }
        }
    }, [cartItems, userId]);



    const addToCart = (product) => {
        const productId = product._id || product.id;
        const newStoreId = (product.storeId?._id || product.storeId || '').toString();

        // Customer can ONLY order products from one store at a time
        if (newStoreId && cartItems.length > 0) {
            const currentUniqueStores = new Set(
                cartItems
                    .map(item => (item.storeId?._id || item.storeId || '').toString())
                    .filter(Boolean)
            );

            if (currentUniqueStores.size > 0 && !currentUniqueStores.has(newStoreId)) {
                setShowStoreReminder(true);
                return;
            }
        }

        // Create a lean object to save space
        const productToSave = {
            id: productId,
            title: product.title || product.name,
            price: product.price,
            image: product.image || (product.images && product.images.length > 0 ? product.images[0] : null),
            storeId: product.storeId?._id || product.storeId || null,
            quantity: 1,
            unit: product.unit || product.size || '',
            isGold: Boolean(product.isGold || product.deliveryCharge === 0 || product.isFreeDelivery || product.freeDelivery),
            isFromAd: product.isFromAd || false,
            adTitle: product.adTitle || null,
            storeName: product.storeName || null
        };

        setCartItems((prevItems) => {
            const existingItem = prevItems.find((item) => item.id === productId);
            if (existingItem) {
                return prevItems.map((item) =>
                    item.id === productId ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prevItems, productToSave];
        });
    };

    const removeFromCart = (productId) => {
        setCartItems((prevItems) => prevItems.filter((item) => item.id !== productId));
    };

    const updateQuantity = (productId, quantity) => {
        if (quantity < 1) {
            removeFromCart(productId);
            return;
        }
        setCartItems((prevItems) =>
            prevItems.map((item) =>
                item.id === productId ? { ...item, quantity: quantity } : item
            )
        );
    };

    const clearCart = () => {
        setCartItems([]);
    };

    const cartTotal = cartItems.reduce(
        (total, item) => total + item.price * item.quantity,
        0
    );

    const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);

    const hasCoins = user?.coins > 0;
    const isItemFree = (item) => Boolean(
        item && (item.isGold === true || (item.product && item.product.isGold === true) || item.deliveryCharge === 0 || item.isFreeDelivery === true || item.freeDelivery === true)
    );
    // Delivery is ONLY free if ALL items in cart are free delivery products
    // If ANY non-free product is added, standard delivery charge applies
    const isOnlyFreeProducts = cartItems.length > 0 && cartItems.every(isItemFree);
    const hasGoldProduct = isOnlyFreeProducts;
    const nonFreeItems = cartItems.filter(item => !isItemFree(item));
    const baseDeliveryCharge = calculateDeliveryCharge(nonFreeItems.length > 0 ? nonFreeItems : cartItems);
    const deliveryCharge = isOnlyFreeProducts ? 0 : baseDeliveryCharge;

    const value = {
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartCount,
        deliveryCharge,
        baseDeliveryCharge,
    };

    return (
        <CartContext.Provider value={value}>
            {children}

            {/* Single Store Restriction Reminder Modal — Delivery Character & Speech Bubble */}
            {showStoreReminder && (
                <div 
                    className="fixed inset-0 bg-black/70 z-[9999] flex flex-col items-center justify-end overflow-hidden pb-0 px-4 animate-in fade-in duration-150 pointer-events-auto transform-gpu"
                    onClick={(e) => { if (e.target === e.currentTarget) setShowStoreReminder(false); }}
                >
                    {/* Speech Bubble Above Character - styled like delivery character dialogue */}
                    <motion.div 
                        initial={{ scale: 0.92, opacity: 0, y: 14 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                        className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 p-4 sm:p-5 max-w-[340px] sm:max-w-[380px] w-full mb-3 z-10 transform-gpu will-change-transform"
                    >
                        {/* Speech Bubble Arrow Tail pointing down towards character's head */}
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[9px] border-t-white dark:border-t-gray-900 filter drop-shadow-[0_2px_1px_rgba(0,0,0,0.08)]"></div>

                        {/* Close button */}
                        <button
                            type="button"
                            onClick={() => setShowStoreReminder(false)}
                            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-base font-bold"
                            aria-label="Close"
                        >
                            ×
                        </button>

                        {/* Label with Forest Green accent */}
                        <div className="flex items-center gap-1.5 mb-2.5">
                            <p className="text-[13px] sm:text-[13.5px] font-extrabold text-[#2E5A2E] dark:text-[#CBF9B2] uppercase tracking-wide flex items-center gap-1">
                                <span>⚠️</span>
                                <span>{language === 'ta' ? 'ஒரு சிறிய Reminder!' : 'A Quick Reminder!'}</span>
                            </p>
                        </div>

                        {/* Main speech message */}
                        <div className="text-[12.5px] sm:text-[13px] italic font-semibold text-gray-800 dark:text-gray-100 leading-relaxed mb-3.5 space-y-2">
                            <p>
                                {language === 'ta'
                                    ? 'நீங்கள் ஏற்கனவே ஒரு Store-லிருந்து Products-ஐ உங்கள் Cart-ல் Add செய்துள்ளீர்கள்.'
                                    : 'You already have products from another store in your cart.'}
                            </p>
                            <p>
                                {language === 'ta'
                                    ? 'வேறொரு Store-லிருந்து Products Add செய்ய விரும்பினால், முதலில் உங்கள் Cart-ல் உள்ள பழைய Store Products-ஐ Remove செய்துவிட்டு, புதிய Store Products-ஐ Add செய்யவும்.'
                                    : 'If you want to add products from a different store, please remove the existing items from your cart first, then add the new store products.'}
                            </p>
                            <p className="text-[#2E5A2E] dark:text-[#CBF9B2] font-black not-italic">
                                {language === 'ta'
                                    ? 'ஒரு நேரத்தில் ஒரு Store-லிருந்து மட்டுமே Order செய்ய முடியும்!'
                                    : 'You can only order from one store at a time!'}
                            </p>
                        </div>

                        {/* Button */}
                        <button
                            type="button"
                            onClick={() => setShowStoreReminder(false)}
                            className="w-full py-2.5 bg-black hover:bg-gray-900 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 font-bold rounded-xl text-xs sm:text-[13px] active:scale-95 transition-transform shadow-sm"
                        >
                            {language === 'ta' ? 'சரி, புரிந்தது!' : 'Got it!'}
                        </button>
                    </motion.div>

                    {/* Delivery Character — Swipes up first from bottom */}
                    <motion.div 
                        initial={{ y: '60%', opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                        className="h-[46vh] sm:h-[50vh] flex justify-center items-end select-none pointer-events-none z-0 -mt-2"
                    >
                        <img 
                            src={deliveryCharacterImg} 
                            alt="Delivery Character" 
                            className="h-full w-auto max-w-full object-contain object-bottom drop-shadow-2xl"
                        />
                    </motion.div>
                </div>
            )}
        </CartContext.Provider>
    );
};
