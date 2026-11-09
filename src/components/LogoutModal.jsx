import React from 'react';
import { X, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

const LogoutModal = ({
    isOpen,
    onClose,
    onConfirm,
    isLoggingOut = false,
    title,
    message,
    subtitle,
    confirmText,
    cancelText
}) => {
    const { t } = useLanguage();

    const displayTitle = title || t('Logout');
    const displayMessage = message || t('Are you sure want to Logout?');
    const displaySubtitle = subtitle !== undefined ? subtitle : (
        <>{t('Thank you and see you again!')} <span className="text-red-500">❤️</span></>
    );
    const displayConfirmText = isLoggingOut ? t('Logging out...') : (confirmText || t('Yes, Logout'));
    const displayCancelText = cancelText || t('Cancel');

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={!isLoggingOut ? onClose : undefined}
                        className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-[999] transition-all"
                    />

                    {/* Slide-up Container */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed bottom-0 left-0 right-0 z-[1000] bg-white dark:bg-gray-900 rounded-t-3xl shadow-[0_-20px_50px_rgba(0,0,0,0.15)] overflow-hidden max-w-md mx-auto"
                        style={{ paddingBottom: 'calc(2.5rem + env(safe-area-inset-bottom, 0px))' }}
                    >
                        {/* Header */}
                        <div className="px-5 pt-4 pb-2 flex items-center justify-between border-b border-gray-50 dark:border-gray-800">
                            <h3 className="text-xl font-bold text-red-500 tracking-tight ml-auto mr-auto pl-6">
                                {displayTitle}
                            </h3>
                            <button
                                type="button"
                                onClick={!isLoggingOut ? onClose : undefined}
                                disabled={isLoggingOut}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-400 disabled:opacity-40"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="px-5 py-4 pb-2 flex flex-col items-center">
                            <h2 className="text-[22px] font-bold text-gray-900 dark:text-white text-center mb-1.5 leading-tight">
                                {displayMessage}
                            </h2>
                            {displaySubtitle && (
                                <p className="text-sm font-medium text-gray-400 dark:text-gray-500 text-center mb-4 flex items-center gap-2">
                                    {displaySubtitle}
                                </p>
                            )}

                            {/* Buttons */}
                            <div className="flex flex-col gap-2 w-full">
                                <button
                                    type="button"
                                    onClick={onConfirm}
                                    disabled={isLoggingOut}
                                    className="w-full py-3 bg-black text-white rounded-full font-bold text-base hover:bg-gray-800 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {displayConfirmText}
                                </button>
                                <button
                                    type="button"
                                    onClick={!isLoggingOut ? onClose : undefined}
                                    disabled={isLoggingOut}
                                    className="w-full py-3 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 rounded-full font-bold text-base border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    {displayCancelText}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default LogoutModal;