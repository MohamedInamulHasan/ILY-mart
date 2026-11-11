import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, ChevronRight } from 'lucide-react';

const CustomerNotificationBanner = () => {
    const [banner, setBanner] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handlePush = (e) => {
            const notif = e.detail;
            if (!notif) return;

            const title = notif.title || notif.notification?.title || 'Order Update';
            const body = notif.body || notif.notification?.body || '';
            const orderId = notif.data?.orderId || notif.data?.id;

            setBanner({
                title,
                body,
                orderId
            });

            // Auto dismiss after 6 seconds
            const timer = setTimeout(() => {
                setBanner(null);
            }, 6000);

            return () => clearTimeout(timer);
        };

        window.addEventListener('fcmNotificationReceived', handlePush);
        return () => window.removeEventListener('fcmNotificationReceived', handlePush);
    }, []);

    if (!banner) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -60, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -60, scale: 0.95 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                className="fixed top-3 left-3 right-3 z-[99999] max-w-md mx-auto"
            >
                <div
                    onClick={() => {
                        if (banner.orderId) {
                            navigate(`/order-details/${banner.orderId}`);
                        } else {
                            navigate('/orders');
                        }
                        setBanner(null);
                    }}
                    className="bg-white dark:bg-gray-800 border-2 border-[#2E5A2E] dark:border-[#7CA90E] rounded-2xl p-3.5 shadow-2xl flex items-center gap-3 cursor-pointer select-none active:scale-98 transition-transform"
                >
                    <div className="w-10 h-10 rounded-xl bg-[#2E5A2E]/10 dark:bg-[#7CA90E]/20 text-[#2E5A2E] dark:text-[#7CA90E] flex items-center justify-center shrink-0">
                        <Bell size={20} className="animate-bounce" />
                    </div>

                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                            {banner.title}
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mt-0.5">
                            {banner.body}
                        </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                        <ChevronRight size={18} className="text-gray-400" />
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setBanner(null);
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default CustomerNotificationBanner;
