import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ArrowUpNarrowWide, ArrowDownWideNarrow, ListFilter } from 'lucide-react';
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
                className={`w-10 h-10 sm:w-11 sm:h-11 flex-shrink-0 flex items-center justify-center rounded-full border transition-all duration-300 active:scale-95 ${isOpen
                    ? 'border-[#2E5A2E] dark:border-[#CBF9B2] bg-[#2E5A2E]/5 dark:bg-[#CBF9B2]/10'
                    : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800'
                    }`}
                title={t(selectedOption.label)}
            >
                <div className={`${isOpen ? 'text-[#2E5A2E] dark:text-[#CBF9B2]' : 'text-gray-900 dark:text-white'}`}>
                    {selectedOption.icon}
                </div>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 5, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 backdrop-blur-xl border border-gray-100 dark:border-gray-700 rounded-2xl z-[100] overflow-hidden"
                    >
                        <div className="p-2 space-y-1">
                            {sortOptions.map((option) => (
                                <button
                                    key={option.id}
                                    onClick={() => {
                                        onSortChange(option.id);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-normal transition-all duration-200 ${currentSort === option.id
                                        ? 'bg-[#2E5A2E] dark:bg-[#CBF9B2] text-white dark:text-gray-900'
                                        : 'text-gray-600 dark:text-gray-300 hover:bg-[#2E5A2E]/5 dark:hover:bg-white/5 hover:text-[#2E5A2E] dark:hover:text-[#CBF9B2]'
                                        }`}
                                >
                                    <span className={`${currentSort === option.id ? 'text-white dark:text-gray-900' : 'text-gray-400'}`}>
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
