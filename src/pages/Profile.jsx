import { useState, useContext, useEffect, useMemo, useRef } from 'react';
import { 
    User, Package, Settings, ChevronRight, LogOut, 
    Shield, Wrench, Store, ArrowLeft, MoreHorizontal, 
    MapPin, Lock, HelpCircle, Pencil, Languages, Heart, Bookmark,
    ChevronDown, ShoppingCart, Newspaper, Coins,
    Truck, CheckCircle2, XCircle, Clock, Camera, Plus, Gamepad2, Trash2, Eye, EyeOff
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { safeNavigateBack } from '../utils/useBackButton';
import AuthContext, { useAuth } from '../context/AuthContext';
import { useUserProfile, useUpdateProfile } from '../hooks/queries/useUsers';
import { useOrders } from '../hooks/queries/useOrders';
import { useData } from '../context/DataContext';
import LogoutModal from '../components/LogoutModal';
import PullToRefreshLayout from '../components/PullToRefreshLayout';
import { CartoonCoin, CartoonCoinBadge } from '../components/CartoonCoin';
import api, { apiService } from '../utils/api';
import { getUserRoles } from '../utils/userHelpers';

const MenuLink = ({ icon, title, to, onClick, isRed = false, disabled = false, badge = null }) => {
    const Wrapper = to && !disabled ? Link : 'button';
    return (
        <Wrapper 
            to={!disabled ? to : undefined} 
            onClick={!disabled ? onClick : undefined}
            disabled={disabled}
            className={`w-full flex items-center justify-between py-2.5 sm:py-3 px-2.5 transition-colors group ${
                disabled
                    ? 'opacity-40 cursor-not-allowed select-none pointer-events-none'
                    : `hover:bg-gray-100/50 dark:hover:bg-gray-800 ${!to ? 'cursor-pointer focus:outline-none' : ''}`
            }`}
        >
            <div className="flex items-center gap-3 sm:gap-3.5">
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 ${isRed ? 'text-red-500' : 'text-gray-600 dark:text-gray-300'}`}>
                    {icon}
                </div>
                <span className={`text-[14px] sm:text-[14.5px] font-medium ${isRed ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                    {title}
                </span>
            </div>
            <div className="flex items-center gap-2">
                {badge}
                {!disabled ? (
                    <ChevronRight size={17} className="text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                ) : (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                        Disabled
                    </span>
                )}
            </div>
        </Wrapper>
    );
};

const Profile = () => {
    const { theme, toggleTheme } = useTheme();
    const { language, setLanguage, t } = useLanguage();
    const { setIsFooterHidden } = useData();
    const { user: authUser, logout, setUser: setAuthUser } = useAuth();
    const { cartCount } = useCart();

    const { data: userProfile } = useUserProfile();
    
        // Robust resolution of user: seamlessly prioritizes latest local address updates
    const user = useMemo(() => {
        let cached = null;
        try {
            cached = JSON.parse(localStorage.getItem('userInfo') || '{}');
            if (cached?.data) cached = cached.data;
        } catch {}

        const profileObj = userProfile?.data || userProfile || {};
        const authObj = authUser?.data || authUser || {};
        const cachedObj = cached || {};

        const street = cachedObj.address?.street || authObj.address?.street || profileObj.address?.street || '';
        const city = cachedObj.address?.city || authObj.address?.city || profileObj.address?.city || '';
        const zip = cachedObj.address?.zip || authObj.address?.zip || profileObj.address?.zip || '';

        return {
            ...profileObj,
            ...authObj,
            ...cachedObj,
            address: {
                ...(profileObj.address || {}),
                ...(authObj.address || {}),
                ...(cachedObj.address || {}),
                street,
                city,
                zip
            }
        };
    }, [userProfile, authUser]);

    const navigate = useNavigate();
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [showAvatarModal, setShowAvatarModal] = useState(false);
    const { mutate: updateProfile } = useUpdateProfile();

    // 10-click delivery auth easter egg
    const nameClickCountRef = useRef(0);
    const nameClickTimerRef = useRef(null);
    const [showDeliveryAuthModal, setShowDeliveryAuthModal] = useState(false);
    const [deliveryAuthId, setDeliveryAuthId] = useState('');
    const [deliveryAuthPassword, setDeliveryAuthPassword] = useState('');
    const [showDeliveryPassword, setShowDeliveryPassword] = useState(false);
    const [deliveryAuthLoading, setDeliveryAuthLoading] = useState(false);
    const [deliveryAuthError, setDeliveryAuthError] = useState('');
    const [customLoginMode, setCustomLoginMode] = useState(false);

    const handleNameCardClick = () => {
        nameClickCountRef.current += 1;
        if (nameClickTimerRef.current) clearTimeout(nameClickTimerRef.current);
        nameClickTimerRef.current = setTimeout(() => {
            nameClickCountRef.current = 0;
        }, 3000);
        if (nameClickCountRef.current >= 10) {
            nameClickCountRef.current = 0;
            setCustomLoginMode(true);
            setDeliveryAuthId('');
            setDeliveryAuthPassword('');
            setShowDeliveryPassword(false);
            setDeliveryAuthError('');
            setShowDeliveryAuthModal(true);
        }
    };

    const handleDeliveryLogin = async (e) => {
        e.preventDefault();
        setDeliveryAuthLoading(true);
        setDeliveryAuthError('');
        try {
            const res = await apiService.login({ email: deliveryAuthId.trim(), password: deliveryAuthPassword });
            const data = res?.data || res;
            const token = data?.token || data?.authToken || res?.token;
            const userData = data?.user || data?.data || data;
            if (token) {
                // Backup current user/guest session so delivery boy logout returns to normal user pages without logging out
                const prevToken = localStorage.getItem('authToken');
                const prevUser = localStorage.getItem('userInfo');
                if (prevToken && (!user?.role?.includes('delivery_boy') || prevToken !== token)) {
                    if (!localStorage.getItem('customer_backup_token')) {
                        localStorage.setItem('customer_backup_token', prevToken);
                        if (prevUser) localStorage.setItem('customer_backup_user', prevUser);
                    }
                }

                localStorage.removeItem('delivery_boy_logged_out');
                localStorage.setItem('delivery_session_active', 'true');
                localStorage.setItem('authToken', token);
                localStorage.setItem('userInfo', JSON.stringify(userData));
                setAuthUser(userData);
                setShowDeliveryAuthModal(false);
                navigate('/admin');
            } else {
                setDeliveryAuthError('Invalid credentials. Please check your Delivery ID and password.');
            }
        } catch (err) {
            setDeliveryAuthError(err?.response?.data?.message || 'Invalid credentials. Please try again.');
        } finally {
            setDeliveryAuthLoading(false);
        }
    };

    const fruitAvatars = [
        { id: 'strawberry', url: '/avatars/strawberry.png', name: 'Strawberry' },
        { id: 'mango', url: '/avatars/mango.png', name: 'Mango' },
        { id: 'watermelon', url: '/avatars/watermelon.png', name: 'Watermelon' },
    ];

    const handleSelectAvatar = (url) => {
        updateProfile({ avatar: url }, {
            onSuccess: (response) => {
                if (response.success && response.data) {
                    setAuthUser(response.data);
                }
            }
        });
        setShowAvatarModal(false);
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result;
                updateProfile({ avatar: base64 }, {
                    onSuccess: (response) => {
                        if (response.success && response.data) {
                            setAuthUser(response.data);
                        }
                    }
                });
                setShowAvatarModal(false);
            };
            reader.readAsDataURL(file);
        }
    };



        // Only show delivery boy card when the user's mobile number is registered with delivery_boy role
    const hasDeliveryRole = (obj) => {
        if (!obj) return false;
        const r = obj.role || obj.roles;
        if (Array.isArray(r)) return r.some(item => typeof item === 'string' && ['delivery_boy', 'deliveryboy'].includes(item.toLowerCase().trim()));
        if (typeof r === 'string') return ['delivery_boy', 'deliveryboy'].includes(r.toLowerCase().trim());
        return Boolean(obj.isDeliveryBoy);
    };

    const isDeliveryBoy = useMemo(() => {
        return Boolean(
            hasDeliveryRole(userProfile?.data) ||
            hasDeliveryRole(userProfile) ||
            hasDeliveryRole(user) ||
            hasDeliveryRole(authUser)
        );
    }, [userProfile, user, authUser]);

    // Robust extraction of all roles from every available source
    const roles = useMemo(() => {
        return getUserRoles(userProfile?.data || userProfile || user || authUser);
    }, [user, userProfile, authUser]);

    const isAdmin = roles.includes('admin');
    const isStoreAdmin = roles.includes('store_admin');
    const isServiceAdmin = roles.includes('service_admin');
    const isAdminView = isAdmin || isStoreAdmin || isServiceAdmin || isDeliveryBoy;

    const { data: allOrders = [] } = useOrders({}, { enabled: Boolean(isDeliveryBoy || isAdmin) });
    const pendingOrdersCount = useMemo(() => {
        if (!isDeliveryBoy) return 0;
        const list = Array.isArray(allOrders) ? allOrders : (allOrders?.data || []);
        return list.filter(o => ['Processing', 'Pending', 'Order Placed'].includes(o.status)).length;
    }, [isDeliveryBoy, allOrders]);

    const addressObj = user?.address || {};
    const isAddressObject = typeof user?.address === 'object' && user?.address !== null;
    const hasAddress = isAddressObject 
        ? (addressObj.street && addressObj.street.trim().length > 0)
        : (user?.address && String(user.address).trim().length > 0);
    const showLogout = hasAddress || isAdminView;

    useEffect(() => {
        setIsFooterHidden(showLogoutModal);
        return () => setIsFooterHidden(false);
    }, [showLogoutModal, setIsFooterHidden]);

    const handleLogout = () => setShowLogoutModal(true);
    const confirmLogout = () => { logout(); };

    return (
        <div className="flex-1 bg-[#E8EAEF] dark:bg-gray-900 pb-20 sm:pb-24 transition-colors duration-200 w-full relative select-none">
            
            {/* Logout Modal */}
            <LogoutModal 
                isOpen={showLogoutModal} 
                onClose={() => setShowLogoutModal(false)} 
                onConfirm={confirmLogout} 
            />

            {/* Premium Light Green Header Card / Dark Mode Adjusted */}
            <div className="fixed top-0 left-0 right-0 z-[100] w-full bg-[#CBF9B2] dark:bg-[#CBF9B2] rounded-b-[2.5rem] px-4 pt-3.5 pb-3.5 shadow-sm overflow-hidden">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/30 dark:bg-[#CBF9B2]/20 rounded-full blur-3xl pointer-events-none"></div>
                
                <div className="relative z-10">
                    <div className="w-full px-4 relative flex items-center justify-center min-h-[38px]">
                        <div className="absolute left-2 top-1/2 -translate-y-1/2">
                            <button onClick={() => safeNavigateBack(navigate, '/')} className="w-[38px] h-[38px] flex items-center justify-center bg-white dark:bg-white/80 rounded-full text-gray-900 dark:text-gray-900 transition-transform active:scale-95 shadow-sm border border-gray-100/50 dark:border-gray-200/50">
                                <ArrowLeft size={19} />
                            </button>
                        </div>
                        <div className="flex flex-col text-center">
                            <h1 className="text-[14.5px] font-bold text-gray-900 tracking-tight leading-tight">{t('Profile')}</h1>
                            <p className="text-[10px] font-semibold text-gray-700 mt-0.5">{t('Manage account')}</p>
                        </div>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            <button 
                                onClick={() => navigate('/cart')}
                                className="w-[38px] h-[38px] flex items-center justify-center bg-white dark:bg-white/80 rounded-full text-gray-900 dark:text-gray-900 transition-transform active:scale-95 shadow-sm border border-black/5 dark:border-gray-200/50 relative"
                            >
                                <ShoppingCart size={19} className="text-[#2E5A2E] dark:text-[#2E5A2E]" />
                                {cartCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold h-[18px] w-[18px] rounded-full flex items-center justify-center shadow-sm border-2 border-white dark:border-gray-800">
                                        {cartCount}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <div className="pt-[88px]">
                <div className="px-4 mt-0 max-w-3xl mx-auto space-y-3 pb-12 sm:pb-16 w-full">
                {/* Profile Widget */}
                <div className="bg-white dark:bg-gray-800/80 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between mb-3 shadow-sm border border-gray-100 dark:border-gray-700">
                     <div className="flex items-center gap-3.5 flex-1 min-w-0">
                          <div className="relative flex-shrink-0">
                               <div className="w-[52px] h-[52px] sm:w-[56px] sm:h-[56px] bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center overflow-hidden border-2 border-white dark:border-gray-800 shadow-sm">
                                    {/* Real image if available, else highly stylized fallback */}
                                    {user?.avatar ? (
                                         <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#CBF9B2] to-[#2E5A2E]/10 dark:to-[#CBF9B2]/10 text-[#2E5A2E] dark:text-gray-900">
                                            <User size={26} strokeWidth={1.5} />
                                        </div>
                                    )}
                               </div>

                               {/* Edit Overlay Button */}
                               <button 
                                   onClick={() => setShowAvatarModal(true)}
                                   className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-md border border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-300 active:scale-90 transition-transform"
                               >
                                   <Camera size={12} />
                               </button>
                          </div>
                          <div className="flex-1 min-w-0" onClick={handleNameCardClick} style={{ cursor: 'default' }}>
                                {/* Name + Coin inline */}
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <h2 className="text-[15.5px] sm:text-[16.5px] font-bold text-gray-900 dark:text-white leading-tight tracking-tight truncate">
                                        {user?.name || 'Guest User'}
                                    </h2>
                                    {Number(user?.coins || 0) > 0 && (
                                        <CartoonCoin count={user?.coins} size={24} />
                                    )}
                                </div>
                                {/* Mobile number */}
                                {user?.mobile && (
                                    <p className="text-[12px] sm:text-[12.5px] text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                                        {user.mobile}
                                    </p>
                                )}
                           </div>
                     </div>
                </div>



                {/* Administration Section Card */}
                {isAdminView && (
                    <div className="mb-3 animate-in fade-in slide-in-from-top-2 duration-300">
                        <h3 className="text-[14px] sm:text-[14.5px] font-bold text-gray-900 dark:text-white mb-2 px-1 tracking-tight flex items-center gap-2">
                            <Shield size={16} className="text-[#2E5A2E] dark:text-[#CBF9B2]" />
                            {t('Administration')}
                        </h3>
                        <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-1.5 sm:p-2 flex flex-col items-center shadow-sm border border-gray-100 dark:border-gray-700">
                            {isAdmin && (
                                <MenuLink 
                                    to="/admin" 
                                    icon={<Shield size={17} strokeWidth={2} />} 
                                    title={t('Admin Dashboard')} 
                                />
                            )}
                            {isAdmin && isDeliveryBoy && (
                                <div className="h-[1px] w-[calc(100%-4rem)] ml-auto bg-gray-200/60 dark:bg-gray-700/60 mr-3.5" />
                            )}
                            {isDeliveryBoy && (
                                <MenuLink 
                                    onClick={() => {
                                        localStorage.removeItem('delivery_boy_logged_out');
                                        localStorage.setItem('delivery_session_active', 'true');
                                        navigate('/admin');
                                    }}
                                    icon={<Truck size={17} strokeWidth={2} />} 
                                    title={t('Delivery Boy')} 
                                    badge={
                                        pendingOrdersCount > 0 ? (
                                            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-amber-500 text-white flex items-center gap-1 shadow-xs animate-pulse">
                                                <span>{pendingOrdersCount}</span>
                                                <span className="text-[10px] font-semibold uppercase">{t('Pending')}</span>
                                            </span>
                                        ) : (
                                            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                                                0 {t('Pending')}
                                            </span>
                                        )
                                    }
                                />
                            )}
                            {isStoreAdmin && (
                                <>
                                    {(isAdmin || isDeliveryBoy) && <div className="h-[1px] w-[calc(100%-4rem)] ml-auto bg-gray-200/60 dark:bg-gray-700/60 mr-3.5" />}
                                    <MenuLink 
                                        to="/my-store" 
                                        icon={<Store size={17} strokeWidth={2} />} 
                                        title={t('My Store')} 
                                    />
                                </>
                            )}
                            {isServiceAdmin && (
                                <>
                                    {(isAdmin || isDeliveryBoy || isStoreAdmin) && <div className="h-[1px] w-[calc(100%-4rem)] ml-auto bg-gray-200/60 dark:bg-gray-700/60 mr-3.5" />}
                                    <MenuLink 
                                        to="/my-service" 
                                        icon={<Wrench size={17} strokeWidth={2} />} 
                                        title={t('My Service')} 
                                    />
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Account Section */}
                <div className="mb-3">
                     <h3 className="text-[14px] sm:text-[14.5px] font-bold text-gray-900 dark:text-white mb-2 px-1 tracking-tight">{t('Account')}</h3>
                     <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-1.5 sm:p-2 flex flex-col items-center shadow-sm border border-gray-100 dark:border-gray-700">
                          
                          <MenuLink to="/orders" icon={<Package size={17} strokeWidth={2} />} title={t('My Orders')} />
                          <div className="h-[1px] w-[calc(100%-4rem)] ml-auto bg-gray-200/60 dark:bg-gray-700/60 mr-3.5"></div>
                          
                          <MenuLink to="/edit-address" icon={<MapPin size={17} strokeWidth={2} />} title={t('My Address')} />
                          <div className="h-[1px] w-[calc(100%-4rem)] ml-auto bg-gray-200/60 dark:bg-gray-700/60 mr-3.5"></div>

                          <MenuLink to="/saved-products" icon={<Bookmark size={17} strokeWidth={2} />} title={t('Saved Products')} />
                          <div className="h-[1px] w-[calc(100%-4rem)] ml-auto bg-gray-200/60 dark:bg-gray-700/60 mr-3.5"></div>

                          <MenuLink to="/services" icon={<Wrench size={17} strokeWidth={2} />} title={t('Services')} />
                          <div className="h-[1px] w-[calc(100%-4rem)] ml-auto bg-gray-200/60 dark:bg-gray-700/60 mr-3.5"></div>

                          {/* Settings Dropdown/Accordion */}
                          <button 
                              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                              className="w-full flex items-center justify-between py-2.5 sm:py-3 px-2.5 hover:bg-gray-100/50 dark:hover:bg-gray-800 transition-colors group focus:outline-none"
                          >
                              <div className="flex items-center gap-3 sm:gap-3.5">
                                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-300">
                                      <Settings size={17} strokeWidth={2} />
                                  </div>
                                  <span className="text-[14px] sm:text-[14.5px] font-medium text-gray-900 dark:text-white">
                                      {t('Settings')}
                                  </span>
                              </div>
                              <ChevronDown size={17} className={`text-gray-400 transition-transform duration-300 ${isSettingsOpen ? 'rotate-180' : ''}`} />
                          </button>

                          {isSettingsOpen && (
                              <div className="w-full pl-12 pr-4 pb-2.5 space-y-1 animate-in slide-in-from-top-2 duration-200">
                                  <button 
                                      onClick={() => {
                                          const newLang = language === 'en' ? 'ta' : 'en';
                                          setLanguage(newLang);
                                          localStorage.setItem('language', newLang);
                                      }}
                                      className="w-full flex items-center justify-between py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-[#2E5A2E] dark:hover:text-[#CBF9B2] transition-colors"
                                  >
                                      <span>{t('Language')}</span>
                                      <span className="text-[11px] font-bold uppercase tracking-wider bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                                          {language === 'en' ? 'EN' : 'TA'}
                                      </span>
                                  </button>
                              </div>
                          )}
                          

                     </div>
                </div>

                {/* Support Section */}
                <div className="mb-2">
                     <h3 className="text-[14px] sm:text-[14.5px] font-bold text-gray-900 dark:text-white mb-2 px-1 tracking-tight">{t('Support')}</h3>
                     <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-1.5 sm:p-2 flex flex-col items-center shadow-sm border border-gray-100 dark:border-gray-700">
                          <MenuLink 
                              onClick={() => window.open('https://wa.me/919500171980', '_blank')} 
                              icon={<HelpCircle size={17} strokeWidth={2} />} 
                              title={t('Help Center')} 
                          />
                          <div className="h-[1px] w-[calc(100%-4rem)] ml-auto bg-gray-200/60 dark:bg-gray-700/60 mr-3.5"></div>
                          <MenuLink to="/privacy-policy" icon={<Shield size={17} strokeWidth={2} />} title={t('Privacy Policy')} />
                          {showLogout && (
                               <>
                                   <div className="h-[1px] w-[calc(100%-4rem)] ml-auto bg-gray-200/60 dark:bg-gray-700/60 mr-3.5"></div>
                                   <MenuLink 
                                       onClick={handleLogout} 
                                       icon={<LogOut size={17} strokeWidth={2} />} 
                                       title={t('Logout')} 
                                       isRed={false}
                                   />
                               </>
                           )}
                     </div>
                </div>
            </div>
                </div>
            </div>

            {/* Floating WhatsApp Button */}
            <button 
                onClick={() => window.open('https://wa.me/919500171980', '_blank')}
                style={{ bottom: 'calc(7.2rem + env(safe-area-inset-bottom, 0px))' }}
                className="fixed right-5 sm:right-6 w-12 h-12 sm:w-14 sm:h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all z-[60]"
                aria-label="Contact on WhatsApp"
            >
                <svg 
                    viewBox="0 0 24 24" 
                    width="26" 
                    height="26" 
                    fill="currentColor" 
                    className="text-white"
                >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.985c-.002 5.45-4.437 9.884-9.887 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
            </button>

            {/* Delivery Auth Modal */}
            {showDeliveryAuthModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
                    <div
                        className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm"
                        onClick={() => setShowDeliveryAuthModal(false)}
                    />
                    <div className="relative bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                        <div className="p-5 sm:p-6">
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-2">
                                    <div className="w-9 h-9 rounded-full bg-[#2E5A2E] flex items-center justify-center">
                                        <Truck size={18} className="text-white" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                        {t('Delivery Login')}
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setShowDeliveryAuthModal(false)}
                                    className="w-9 h-9 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <XCircle size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleDeliveryLogin} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">{t('Delivery ID')}</label>
                                    <input
                                        type="text"
                                        value={deliveryAuthId}
                                        onChange={(e) => setDeliveryAuthId(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-[#2E5A2E] outline-none"
                                        placeholder={t('Enter your Delivery ID')}
                                        autoComplete="off"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">{t('Password')}</label>
                                    <div className="relative">
                                        <input
                                            type={showDeliveryPassword ? "text" : "password"}
                                            value={deliveryAuthPassword}
                                            onChange={(e) => setDeliveryAuthPassword(e.target.value)}
                                            className="w-full px-4 py-3 pr-11 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-[#2E5A2E] outline-none"
                                            placeholder={t('Enter your password')}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowDeliveryPassword(!showDeliveryPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 transition-colors cursor-pointer"
                                            title={showDeliveryPassword ? "Hide password" : "Show password"}
                                        >
                                            {showDeliveryPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                {deliveryAuthError && (
                                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-sm text-red-600 dark:text-red-400">
                                        {deliveryAuthError}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={deliveryAuthLoading}
                                    className="w-full py-3 bg-[#2E5A2E] text-white font-semibold rounded-xl hover:bg-[#245024] active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                                >
                                    {deliveryAuthLoading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>{t('Signing in...')}</span>
                                        </>
                                    ) : (
                                        <>
                                            <Truck size={17} />
                                            <span>{t('Login to Delivery Panel')}</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Avatar Selection Modal */}
            {showAvatarModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                    <div 
                        className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" 
                        onClick={() => setShowAvatarModal(false)}
                    />
                    
                    <div className="relative bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                        <div className="p-5 sm:p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                    {t('Choose Avatar')}
                                </h3>
                                <button 
                                    onClick={() => setShowAvatarModal(false)}
                                    className="w-10 h-10 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-full text-gray-500"
                                >
                                    <XCircle size={20} />
                                </button>
                            </div>

                            <div className="grid grid-cols-3 gap-4 mb-4">
                                {fruitAvatars.map((avatar) => (
                                    <button
                                        key={avatar.id}
                                        onClick={() => handleSelectAvatar(avatar.url)}
                                        className="group relative flex flex-col items-center gap-3 transition-transform active:scale-95"
                                    >
                                        <div className={`w-16 h-16 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 transition-all overflow-hidden ${user?.avatar === avatar.url ? 'border-[#2E5A2E] ring-4 ring-[#2E5A2E]/10' : 'border-transparent group-hover:border-gray-200 dark:group-hover:border-gray-700'}`}>
                                            <img src={avatar.url} alt={avatar.name} className="w-full h-full object-cover" />
                                        </div>
                                        <span className={`text-xs font-bold ${user?.avatar === avatar.url ? 'text-[#2E5A2E] dark:text-[#7CA90E]' : 'text-gray-400 dark:text-gray-500'}`}>
                                            {t(avatar.name)}
                                        </span>
                                    </button>
                                ))}

                                {/* Gallery Upload Option */}
                                <label className="group relative flex flex-col items-center gap-3 cursor-pointer transition-transform active:scale-95">
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        className="hidden" 
                                        onChange={handleFileUpload}
                                    />
                                    <div className="w-16 h-16 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center text-gray-400 group-hover:border-[#2E5A2E] group-hover:text-[#2E5A2E] transition-all">
                                        <Plus size={32} />
                                    </div>
                                    <span className="text-xs font-bold text-gray-400 dark:text-gray-500">
                                        {t('Gallery')}
                                    </span>
                                </label>
                            </div>

                            <p className="text-center text-xs text-gray-400 dark:text-gray-500 italic">
                                {t('Pick a cute fruit for your profile!')}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
