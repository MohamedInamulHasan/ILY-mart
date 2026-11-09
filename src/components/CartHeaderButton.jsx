import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCart } from '../context/CartContext';

const CartHeaderButton = ({ className = '' }) => {
    const { cartCount } = useCart();

    const defaultClass = "w-[38px] h-[38px] flex items-center justify-center bg-white dark:bg-white/80 rounded-full text-gray-900 dark:text-gray-900 transition-transform active:scale-95 shadow-sm border border-black/5 dark:border-gray-200/50 relative";
    const resolvedClass = className || defaultClass;

    return (
        <Link 
            to="/cart"
            className={resolvedClass}
            aria-label="View cart"
        >
            <motion.div
                animate={cartCount > 0 ? {
                    rotate: [0, -12, 12, -8, 8, 0],
                    scale: [1, 1.08, 1.08, 1, 1]
                } : { rotate: 0, scale: 1 }}
                transition={{
                    repeat: Infinity,
                    repeatDelay: 2.2,
                    duration: 0.7,
                    ease: 'easeInOut'
                }}
                className="flex items-center justify-center"
            >
                <ShoppingCart size={19} className="text-[#2E5A2E] dark:text-[#2E5A2E]" />
            </motion.div>
            {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold h-[18px] w-[18px] rounded-full flex items-center justify-center shadow-sm border-2 border-white dark:border-gray-800">
                    {cartCount}
                </span>
            )}
        </Link>
    );
};

export default CartHeaderButton;
