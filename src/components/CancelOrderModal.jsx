import React from 'react';
import { X, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

const CancelOrderModal = ({ isOpen, onClose, onConfirm, isCancelling = false }) => {
    const { t } = useLanguage();

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-[999] transition-all"
                    />

                    {/* Slide-up Container */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed bottom-0 left-0 right-0 z-[1000] bg-white dark:bg-gray-900 rounded-t-[2.5rem] shadow-[0_-20px_50px_rgba(0,0,0,0.15)] overflow-hidden max-w-md mx-auto"
                    >
                        {/* Header */}
                        <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-gray-50 dark:border-gray-800">
                            <h3 className="text-xl font-bold text-red-500 tracking-tight ml-auto mr-auto pl-6">
                                {t('Cancel Order')}
                            </h3>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-400"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-8 flex flex-col items-center">
                            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
                                <RotateCcw size={32} className="text-red-600 dark:text-red-400" />
                            </div>
                            <h2 className="text-[22px] font-bold text-gray-900 dark:text-white text-center mb-3 leading-tight">
                                {t('Are you sure want to cancel?')}
                            </h2>
                            <p className="text-sm font-medium text-gray-400 dark:text-gray-500 text-center mb-8">
                                {t('This action cannot be undone.')}
                            </p>

                            {/* Buttons */}
                            <div className="flex flex-col gap-3 w-full">
                                <button
                                    onClick={onConfirm}
                                    disabled={isCancelling}
                                    className="w-full py-4 bg-black text-white rounded-full font-bold text-base hover:bg-gray-800 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isCancelling ? t('Cancelling...') : t('Yes, Cancel')}
                                </button>
                                <button
                                    onClick={onClose}
                                    className="w-full py-4 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 rounded-full font-bold text-base border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                                >
                                    {t('No, Keep')}
                                </button>
                            </div>
                        </div>

                        {/* Safe Area spacing for mobile */}
                        <div className="h-4" />
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default CancelOrderModal;
