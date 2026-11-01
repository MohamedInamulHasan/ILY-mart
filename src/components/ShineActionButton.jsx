import React from 'react';
import { motion } from 'framer-motion';

const ShineActionButton = ({
    onClick,
    label,
    variant = 'green', // 'green' | 'yellow' | 'blue' | 'cancelled'
    disabled = false,
    className = ''
}) => {
    const getVariantStyles = () => {
        switch (variant) {
            case 'yellow':
                return 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs';
            case 'blue':
                return 'bg-sky-500 hover:bg-sky-600 text-white shadow-xs';
            case 'cancelled':
                return 'bg-gray-200 dark:bg-gray-750 text-gray-500 dark:text-gray-400 border border-red-200/50 dark:border-red-900/30';
            case 'green':
            default:
                return 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs';
        }
    };

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`relative w-full py-3.5 px-6 rounded-full font-bold text-sm sm:text-base flex items-center justify-center overflow-hidden transition-all duration-200 active:scale-[0.98] select-none ${getVariantStyles()} ${className}`}
        >
            {/* Animated gleam/sheen wave across button */}
            <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent pointer-events-none"
                animate={{ x: ['-100%', '200%'] }}
                transition={{
                    repeat: Infinity,
                    duration: 2.2,
                    ease: 'easeInOut',
                    repeatDelay: 0.8
                }}
            />
            <span className="relative z-10">{label}</span>
        </button>
    );
};

export default ShineActionButton;
