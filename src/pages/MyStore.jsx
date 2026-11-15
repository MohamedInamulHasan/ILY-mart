import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Store, ArrowLeft, Package, Sparkles, ShoppingBag, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { useOrders } from '../hooks/queries/useOrders';
import { useStores } from '../hooks/queries/useStores';
import { safeNavigateBack } from '../utils/useBackButton';
import StoreManagement from './admin/StoreManagement';
import StoreOrdersPanel from '../components/store/StoreOrdersPanel';

const MyStore = () => {
    const { user, loading } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();
    const { cartCount } = useCart();
    const { data: stores = [] } = useStores();
    const { data: rawOrders = [] } = useOrders();

    // Query params for deep-linking (e.g. from popup notification)
    const searchParams = new URLSearchParams(location.search);
    const initialTab = searchParams.get('tab') || localStorage.getItem('my_store_active_tab') || 'orders';
    const targetOrderId = searchParams.get('orderId') || location.state?.selectedOrderId || null;

    const [activeTab, setActiveTab] = useState(initialTab === 'management' ? 'management' : 'orders');

    useEffect(() => {
        const queryTab = searchParams.get('tab');
        if (queryTab && ['orders', 'management'].includes(queryTab)) {
            setActiveTab(queryTab);
        }
    }, [location.search]);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        localStorage.setItem('my_store_active_tab', tab);
    };

    // Store identification
    const myStore = useMemo(() => {
        const targetStoreId = String(user?.storeId?._id || user?.storeId || '');
        const cleanMobile = (user?.mobile || user?.phone || '').toString().replace(/\D/g, '').slice(-10);
        return stores.find(s => {
            const sId = String(s._id || s.id || '');
            if (targetStoreId && sId === targetStoreId) return true;
            const sMobile = String(s.mobile || s.phone || '').replace(/\D/g, '').slice(-10);
            if (cleanMobile && sMobile && sMobile === cleanMobile) return true;
            return false;
        }) || null;
    }, [user, stores]);

    const myStoreId = String(myStore?._id || myStore?.id || user?.storeId?._id || user?.storeId || '');
    const myStoreName = (myStore?.name || '').trim().toLowerCase();

    // Calculate pending orders count for badge
    const pendingOrdersCount = useMemo(() => {
        const list = Array.isArray(rawOrders) ? rawOrders : (rawOrders?.data || []);
        if (!myStoreId && !myStoreName) return 0;

        return list.filter(o => {
            const isProc = ['processing', 'pending', 'order placed', 'confirmed'].includes((o.status || '').toLowerCase());
            if (!isProc) return false;

            const oStoreId = String(o.storeId?._id || o.storeId || '').trim();
            if (myStoreId && oStoreId && oStoreId === myStoreId) return true;

            return (o.items || []).some(item => {
                const sid = String(item.storeId?._id || item.storeId || item.store?._id || item.store?.id || '').trim();
                if (myStoreId && sid === myStoreId) return true;
                if (myStoreName && (item.storeName || item.storeId?.name || '').trim().toLowerCase() === myStoreName) return true;
                return false;
            });
        }).length;
    }, [rawOrders, myStoreId, myStoreName]);

    // Protection: Redirect if not store_admin
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2E5A2E]"></div>
            </div>
        );
    }

    const roles = Array.isArray(user?.role) ? user.role : [user?.role || 'customer'];
    const isStoreAdmin = roles.includes('store_admin') || roles.includes('admin') || Boolean(user?.storeId);

    if (!user || !isStoreAdmin) {
        setTimeout(() => navigate('/'), 0);
        return null;
    }

    return (
        <div className="min-h-screen bg-[#E8EAEF] dark:bg-gray-900 duration-200">
            {/* Light Green Branded Fixed Header */}
            <div className="fixed top-0 left-0 right-0 z-[100] w-full bg-[#CBF9B2] dark:bg-[#CBF9B2] rounded-b-[2.5rem] px-4 pt-3.5 pb-3.5 shadow-sm overflow-hidden">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/30 dark:bg-[#CBF9B2]/20 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative z-10 max-w-6xl mx-auto">
                    <div className="w-full relative flex items-center justify-center min-h-[38px]">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2">
                            <button
                                onClick={() => safeNavigateBack(navigate, '/profile')}
                                className="w-[38px] h-[38px] bg-white dark:bg-white/90 rounded-full flex items-center justify-center border border-black/5 dark:border-gray-200/50 shadow-sm transition-transform active:scale-95 cursor-pointer text-gray-900"
                                aria-label="Go back"
                            >
                                <ArrowLeft size={19} />
                            </button>
                        </div>

                        <div className="flex flex-col text-center px-10 max-w-[260px] sm:max-w-md mx-auto">
                            <h1 className="text-[14px] sm:text-[15.5px] font-black text-gray-900 tracking-tight leading-snug truncate">
                                {myStore?.name || t('My Store Panel')}
                            </h1>
                            <p className="text-[10px] font-semibold text-gray-700 mt-0.5">
                                {t('Orders & Store Management')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Body */}
            <div className="pt-[76px] max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
                {/* Clean Top Switcher Tabs */}
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md p-1.5 rounded-2xl shadow-xs border border-gray-200/60 dark:border-gray-700 mb-5 flex items-center gap-1.5 max-w-md mx-auto select-none">
                    <button
                        type="button"
                        onClick={() => handleTabChange('orders')}
                        className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                            activeTab === 'orders'
                                ? 'bg-[#2E5A2E] text-white shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                        }`}
                    >
                        <Package size={16} />
                        <span>{t('Orders & Deliveries')}</span>
                        {pendingOrdersCount > 0 && (
                            <span className={`px-2 py-0.5 text-[10px] font-black rounded-full ${
                                activeTab === 'orders'
                                    ? 'bg-amber-400 text-gray-900 shadow-xs animate-pulse'
                                    : 'bg-amber-500 text-white'
                            }`}>
                                {pendingOrdersCount}
                            </span>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => handleTabChange('management')}
                        className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                            activeTab === 'management'
                                ? 'bg-[#2E5A2E] text-white shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                        }`}
                    >
                        <Store size={16} />
                        <span>{t('Store & Products')}</span>
                    </button>
                </div>

                {/* Active Tab View */}
                {activeTab === 'orders' ? (
                    <StoreOrdersPanel selectedOrderId={targetOrderId} />
                ) : (
                    <StoreManagement />
                )}
            </div>
        </div>
    );
};

export default MyStore;
