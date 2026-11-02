import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { registerModalBackHandler } from '../utils/useBackButton';

const CancelOrderModal = ({
    order,
    isOpen,
    onClose,
    onConfirmCancel,
    onConfirm,
    isLoading = false,
    isCancelling = false
}) => {
    const { t } = useLanguage();
    const handleConfirm = onConfirmCancel || onConfirm;
    const loading = isLoading || isCancelling;

    useEffect(() => {
        if (!isOpen || !onClose) return;
        return registerModalBackHandler(onClose);
    }, [isOpen, onClose]);

    if (!isOpen || !order) return null;

    const orderIdShort = String(order._id || order.id || '000000').slice(-6).toUpperCase();

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 z-[100020] flex items-center justify-center p-4 bg-black/75 select-none"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white dark:bg-gray-900 rounded-[2.2rem] max-w-sm w-full p-6 text-center shadow-2xl border border-gray-100 dark:border-gray-800 space-y-5"
                >
                    <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto shadow-xs">
                        <AlertTriangle size={32} />
                    </div>

                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            {t('Cancel Order')} #{orderIdShort}?
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                            {t('Are you sure you want to cancel this order?')}
                        </p>
                    </div>

                    {/* Simple Yes or Cancel Buttons */}
                    <div className="flex items-center gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 py-3.5 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 active:scale-[0.98] text-gray-700 dark:text-gray-200 rounded-2xl font-bold text-sm transition-all text-center"
                        >
                            {t('Cancel')}
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirm}
                            disabled={loading}
                            className="flex-1 py-3.5 px-4 bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white rounded-2xl font-bold text-sm shadow-md shadow-red-500/20 transition-all flex items-center justify-center gap-2 text-center"
                        >
                            {loading ? (
                                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            ) : null}
                            <span>{loading ? t('Cancelling...') : t('Yes')}</span>
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default CancelOrderModal;
