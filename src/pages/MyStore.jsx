import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useSocket } from '../context/SocketContext';
import { useQueryClient } from '@tanstack/react-query';
import { useOrders } from '../hooks/queries/useOrders';
import { useStores } from '../hooks/queries/useStores';
import { safeNavigateBack } from '../utils/useBackButton';
import { 
    setOverlayStoreSessionActive, 
    setOverlayAuthToken, 
    setOverlayOrdersState, 
    showFloatingOverlay, 
    checkOverlayPermission,
    isNativeAndroid 
} from '../utils/floatingOverlay';
import StoreManagement from './admin/StoreManagement';

const MyStore = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, loading: authLoading } = useAuth();
    const { t } = useLanguage();
    const { socket } = useSocket();
    const queryClient = useQueryClient();

    const { data: rawOrders = [] } = useOrders();
    const { data: stores = [] } = useStores();

    // Query params for deep-linking (e.g. ?orderId=...)
    const searchParams = new URLSearchParams(location.search);
    const orderIdParam = searchParams.get('orderId');

    useEffect(() => {
        if (orderIdParam) {
            navigate(`/admin/delivery-order/${orderIdParam}`, { state: { fromStore: true } });
        }
    }, [orderIdParam, navigate]);

    // Identify this store admin's store
    const myStore = useMemo(() => {
        let savedMobile = '';
        try {
            const saved = JSON.parse(localStorage.getItem('user_saved_address') || 'null');
            savedMobile = (saved?.mobile || saved?.phone || '').toString().replace(/\D/g, '').slice(-10);
        } catch {}
        const explicitStoreId = localStorage.getItem('my_store_id');
        const targetStoreId = String(explicitStoreId || user?.storeId?._id || user?.storeId || '');
        const cleanMobile = (savedMobile || user?.mobile || user?.phone || '').toString().replace(/\D/g, '').slice(-10);
        const matched = stores.find(s => {
            const sId = String(s._id || s.id || '');
            if (targetStoreId && sId === targetStoreId) return true;
            const sMobile = String(s.mobile || s.phone || '').replace(/\D/g, '').slice(-10);
            if (cleanMobile && sMobile && sMobile === cleanMobile) return true;
            if (cleanMobile === '9876543211' && s.name?.toLowerCase().includes('arabian')) return true;
            return false;
        }) || (stores.length > 0 ? (targetStoreId ? (stores.find(s => String(s._id || s.id) === targetStoreId) || stores[0]) : stores[0]) : null);
        return matched;
    }, [user, stores]);

    const myStoreId = String(myStore?._id || myStore?.id || user?.storeId?._id || user?.storeId || '');
    const myStoreName = (myStore?.name || '').trim().toLowerCase();

    useEffect(() => {
        if (myStore?._id || myStore?.id) {
            localStorage.setItem('my_store_id', String(myStore._id || myStore.id));
        }
    }, [myStore]);

    // Check if an order item belongs to this store
    const isItemFromMyStore = (item) => {
        if (!item) return false;
        const itemStoreId = String(item.storeId?._id || item.storeId || item.store?._id || item.store?.id || '').trim();
        if (myStoreId && itemStoreId && itemStoreId === myStoreId) return true;
        if (myStoreName) {
            const itemStoreName = (item.storeName || item.storeId?.name || '').trim().toLowerCase();
            if (itemStoreName && itemStoreName === myStoreName) return true;
        }
        return false;
    };

    // Filter all orders strictly for this store admin
    const storeOrders = useMemo(() => {
        const list = Array.isArray(rawOrders) ? rawOrders : (rawOrders?.data || []);
        if (!myStoreId && !myStoreName) return [];

        return list.filter(order => {
            const oStoreId = String(order.storeId?._id || order.storeId || '').trim();
            if (myStoreId && oStoreId && oStoreId === myStoreId) return true;

            if (Array.isArray(order.items)) {
                return order.items.some(isItemFromMyStore);
            }
            return false;
        });
    }, [rawOrders, myStoreId, myStoreName]);

    // Sync store session active with native floating overlay
    useEffect(() => {
        if (!isNativeAndroid() || !myStore) return;
        const sId = String(myStore._id || myStore.id || myStoreId || '');
        const sName = myStore.name || '';
        const enabled = localStorage.getItem('delivery_floating_overlay_enabled') !== 'false';
        if (enabled) {
            setOverlayStoreSessionActive(true, sId, sName);
            const currentToken = localStorage.getItem('authToken');
            if (currentToken) setOverlayAuthToken(currentToken);
            const hasActive = storeOrders.some(o => ['accepted', 'out for delivery', 'shipped'].includes(String(o.status || '').toLowerCase().trim()));
            const hasPending = storeOrders.some(o => ['pending', 'processing', 'order placed', 'confirmed'].includes(String(o.status || '').toLowerCase().trim()));
            const hasAnyStoreOrder = hasActive || hasPending;
            setOverlayOrdersState({ hasActive, hasPending });
            checkOverlayPermission().then(granted => {
                if (granted && hasAnyStoreOrder) showFloatingOverlay();
            });
        }
    }, [myStore, myStoreId, storeOrders]);

    // Listen for incoming orders in real-time to alert store admin and refresh list
    useEffect(() => {
        if (!socket) return;
        const handleNewOrder = () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate([200, 100, 200]);
            }
        };
        socket.on('order:created', handleNewOrder);
        return () => socket.off('order:created', handleNewOrder);
    }, [socket, queryClient]);

    // Role protection
    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#E8EAEF] dark:bg-gray-900">
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

    // MAIN VIEW: Direct Store Management (Delivery Panel and duplicate orders feed removed)
    return (
        <div className="min-h-screen bg-[#E8EAEF] dark:bg-gray-900 transition-colors duration-200 w-full relative pb-16">
            {/* Top Header */}
            <div className="fixed top-0 left-0 right-0 z-50 w-full bg-white dark:bg-gray-800 border-b border-gray-200/80 dark:border-gray-700 px-4 py-3.5 shadow-xs shrink-0">
                <div className="w-full flex items-center justify-between min-h-[40px]">
                    <button
                        type="button"
                        onClick={() => safeNavigateBack(navigate, '/profile')}
                        title={t('Back')}
                        className="p-1.5 text-gray-900 dark:text-white hover:opacity-70 transition-opacity active:scale-95 cursor-pointer"
                    >
                        <ArrowLeft size={22} className="stroke-[2.5]" />
                    </button>

                    <h1 className="text-[16px] font-bold text-gray-900 dark:text-white tracking-tight leading-tight text-center truncate max-w-[200px]">
                        {myStore?.name || t('My Store')}
                    </h1>

                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        title={t('Home')}
                        className="relative overflow-hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1B4332] hover:bg-[#143226] text-white text-xs font-bold active:scale-95 transition-all shadow-xs cursor-pointer select-none"
                    >
                        <Home size={15} className="relative z-10 text-white shrink-0" />
                        <span className="relative z-10 whitespace-nowrap">{t('Home')}</span>
                    </button>
                </div>
            </div>

            {/* Content: StoreManagement */}
            <div className="pt-[72px] max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
                <StoreManagement 
                    onBackToOrders={() => safeNavigateBack(navigate, '/profile')} 
                    hideHeader={true}
                    storeId={myStoreId}
                    fixedStore={myStore}
                />
            </div>
        </div>
    );
};

export default MyStore;
