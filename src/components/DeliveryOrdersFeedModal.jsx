import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import LogoutModal from './LogoutModal';
import DeliveryOrdersListFeed from './DeliveryOrdersListFeed';
import { registerModalBackHandler } from '../utils/useBackButton';

const DeliveryOrdersFeedModal = ({ isOpen, onClose, orders = [], onSelectOrder }) => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    useEffect(() => {
        if (!isOpen || !onClose) return;
        return registerModalBackHandler(onClose);
    }, [isOpen, onClose]);

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
                    onConfirm={() => {
                        logout();
                        navigate('/login');
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
                    <DeliveryOrdersListFeed
                        orders={orders}
                        onSelectOrder={onSelectOrder}
                        paddingBottomClass="pb-36"
                    />
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default DeliveryOrdersFeedModal;
