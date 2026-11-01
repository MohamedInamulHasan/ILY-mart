import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import SwipeActionButton from './SwipeActionButton';

const CancelOrderModal = ({
    order,
    isOpen,
    onClose,
    onConfirmCancel,
    isLoading = false
}) => {
    const { t } = useLanguage();
    if (!isOpen || !order) return null;

    const orderIdShort = String(order._id || order.id || '000000').slice(-6).toUpperCase();
    const customerName = order.shippingAddress?.name || order.user || t('Customer');
    const street = order.shippingAddress?.street || '';
    const city = order.shippingAddress?.city || 'Ilayangudi';

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 z-[100020] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm select-none"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white dark:bg-gray-900 rounded-[2.2rem] max-w-sm w-full p-6 text-center shadow-2xl border border-gray-100 dark:border-gray-800 space-y-4"
                >
                    <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto shadow-xs">
                        <AlertTriangle size={32} />
                    </div>

                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            {t('Cancel Order')} #{orderIdShort}?
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
                            {t('Are you sure you want to cancel this order?')}
                        </p>
                    </div>

                    {/* Customer snippet */}
                    <div className="bg-gray-50 dark:bg-gray-800/80 rounded-2xl p-3 text-xs text-gray-600 dark:text-gray-300">
                        <p className="font-bold text-gray-800 dark:text-gray-100 truncate">{customerName}</p>
                        <p className="text-[11px] text-gray-400 truncate">{street}{city ? `, ${city}` : ''}</p>
                    </div>

                    {/* RED Swipe to Cancel Button */}
                    <div className="pt-2">
                        <SwipeActionButton
                            variant="red"
                            label={t('Swipe to Cancel')}
                            loadingLabel={t('Cancelling...')}
                            isLoading={isLoading}
                            heightClass="h-[60px] sm:h-[64px]"
                            knobSizeClass="w-[48px] h-[48px] sm:w-[52px] sm:h-[52px]"
                            onSuccess={onConfirmCancel}
                        />
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="w-full py-2 text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors uppercase tracking-wider"
                    >
                        {t('Keep Order')}
                    </button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default CancelOrderModal;
