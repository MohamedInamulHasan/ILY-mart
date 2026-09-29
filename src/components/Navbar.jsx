import { useState, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingBag, ShoppingCart, LayoutDashboard, User, Zap, Rocket } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';

const Navbar = () => {
    const { t } = useLanguage();
    const { fastMode, toggleFastMode } = useData();
    const [isOpen, setIsOpen] = useState(false);
    const { cartCount, cartTotal } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const isAdmin = location.pathname.startsWith('/admin');

    return (
        <nav className="sticky top-0 z-[100] bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 transition-colors duration-200 pt-[env(safe-area-inset-top)]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <Link
                        to="/"
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="flex items-center gap-2 group active:scale-95 transition-transform duration-200"
                    >
                        <img src="/logo-new.png" alt="ILY mart Logo" className="w-8 h-8 md:w-9 md:h-9 object-contain rounded-xl shadow-sm" />
                        <span className="text-xl md:text-2xl font-black tracking-tight flex items-center bg-gradient-to-r from-[#2E5A2E] to-[#5A7C0A] bg-clip-text text-transparent dark:from-[#CBF9B2] dark:to-[#8bc910]">
                            ILY mart
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-8">

                        <Link to="/" className="text-gray-600 dark:text-gray-300 hover:text-[#2E5A2E] dark:hover:text-[#8bc910] font-medium transition-colors">{t('Home')}</Link>
                        <Link to="/store" className="text-gray-600 dark:text-gray-300 hover:text-[#2E5A2E] dark:hover:text-[#8bc910] font-medium transition-colors">{t('Store')}</Link>

                        <Link to="/orders" className="text-gray-600 dark:text-gray-300 hover:text-[#2E5A2E] dark:hover:text-[#8bc910] font-medium transition-colors">{t('Orders')}</Link>


                        {user ? (
                            <Link to="/profile" className="text-gray-600 dark:text-gray-300 hover:text-[#2E5A2E] dark:hover:text-[#8bc910] font-medium transition-colors">
                                {t('Profile')}
                            </Link>
                        ) : (
                            <Link to="/login" className="text-gray-600 dark:text-gray-300 hover:text-[#2E5A2E] dark:hover:text-[#8bc910] font-medium transition-colors">{t('Login')}</Link>
                        )}

                        {!isAdmin && (
                            <div className="flex items-center gap-3">
                                {/* Fast Mode Toggle - Desktop */}
                                <button
                                    onClick={toggleFastMode}
                                    className={`relative p-2.5 rounded-full transition-all duration-300 group ${fastMode
                                        ? 'bg-gradient-to-r from-[#2E5A2E] to-[#5A7C0A] dark:from-[#CBF9B2] dark:to-[#8bc910] text-white dark:text-gray-900 shadow-md hover:shadow-lg'
                                        : 'bg-gradient-to-br from-green-50 to-green-100 dark:from-blue-900/20 dark:to-indigo-900/20 text-[#2E5A2E] dark:text-[#8bc910] hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 shadow-sm hover:shadow-md hover:scale-110'
                                        }`}
                                    title={fastMode ? t('Fast Mode ON') : t('Fast Mode')}
                                >
                                    <Rocket size={20} className={`${fastMode ? 'fill-white dark:fill-gray-900' : ''} transition-all duration-300`} />
                                </button>


                                <Link to="/cart" className="group transition-transform active:scale-95 hover:scale-105 duration-200">
                                    {user && cartCount > 0 ? (
                                        <div className="flex items-center gap-2 bg-gradient-to-r from-[#2E5A2E] to-[#5A7C0A] dark:from-[#CBF9B2] dark:to-[#8bc910] pl-3 pr-2 py-1.5 rounded-full shadow-md hover:shadow-lg transition-all">
                                            <span className="text-white dark:text-gray-900 font-bold text-sm">₹{cartTotal.toFixed(0)}</span>
                                            <div className="bg-white/20 dark:bg-black/10 p-1.5 rounded-full backdrop-blur-sm relative">
                                                <ShoppingCart size={16} className="text-white dark:text-gray-900" />
                                                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center border-2 border-[#2E5A2E] dark:border-[#CBF9B2]">
                                                    {cartCount}
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="relative p-2.5 bg-gradient-to-br from-green-50 to-green-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-full hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 transition-all duration-300 hover:scale-110 shadow-sm hover:shadow-md">
                                            <ShoppingCart size={20} className="text-[#2E5A2E] dark:text-[#2E5A2E]" />
                                        </div>
                                    )}
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center gap-3">
                        {!isAdmin && (
                            <>
                                {/* Fast Mode Toggle - Mobile */}
                                <button
                                    onClick={toggleFastMode}
                                    className={`relative p-2 rounded-full transition-all duration-300 ${fastMode
                                        ? 'bg-gradient-to-r from-[#2E5A2E] to-[#5A7C0A] dark:from-[#CBF9B2] dark:to-[#8bc910] text-white dark:text-gray-900 shadow-md'
                                        : 'bg-gradient-to-br from-green-50 to-green-100 dark:from-blue-900/20 dark:to-indigo-900/20 text-[#2E5A2E] dark:text-[#8bc910] shadow-sm'
                                        }`}
                                >
                                    <Rocket size={20} className={fastMode ? 'fill-white dark:fill-gray-900' : ''} />
                                </button>


                                <Link to="/cart" className="group transition-transform active:scale-95 duration-200">
                                    {user && cartCount > 0 ? (
                                        <div className="flex items-center gap-2 bg-gradient-to-r from-[#2E5A2E] to-[#5A7C0A] dark:from-[#CBF9B2] dark:to-[#8bc910] pl-3 pr-2 py-1.5 rounded-full shadow-md hover:shadow-lg transition-all">
                                            <span className="text-white dark:text-gray-900 font-bold text-sm">₹{cartTotal.toFixed(0)}</span>
                                            <div className="bg-white/20 dark:bg-black/10 p-1.5 rounded-full backdrop-blur-sm relative">
                                                <ShoppingCart size={16} className="text-white dark:text-gray-900" />
                                                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center border-2 border-[#2E5A2E] dark:border-[#CBF9B2]">
                                                    {cartCount}
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="relative p-2.5 bg-gradient-to-br from-green-50 to-green-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-full transition-all duration-300 shadow-sm">
                                            <ShoppingCart size={20} className="text-[#2E5A2E] dark:text-[#2E5A2E]" />
                                        </div>
                                    )}
                                </Link>
                            </>
                        )}
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="p-2 text-gray-600 dark:text-gray-300 hover:text-[#2E5A2E] dark:hover:text-[#8bc910] transition-colors"
                        >
                            {isOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div >

            {/* Mobile Menu */}
            {
                isOpen && (
                    <div className="md:hidden absolute top-16 left-0 w-full bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shadow-lg animate-fade-in-down">
                        <div className="px-4 py-6 space-y-4">
                            <Link
                                to="/"
                                className="block px-4 py-3 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-[#2E5A2E] dark:hover:text-[#8bc910] font-medium transition-colors"
                                onClick={() => setIsOpen(false)}
                            >
                                {t('Home')}
                            </Link>
                            <Link
                                to="/store"
                                className="block px-4 py-3 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-[#2E5A2E] dark:hover:text-[#8bc910] font-medium transition-colors"
                                onClick={() => setIsOpen(false)}
                            >
                                {t('Store')}
                            </Link>
                            <Link
                                to="/orders"
                                className="block px-4 py-3 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-[#2E5A2E] dark:hover:text-[#8bc910] font-medium transition-colors"
                                onClick={() => setIsOpen(false)}
                            >
                                {t('Orders')}
                            </Link>


                            {user ? (
                                <Link
                                    to="/profile"
                                    className="block px-4 py-3 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-[#2E5A2E] dark:hover:text-[#8bc910] font-medium transition-colors"
                                    onClick={() => setIsOpen(false)}
                                >
                                    {t('Profile')}
                                </Link>
                            ) : (
                                <Link
                                    to="/login"
                                    className="block px-4 py-3 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-[#2E5A2E] dark:hover:text-[#8bc910] font-medium transition-colors"
                                    onClick={() => setIsOpen(false)}
                                >
                                    {t('Login')}
                                </Link>
                            )}
                        </div>
                    </div>
                )
            }
        </nav >
    );
};

export default Navbar;
