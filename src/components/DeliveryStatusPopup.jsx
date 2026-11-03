import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThumbsUp } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const DeliveryStatusPopup = ({
    isOpen,
    type = 'accepted', // 'accepted' (blue + thumbs up) | 'delivered' (green + tick) | 'cancelled' (red + X)
    title,
    subtitle,
    onComplete,
    duration = 1800
}) => {
    const { t } = useLanguage();

    useEffect(() => {
        if (!isOpen) return;
        const timer = setTimeout(() => {
            onComplete?.();
        }, duration);
        return () => clearTimeout(timer);
    }, [isOpen, onComplete, duration]);

    if (!isOpen) return null;

    const config = {
        accepted: {
            flowerColor: '#2563EB', // Blue
            starColor: '#3B82F6',
            ringColor: 'border-blue-500/40',
            defaultTitle: t('Order Accepted!'),
            defaultSubtitle: t('Order is ready for delivery')
        },
        delivered: {
            flowerColor: '#1EA34B', // Green
            starColor: '#22C55E',
            ringColor: 'border-green-500/40',
            defaultTitle: t('Delivered Successfully!'),
            defaultSubtitle: t('Order has been delivered')
        },
        cancelled: {
            flowerColor: '#DC2626', // Red
            starColor: '#EF4444',
            ringColor: 'border-red-500/40',
            defaultTitle: t('Order Cancelled'),
            defaultSubtitle: t('Order has been cancelled')
        }
    }[type] || {
        flowerColor: '#2563EB',
        starColor: '#3B82F6',
        ringColor: 'border-blue-500/40',
        defaultTitle: t('Order Accepted!'),
        defaultSubtitle: t('Order is ready for delivery')
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[120000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md select-none"
                    onClick={(e) => e.stopPropagation()}
                >
                    <motion.div
                        initial={{ scale: 0.4, opacity: 0, y: 30 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.7, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 450, damping: 22 }}
                        className="bg-white dark:bg-gray-800 rounded-3xl sm:rounded-[2rem] shadow-2xl max-w-sm w-full p-6 sm:p-7 relative overflow-hidden"
                    >
                        <div className="text-center">
                            <div className="relative w-32 h-32 sm:w-36 sm:h-36 mx-auto mb-3 flex items-center justify-center">
                                {/* Rotating star burst (GPay style) */}
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
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill={config.starColor}>
                                                <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
                                            </svg>
                                        </motion.div>
                                    ))}
                                </motion.div>

                                {/* Expanding soft ring */}
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0.8 }}
                                    animate={{ scale: 1.45, opacity: 0 }}
                                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
                                    className={`absolute w-32 h-32 sm:w-36 sm:h-36 rounded-full border-2 ${config.ringColor} pointer-events-none`}
                                />

                                {/* Scalloped Flower Badge */}
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
                                            fill={config.flowerColor}
                                        />

                                        {/* TYPE: ACCEPTED -> Thumbs Up Symbol */}
                                        {type === 'accepted' && (
                                            <foreignObject x="26" y="26" width="48" height="48">
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <motion.div
                                                        initial={{ scale: 0, rotate: -20 }}
                                                        animate={{ scale: 1, rotate: 0 }}
                                                        transition={{ duration: 0.4, delay: 0.25, type: 'spring' }}
                                                    >
                                                        <ThumbsUp size={34} className="text-white fill-white" strokeWidth={1.5} />
                                                    </motion.div>
                                                </div>
                                            </foreignObject>
                                        )}

                                        {/* TYPE: DELIVERED -> Animated Checkmark Tick */}
                                        {type === 'delivered' && (
                                            <motion.path
                                                d="M 36 50.5 L 45.5 59 L 63 41.5"
                                                stroke="#FFFFFF"
                                                strokeWidth="6.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                initial={{ pathLength: 0, opacity: 0 }}
                                                animate={{ pathLength: 1, opacity: 1 }}
                                                transition={{ duration: 0.45, delay: 0.25, ease: 'easeOut' }}
                                            />
                                        )}

                                        {/* TYPE: CANCELLED -> Animated X Symbol */}
                                        {type === 'cancelled' && (
                                            <>
                                                <motion.path
                                                    d="M 38 38 L 62 62"
                                                    stroke="#FFFFFF"
                                                    strokeWidth="6.5"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    initial={{ pathLength: 0, opacity: 0 }}
                                                    animate={{ pathLength: 1, opacity: 1 }}
                                                    transition={{ duration: 0.35, delay: 0.2, ease: 'easeOut' }}
                                                />
                                                <motion.path
                                                    d="M 62 38 L 38 62"
                                                    stroke="#FFFFFF"
                                                    strokeWidth="6.5"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    initial={{ pathLength: 0, opacity: 0 }}
                                                    animate={{ pathLength: 1, opacity: 1 }}
                                                    transition={{ duration: 0.35, delay: 0.3, ease: 'easeOut' }}
                                                />
                                            </>
                                        )}
                                    </svg>
                                </motion.div>
                            </div>

                            <motion.h3
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3, duration: 0.3 }}
                                className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1.5"
                            >
                                {title || config.defaultTitle}
                            </motion.h3>

                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4, duration: 0.3 }}
                                className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium"
                            >
                                {subtitle || config.defaultSubtitle}
                            </motion.p>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default DeliveryStatusPopup;
