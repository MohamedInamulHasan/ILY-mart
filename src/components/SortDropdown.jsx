import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ArrowUpNarrowWide, ArrowDownWideNarrow, ListFilter, SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

const SortDropdown = ({ currentSort, onSortChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const { t } = useLanguage();

    const sortOptions = [
        { id: 'none', label: 'Default', icon: <ListFilter size={16} /> },
        { id: 'lowToHigh', label: 'Price: Low to High', icon: <ArrowUpNarrowWide size={16} /> },
        { id: 'highToLow', label: 'Price: High to Low', icon: <ArrowDownWideNarrow size={16} /> },
    ];

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = sortOptions.find(opt => opt.id === currentSort) || sortOptions[0];

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-12 h-12 sm:w-[52px] sm:h-[52px] flex-shrink-0 flex items-center justify-center rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 transition-colors active:scale-95 cursor-pointer shadow-none"
                title={t('Filter & Sort')}
                aria-label={t('Filter & Sort')}
            >
                <SlidersHorizontal size={20} className="stroke-[2.2] text-gray-700 dark:text-gray-200" />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 5, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="absolute right-0 top-full mt-1.5 w-44 sm:w-48 bg-white dark:bg-gray-800 backdrop-blur-xl border border-gray-100 dark:border-gray-700 rounded-xl z-[100] overflow-hidden shadow-lg"
                    >
                        <div className="p-1.5 space-y-0.5">
                            {sortOptions.map((option) => (
                                <button
                                    key={option.id}
                                    onClick={() => {
                                        onSortChange(option.id);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${currentSort === option.id ? 'bg-black text-white font-bold shadow-xs dark:bg-black dark:text-white' : 'text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700/60 hover:text-black dark:hover:text-white'
                                        }`}
                                >
                                    <span className={`${currentSort === option.id ? 'text-white' : 'text-gray-400'}`}>
                                        {option.icon}
                                    </span>
                                    {t(option.label)}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SortDropdown;
