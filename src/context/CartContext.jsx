import { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../utils/api';
import { useData } from './DataContext';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';
import { isStoreOpen, calculateDeliveryCharge, getStoreName } from '../utils/storeHelpers';

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
    const [pendingProduct, setPendingProduct] = useState(null);
    const [showStoreWarning, setShowStoreWarning] = useState(false);
    const [nextStoreCharge, setNextStoreCharge] = useState(25);
    const [warningStoreNames, setWarningStoreNames] = useState('');
    const [newStoreName, setNewStoreName] = useState('');



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



    const addToCart = (product, force = false) => {
        const productId = product._id || product.id;
        const newStoreId = (product.storeId?._id || product.storeId || '').toString();

        // Never show the multi-store warning for free (gold) products,
        // or when the cart already contains a free/gold product
        const isNewProductFree = product.isGold === true;
        const cartHasFreeProduct = cartItems.some(item => item.isGold);

        if (!force && !isNewProductFree && !cartHasFreeProduct && newStoreId && cartItems.length > 0) {
            const currentUniqueStores = new Set(
                cartItems.map(item => (item.storeId?._id || item.storeId || '').toString()).filter(Boolean)
            );

            if (!currentUniqueStores.has(newStoreId) && currentUniqueStores.size > 0) {
                const nextCharge = 20 + currentUniqueStores.size * 5;

                // Get names of existing stores in the cart
                const currentStoreIds = Array.from(currentUniqueStores);
                const storeNames = currentStoreIds.map(id => getStoreName(id, stores)).filter(Boolean);
                const storesText = storeNames.length > 1
                    ? storeNames.slice(0, -1).join(', ') + (language === 'ta' ? ' and ' : ' and ') + storeNames[storeNames.length - 1]
                    : storeNames.join(', ');

                const newStoreNameVal = getStoreName(newStoreId, stores) || 'another store';

                setWarningStoreNames(storesText);
                setNewStoreName(newStoreNameVal);
                setPendingProduct(product);
                setNextStoreCharge(nextCharge);
                setShowStoreWarning(true);
                return;
            }
        }

        // Create a lean object to save space
        const productToSave = {
            id: productId,
            title: product.title || product.name,
            price: product.price,
            image: product.image || (product.images && product.images.length > 0 ? product.images[0] : null),
            storeId: product.storeId || null, // Just save the storeId string
            quantity: 1,
            unit: product.unit || product.size || '',
            isGold: product.isGold || false,
            // Ad-related fields
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

    const confirmAddToCart = () => {
        if (pendingProduct) {
            addToCart(pendingProduct, true);
        }
        setShowStoreWarning(false);
        setPendingProduct(null);
    };

    const cancelAddToCart = () => {
        setShowStoreWarning(false);
        setPendingProduct(null);
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
    const hasGoldProduct = cartItems.some(item => item.isGold);
    const baseDeliveryCharge = calculateDeliveryCharge(cartItems);
    const deliveryCharge = (hasCoins || hasGoldProduct) ? 0 : baseDeliveryCharge;

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

            {/* Multi-Store Warning — Center Right Speech Bubble Popup with Blur Backdrop */}
            {showStoreWarning && (() => {
                const currentUniqueStores = new Set(
                    cartItems.map(item => (item.storeId?._id || item.storeId || '').toString()).filter(Boolean)
                );
                const isMultiStore = currentUniqueStores.size > 1;
                const currentCharge = 20 + (currentUniqueStores.size - 1) * 5;
                const newCharge = nextStoreCharge;
                const extraCharge = newCharge - currentCharge;

                return (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998] flex items-center justify-end pr-3 sm:pr-4 pointer-events-auto">
                        <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 p-4 max-w-[285px] sm:max-w-[300px] w-full">
                            {/* Speech Bubble Arrow Tail pointing to right */}
                            <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[7px] border-t-transparent border-b-[7px] border-b-transparent border-l-[9px] border-l-white dark:border-l-gray-900 filter drop-shadow-[2px_0_1px_rgba(0,0,0,0.08)]"></div>

                            {/* Close button */}
                            <button
                                onClick={cancelAddToCart}
                                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-base font-bold"
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

                            {/* Main speech message — stylish font */}
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
                                    className="flex-1 py-2 bg-[#CBF9B2] hover:bg-[#bbf2a0] text-gray-900 font-extrabold rounded-xl text-xs active:scale-95 transition-transform shadow-none border-none"
                                >
                                    {language === 'ta' ? 'ஆமா, சேர்' : 'Yes, Add'}
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </CartContext.Provider>
    );
};
