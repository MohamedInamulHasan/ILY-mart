import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { renderBilingualTitle } from '../utils/titleHelpers';
import { Plus, ArrowLeft, Minus, ShoppingBag, ShoppingCart, ChevronLeft, ChevronRight, Star, Share2, Bookmark, Store as StoreIcon } from 'lucide-react';
import { isStoreOpen, isProductScheduled } from '../utils/storeHelpers';

const ProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart, cartItems, updateQuantity } = useCart();
    const { products, stores, savedProducts, toggleSaveProduct } = useData();
    const { user } = useAuth();
    const { t, language } = useLanguage();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

    // Look up store name from stores context
    const store = product && stores?.find(s => (s._id || s.id) === product.storeId);
    const storeName = store?.name || 'Unknown Store';

    // Updated effect to handle individual product fetching
    useEffect(() => {
        const loadProduct = async () => {
            setLoading(true);
            // 1. Try to find in context first (fastest)
            if (products.length > 0) {
                const foundProduct = products.find(p => (p._id || p.id) === id || (p._id || p.id) === parseInt(id));
                if (foundProduct) {
                    setProduct(foundProduct);
                    setCurrentImageIndex(0);
                    setLoading(false);
                    return;
                }
            }

            // 2. If not in context (e.g. direct link or paginated out), fetch from API
            try {
                const response = await import('../utils/api').then(m => m.apiService.getProduct(id));
                if (response.success && response.data) {
                    setProduct(response.data);
                    setCurrentImageIndex(0);
                } else {
                    setProduct(null);
                }
            } catch (err) {
                console.error('Failed to fetch individual product:', err);
                setProduct(null);
            } finally {
                setLoading(false);
            }
        };

        loadProduct();
    }, [id, products]);

    const productId = product ? (product._id || product.id) : null;
    const cartItem = product ? cartItems.find(item => item.id === productId) : null;
    const quantity = cartItem ? cartItem.quantity : 0;

    // Check if product is saved (savedProducts contains objects now due to populate, so check IDs)
    const isSaved = product && savedProducts.some(p => (p._id || p.id || p) === (product._id || product.id));

    const handleToggleSave = async () => {
        if (product) {
            await toggleSaveProduct(product._id || product.id);
        }
    };

    const handleAddToCart = () => {
        if (!user) {
            navigate('/login');
            return;
        }
        addToCart(product);
    };

    const handleCheckout = () => {
        if (!user) {
            navigate('/login');
            return;
        }
        if (!cartItem) {
            addToCart(product);
        }
        navigate('/checkout');
    };

    const handleScroll = (e) => {
        const container = e.target;
        const slideIndex = Math.round(container.scrollLeft / container.clientWidth);
        setCurrentImageIndex(slideIndex);
    };

    const scrollToImage = (index) => {
        const container = document.getElementById('product-slider');
        if (container) {
            container.scrollTo({
                left: index * container.clientWidth,
                behavior: 'smooth'
            });
            setCurrentImageIndex(index);
        }
    };

    const handleShare = async () => {
        try {
            const shareTitle = t(product, 'title') || product.title;
            const sharePrice = Number(product.price).toFixed(0);
            const shareUrl = window.location.href;
            const shareText = `${t('Checkout this')} ${shareTitle} ${t('for only')} ₹${sharePrice} ${t('on')} ILY mart!`;

            if (navigator.share) {
                await navigator.share({
                    title: shareTitle,
                    text: shareText,
                    url: shareUrl,
                });
            } else {
                // Fallback to WhatsApp sharing
                const message = encodeURIComponent(`${shareText}\n\n${shareUrl}`);
                window.open(`https://wa.me/?text=${message}`, '_blank');
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Error sharing:', err);
            }
        }
    };

    // Show loading skeleton while fetching
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="animate-pulse">
                        {/* Back button skeleton */}
                        <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg mb-6"></div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Image skeleton */}
                            <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>

                            {/* Details skeleton */}
                            <div className="space-y-4">
                                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                                <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl mt-8"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Show not found only after loading completes
    if (!product) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 text-center px-4 transition-colors duration-200">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{t('Product not found')}</h2>
                <Link to="/store" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium">{t('Return to Store')}</Link>
            </div>
        );
    }
    
    const images = product.images || [product.image];
    const totalPrice = (Number(product.price) * (quantity || 1)).toFixed(0);

    // Availability Logic (Manual + Time-based)
    const isManualAvailable = product.isAvailable !== false;
    const isScheduled = isProductScheduled(product);

    const isStoreCurrentlyOpen = store ? isStoreOpen(store) : true;
    const isCurrentlyAvailable = isManualAvailable && isScheduled && isStoreCurrentlyOpen;

    const rawDescription = t(product, 'description') || '';
    const descParts = rawDescription.split('|').map(s => s.trim());
    const mainDesc = descParts[0] || '';
    const descTags = descParts.slice(1).filter(Boolean);

    const shouldTruncate = mainDesc.length > 150;
    const displayDescription = isDescriptionExpanded ? mainDesc : mainDesc.slice(0, 150) + (shouldTruncate ? '...' : '');

    return (
        <div className="min-h-screen bg-[#E8EAEF] dark:bg-gray-900 transition-colors duration-200 flex flex-col lg:py-12 lg:px-8">
            
            {/* Desktop Layout Container Wrapper */}
            <div className="flex flex-col lg:flex-row lg:max-w-[1200px] lg:mx-auto lg:bg-white lg:dark:bg-gray-800 lg:rounded-[3rem] lg:shadow-sm lg:overflow-hidden flex-1 lg:flex-initial w-full">
            
                {/* Image Section (Top on mobile, Left on desktop) */}
                <div className="relative w-full lg:w-1/2 aspect-square md:aspect-[16/8] lg:aspect-auto lg:min-h-[600px] bg-[#E8EAEF] lg:bg-gray-50/50 dark:bg-gray-900 lg:dark:bg-gray-900/50 flex items-center justify-center p-0 lg:p-12 overflow-hidden border-r-0 lg:border-r border-gray-100 dark:border-gray-700/50">
                    {/* Floating Navigation Buttons */}
                    <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-30">
                        <button
                            onClick={() => navigate(-1)}
                            className="w-12 h-12 flex items-center justify-center bg-white/90 dark:bg-white/80 rounded-full shadow-sm text-gray-900 dark:text-gray-900 transition-transform active:scale-90"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <button
                            onClick={handleToggleSave}
                            className="w-12 h-12 flex items-center justify-center bg-white/90 dark:bg-white/80 rounded-full shadow-sm text-gray-900 dark:text-gray-900 transition-transform active:scale-90"
                        >
                            <Bookmark size={24} className={isSaved ? "fill-[#FF5C5C] text-[#FF5C5C]" : "text-gray-400"} />
                        </button>
                    </div>

                    {/* Main Product Image Carousel */}
                    <div className="w-full h-full relative overflow-hidden">
                        <div 
                            id="product-slider"
                            onScroll={handleScroll}
                            className="flex w-full h-full overflow-x-auto snap-x snap-mandatory scrollbar-hide"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                            {images.map((img, index) => (
                                <div key={index} className="w-full h-full flex-shrink-0 snap-center flex items-center justify-center">
                                    <img
                                        src={img || `${API_BASE_URL}/products/${productId}/image`}
                                        alt={`${product.title} - ${index + 1}`}
                                        className="w-full h-full object-cover lg:max-h-[500px]"
                                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/400x400?text=No+Image'; }}
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Pagination Dots */}
                        {images.length > 1 && (
                            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 z-30">
                                {images.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => scrollToImage(index)}
                                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                            currentImageIndex === index 
                                                ? 'w-6 bg-[#2E5A2E] dark:bg-[#CBF9B2]' 
                                                : 'bg-gray-300 dark:bg-gray-600'
                                        }`}
                                    />
                                ))}
                            </div>
                        )}

                        {product.unit && (
                            <div className="absolute bottom-4 right-4 z-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur px-3 py-1.5 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 shadow-sm border border-black/5 hidden lg:block">
                                {product.unit}
                            </div>
                        )}
                    </div>
                </div>

                {/* Content Section (Pull-up on mobile, Right on desktop) */}
                <div className="flex-1 bg-white dark:bg-[#1a1f26] rounded-t-[2.5rem] lg:rounded-none -mt-12 lg:mt-0 relative z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.4)] lg:shadow-none px-8 pt-10 pb-8 lg:p-12 lg:flex lg:flex-col lg:justify-center border-t border-transparent dark:border-white/5">
                    <div className="max-w-2xl mx-auto w-full">
                    {/* Header: Title & Unit */}
                    <div className="mb-2 min-w-0">
                        <h1 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white leading-tight" title={product.title}>
                            {renderBilingualTitle(t(product, 'title') || product.title, language)}
                        </h1>
                        {product.unit && (
                            <p className="text-sm text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wide mt-1">
                                {product.unit}
                            </p>
                        )}
                    </div>

                    {/* Price & Quantity Selector */}
                    <div className="flex items-center justify-between mb-8 mt-6">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-3">
                                <p className="text-4xl font-semibold text-[#2E5A2E] dark:text-[#CBF9B2]">
                                    ₹{totalPrice}
                                </p>
                            </div>
                        </div>
                        
                        {/* New Minimalist Quantity Selector */}
                        <div className="flex items-center gap-1 bg-gray-100/80 dark:bg-gray-700/80 p-1 rounded-2xl">
                            <button
                                onClick={() => updateQuantity(productId, Math.max(0, quantity - 1))}
                                className="w-10 h-10 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors"
                            >
                                <Minus size={18} />
                            </button>
                            <span className="w-8 text-center text-lg font-bold text-[#2E5A2E] dark:text-[#CBF9B2]">
                                {quantity || 0}
                            </span>
                            <button
                                onClick={handleAddToCart}
                                className="w-10 h-10 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-[#2E5A2E] dark:hover:text-[#CBF9B2] transition-colors"
                            >
                                <Plus size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Description Section */}
                    <div className="mb-8">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                            {t('Description')}
                        </h2>
                        <div className="text-gray-600 dark:text-gray-300 leading-relaxed text-base">
                            {displayDescription}
                            {shouldTruncate && (
                                <button
                                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                                    className="ml-1 text-gray-900 dark:text-white font-bold hover:underline"
                                >
                                    {isDescriptionExpanded ? t('Read Less') : t('Read More...')}
                                </button>
                            )}
                        </div>

                        {/* Parsed Tags Section - Table Format */}
                        {descTags.length > 0 && (
                            <div className="mt-6 border border-black/10 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm">
                                <table className="w-full text-left border-collapse">
                                    <tbody>
                                        {descTags.map((tag, index) => {
                                            const dashMatch = tag.match(/[-–—]/);
                                            if (dashMatch) {
                                                const dashIdx = dashMatch.index;
                                                const key = tag.substring(0, dashIdx).trim();
                                                const val = tag.substring(dashIdx + 1).trim();
                                                return (
                                                    <tr key={index} className="border-b border-black/10 dark:border-gray-700 last:border-0 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                                                        <td className="w-1/3 py-3 px-4 bg-gray-50/50 dark:bg-gray-900/30 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest border-r border-black/10 dark:border-gray-700">
                                                            {key}
                                                        </td>
                                                        <td className="py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-200">
                                                            {val}
                                                        </td>
                                                    </tr>
                                                );
                                            }
                                            return (
                                                <tr key={index} className="border-b border-black/10 dark:border-gray-700 last:border-0">
                                                    <td colSpan="2" className="py-3 px-4 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-50/20 dark:bg-gray-900/10">
                                                        {tag}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Action Button */}
                    <div className="w-full flex justify-center mt-4 mb-8">
                        {!isCurrentlyAvailable ? (
                            <div className="w-full py-4 bg-red-50 dark:bg-red-900/10 rounded-full border border-red-100 dark:border-red-800 text-center">
                                <p className="text-red-600 dark:text-red-400 font-bold">
                                     {!isStoreCurrentlyOpen ? t('Store Closed') : t('Currently Unavailable')}
                                </p>
                            </div>
                        ) : (
                            <button
                                onClick={handleCheckout}
                                className="w-full bg-black text-white py-4 rounded-full font-normal text-[15px] active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                            >
                                <span>{t('Add product')}</span>
                                <ShoppingBag size={18} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    </div>
    );
};

export default ProductDetails;
