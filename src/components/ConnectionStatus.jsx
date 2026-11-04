import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

const ConnectionStatus = () => {
    const { t } = useLanguage();
    const [status, setStatus] = useState('online'); // 'online', 'offline', 'slow'
    const [isVisible, setIsVisible] = useState(false);
    const [isRetrying, setIsRetrying] = useState(false);

    const checkConnection = () => {
        if (!navigator.onLine) {
            setStatus('offline');
            setIsVisible(true);
        } else if (navigator.connection) {
            const type = navigator.connection.effectiveType;
            if (type === 'slow-2g' || type === '2g') {
                setStatus('slow');
                setIsVisible(true);
            } else {
                if (status !== 'online') {
                    setStatus('online');
                    setTimeout(() => {
                        setIsVisible(false);
                    }, 800);
                } else {
                    setIsVisible(false);
                }
            }
        } else {
            setStatus('online');
            setIsVisible(false);
        }
    };

    useEffect(() => {
        window.addEventListener('online', checkConnection);
        window.addEventListener('offline', checkConnection);
        
        if (navigator.connection) {
            navigator.connection.addEventListener('change', checkConnection);
        }

        checkConnection();

        return () => {
            window.removeEventListener('online', checkConnection);
            window.removeEventListener('offline', checkConnection);
            if (navigator.connection) {
                navigator.connection.removeEventListener('change', checkConnection);
            }
        };
    }, [status]);

    const handleRetry = () => {
        setIsRetrying(true);
        checkConnection();
        setTimeout(() => {
            setIsRetrying(false);
            if (navigator.onLine) {
                setIsVisible(false);
            }
        }, 1000);
    };

    return (
        <AnimatePresence>
            {isVisible && status !== 'online' && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.16, ease: 'easeOut' }}
                    className="fixed inset-0 z-[120000] flex items-center justify-center p-4 bg-black/75 select-none transform-gpu"
                >
                    <motion.div
                        initial={{ scale: 0.88, opacity: 0, y: 12 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.88, opacity: 0, y: 12 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="bg-white dark:bg-gray-800 rounded-3xl sm:rounded-[2rem] shadow-2xl max-w-sm w-full p-6 sm:p-7 relative overflow-hidden text-center transform-gpu will-change-transform border border-gray-100 dark:border-gray-700"
                    >
                        {/* Close X Button in top right */}
                        <button
                            type="button"
                            onClick={() => setIsVisible(false)}
                            className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors z-20"
                            aria-label="Dismiss"
                        >
                            <X size={18} />
                        </button>

                        <div className="relative w-32 h-32 sm:w-36 sm:h-36 mx-auto mb-3 flex items-center justify-center">
                            {/* Rotating star burst (GPay style in Red/Rose) */}
                            <motion.div
                                initial={{ rotate: -40, scale: 0.2, opacity: 0 }}
                                animate={{ rotate: 30, scale: 1, opacity: 1 }}
                                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                                className="absolute inset-0 pointer-events-none flex items-center justify-center"
                            >
                                {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                                    <motion.div
                                        key={angle}
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: [0, 1.25, 1], opacity: [0, 1, 0.95] }}
                                        transition={{ duration: 0.5, delay: 0.1 + i * 0.02, ease: 'easeOut' }}
                                        style={{
                                            transform: `rotate(${angle}deg) translateY(-76px)`,
                                            transformOrigin: 'center center'
                                        }}
                                        className="absolute"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="#EF4444">
                                            <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
                                        </svg>
                                    </motion.div>
                                ))}
                            </motion.div>

                            {/* Expanding soft ring in Red */}
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0.8 }}
                                animate={{ scale: 1.45, opacity: 0 }}
                                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
                                className="absolute w-32 h-32 sm:w-36 sm:h-36 rounded-full border-2 border-red-500/40 pointer-events-none"
                            />

                            {/* GPay Scalloped Flower Badge (Large flower with Red Base) */}
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: [0, 1.15, 1] }}
                                transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1], delay: 0.05 }}
                                className="w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center relative z-10"
                            >
                                <svg
                                    viewBox="16 16 68 68"
                                    className="w-full h-full"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    {/* Large Scalloped Flower Base */}
                                    <path
                                        d="M 79.70 42.04 A 11.5 11.5 0 0 1 79.70 57.96 A 11.5 11.5 0 0 1 71.74 71.74 A 11.5 11.5 0 0 1 57.96 79.70 A 11.5 11.5 0 0 1 42.04 79.70 A 11.5 11.5 0 0 1 28.26 71.74 A 11.5 11.5 0 0 1 20.30 57.96 A 11.5 11.5 0 0 1 20.30 42.04 A 11.5 11.5 0 0 1 28.26 28.26 A 11.5 11.5 0 0 1 42.04 20.30 A 11.5 11.5 0 0 1 57.96 20.30 A 11.5 11.5 0 0 1 71.74 28.26 A 11.5 11.5 0 0 1 79.70 42.04 Z"
                                        fill="#DC2626"
                                    />
                                    {/* WiFi Signal Icon inside Flower */}
                                    <foreignObject x="26" y="26" width="48" height="48">
                                        <div className="w-full h-full flex items-center justify-center">
                                            <motion.div
                                                initial={{ scale: 0, rotate: -20 }}
                                                animate={{ scale: 1, rotate: 0 }}
                                                transition={{ duration: 0.4, delay: 0.22, type: 'spring' }}
                                            >
                                                <WifiOff size={32} className="text-white stroke-[2.8]" />
                                            </motion.div>
                                        </div>
                                    </foreignObject>
                                </svg>
                            </motion.div>
                        </div>

                        {/* Title & Subtitle */}
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1.5">
                            {status === 'offline' ? t('No Internet Connection') : t('Slow Connection')}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 font-medium leading-relaxed max-w-[280px] mx-auto">
                            {status === 'offline' 
                                ? t('Please check your network settings and try again.') 
                                : t('Your connection is slow. Features may be limited.')}
                        </p>

                        {/* Retry Action Button */}
                        <button
                            type="button"
                            onClick={handleRetry}
                            disabled={isRetrying}
                            className="w-full bg-black text-white py-3 sm:py-3.5 px-6 rounded-full font-bold text-sm shadow-lg shadow-gray-200 dark:shadow-gray-900/20 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                        >
                            <RefreshCw size={16} className={isRetrying ? 'animate-spin' : ''} />
                            <span>{isRetrying ? t('Checking...') : t('Try Again')}</span>
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ConnectionStatus;
