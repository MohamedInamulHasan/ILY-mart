import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, LogOut, Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import LogoutModal from './LogoutModal';
import DeliveryOrdersListFeed from './DeliveryOrdersListFeed';

const DeliveryOrdersFeedModal = ({ isOpen, onClose, orders = [], onSelectOrder }) => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const { logout, setUser } = useAuth();
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (!isOpen) {
            setSearchQuery('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-[99998] bg-[#E8EAEF] dark:bg-gray-900 w-full h-full min-h-screen flex flex-col overflow-hidden"
            >
                <LogoutModal
                    isOpen={showLogoutModal}
                    onClose={() => setShowLogoutModal(false)}
                    title={t('Exit Delivery Mode')}
                    message={t('Exit delivery panel and return to normal user pages?')}
                    subtitle={t('You will remain logged in as a normal user.')}
                    confirmText={t('Exit to App')}
                    cancelText={t('Cancel')}
                    onConfirm={async () => {
                        localStorage.setItem('delivery_boy_logged_out', 'true');
                        localStorage.removeItem('delivery_session_active');
                        localStorage.setItem('delivery_floating_overlay_enabled', 'false');

                        const backupToken = localStorage.getItem('customer_backup_token');
                        const backupUser = localStorage.getItem('customer_backup_user');
                        if (backupToken) {
                            localStorage.setItem('authToken', backupToken);
                            if (backupUser) {
                                try {
                                    const parsed = JSON.parse(backupUser);
                                    localStorage.setItem('userInfo', backupUser);
                                    if (setUser) setUser(parsed);
                                } catch (_) {}
                            }
                            localStorage.removeItem('customer_backup_token');
                            localStorage.removeItem('customer_backup_user');
                        }

                        setShowLogoutModal(false);
                        if (onClose) onClose();
                        navigate('/profile', { replace: true });
                    }}
                />

                {/* Header: Clean White Header with Logout Icon on Right */}
                <div className="w-full bg-white dark:bg-gray-800 border-b border-gray-200/80 dark:border-gray-700 px-4 py-3.5 shadow-xs shrink-0 relative">
                    <div className="w-full flex items-center justify-between min-h-[42px]">
                        {/* Back button */}
                        <button
                            type="button"
                            onClick={onClose}
                            title={t('Back')}
                            className="p-1.5 text-gray-900 dark:text-white hover:opacity-70 transition-opacity active:scale-95"
                        >
                            <ArrowLeft size={22} className="stroke-[2.5]" />
                        </button>

                        {/* Centered Title */}
                        <h1 className="text-[16px] font-bold text-gray-900 dark:text-white tracking-tight leading-tight text-center">
                            {t('Orders List')}
                        </h1>

                        {/* Right: Logout button */}
                        <button
                            type="button"
                            onClick={() => setShowLogoutModal(true)}
                            title={t('Logout')}
                            className="p-1.5 text-red-500 hover:opacity-70 transition-opacity active:scale-95"
                        >
                            <LogOut size={22} className="stroke-[2.5]" />
                        </button>
                    </div>
                </div>

                {/* Scrollable Order Cards List */}
                <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 max-w-2xl mx-auto w-full" style={{ WebkitOverflowScrolling: 'touch' }}>
                    {/* Zepto-style Search Bar like Order page */}
                    <div className="relative mb-4 sm:mb-5">
                        <input
                            type="text"
                            placeholder={t('Search ID, customer, item, status...')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 sm:pl-12 pr-11 py-3.5 sm:py-4 text-[14.5px] sm:text-[15.5px] font-medium rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:outline-none focus-visible:outline-none ring-0 focus:ring-0 focus-visible:ring-0 shadow-none transition-colors duration-200"
                        />
                        <Search className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 stroke-[2.2]" size={20} />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 sm:right-3.5 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 active:scale-90 transition-all rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center cursor-pointer"
                                title={t('Clear')}
                            >
                                <X size={18} className="stroke-[2.5]" />
                            </button>
                        )}
                    </div>

                    <DeliveryOrdersListFeed
                        orders={orders}
                        searchQuery={searchQuery}
                        onSelectOrder={onSelectOrder}
                        paddingBottomClass="pb-36"
                    />
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default DeliveryOrdersFeedModal;
