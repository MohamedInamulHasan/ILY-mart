import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronsRight } from 'lucide-react';

/**
 * SwipeActionButton - A robust, mobile-optimized swipe-to-action button
 * supporting yellow (processing), blue (out for delivery), green (delivered), and red (cancel) variants.
 */
const SwipeActionButton = ({
    onSuccess,
    label = 'Swipe to Accept',
    isLoading = false,
    loadingLabel = 'Processing...',
    heightClass = 'h-[60px] sm:h-[64px]',
    knobSizeClass = 'w-[48px] h-[48px] sm:w-[52px] sm:h-[52px]',
    variant = 'green', // 'yellow' | 'amber' | 'blue' | 'sky' | 'green' | 'red'
    autoReset = false,
    className = ''
}) => {
    const trackRef = useRef(null);
    const knobRef = useRef(null);
    const [maxDrag, setMaxDrag] = useState(200);
    const [isDragging, setIsDragging] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);

    // Color definitions based on variant
    const getColors = () => {
        switch (variant) {
            case 'yellow':
            case 'amber':
                return {
                    track: 'bg-amber-500 hover:bg-amber-600 border-amber-500',
                    knob: 'text-amber-600'
                };
            case 'blue':
            case 'sky':
                return {
                    track: 'bg-[#0284c7] hover:bg-[#0369a1] border-[#0284c7]',
                    knob: 'text-[#0284c7]'
                };
            case 'red':
            case 'rose':
                return {
                    track: 'bg-rose-600 hover:bg-rose-700 border-rose-600',
                    knob: 'text-rose-600'
                };
            case 'green':
            default:
                return {
                    track: 'bg-emerald-600 hover:bg-emerald-700 border-emerald-600',
                    knob: 'text-emerald-600'
                };
        }
    };

    const colors = getColors();

    // Calculate maximum drag width accurately via ResizeObserver & clientWidth
    useEffect(() => {
        const updateWidth = () => {
            if (trackRef.current) {
                const trackWidth = trackRef.current.clientWidth;
                const knobWidth = knobRef.current?.offsetWidth || (trackWidth < 380 ? 44 : 50);
                // 14px accounts for container padding (p-1.5 = 6px on each side + 2px safety)
                const available = Math.max(0, trackWidth - knobWidth - 14);
                if (available > 0) {
                    setMaxDrag(available);
                }
            }
        };

        updateWidth();
        window.addEventListener('resize', updateWidth);

        let resizeObserver;
        if (typeof ResizeObserver !== 'undefined' && trackRef.current) {
            resizeObserver = new ResizeObserver(() => updateWidth());
            resizeObserver.observe(trackRef.current);
        }

        const timer = setTimeout(updateWidth, 150);
        return () => {
            window.removeEventListener('resize', updateWidth);
            if (resizeObserver) resizeObserver.disconnect();
            clearTimeout(timer);
        };
    }, []);

    const handleDragStart = () => {
        setIsDragging(true);
    };

    const handleDragEnd = (e, info) => {
        setIsDragging(false);
        const traveled = info.offset.x;

        // Trigger success if swiped past 45% of available track length
        if (traveled >= maxDrag * 0.45 && maxDrag > 30) {
            setIsCompleted(true);
            if (onSuccess) {
                onSuccess();
            }
            if (autoReset) {
                setTimeout(() => {
                    setIsCompleted(false);
                }, 500);
            }
        } else {
            setIsCompleted(false);
        }
    };

    return (
        <div
            ref={trackRef}
            className={`relative w-full ${heightClass} rounded-full ${colors.track} text-white flex items-center p-1.5 overflow-hidden select-none border shadow-xs ${className}`}
            style={{ touchAction: 'none' }}
        >
            {/* Continuous sliding light sheen animation from left to right */}
            <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none"
                animate={{ x: ['-100%', '150%'] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
            />

            {/* Draggable Porter White Round Knob with idle nudge/shake like in Porter Partner */}
            <motion.div
                ref={knobRef}
                drag={!isLoading && !isCompleted ? 'x' : false}
                dragDirectionLock
                dragConstraints={{ left: 0, right: maxDrag }}
                dragElastic={0}
                dragMomentum={false}
                dragSnapToOrigin={!isCompleted}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                animate={
                    isLoading || isCompleted
                        ? { x: maxDrag }
                        : isDragging
                        ? undefined
                        : {
                            x: [0, 9, -2, 7, 0, 0, 0, 0]
                        }
                }
                transition={
                    isLoading || isCompleted
                        ? { type: 'spring', damping: 25, stiffness: 200 }
                        : isDragging
                        ? undefined
                        : {
                            repeat: Infinity,
                            repeatDelay: 1.8,
                            duration: 1.1,
                            ease: 'easeInOut'
                        }
                }
                className={`${knobSizeClass} rounded-full bg-white ${colors.knob} flex items-center justify-center shrink-0 z-20 cursor-grab active:cursor-grabbing select-none shadow-md`}
                style={{ touchAction: 'none' }}
                onClick={(e) => e.stopPropagation()}
            >
                <ChevronsRight size={24} className={`stroke-[3.5] ${colors.knob}`} />
            </motion.div>

            {/* Centered Track Label - Exactly in the center of button for all */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 px-4">
                <span className="font-black text-base sm:text-lg tracking-wider uppercase text-white text-center select-none truncate">
                    {isLoading ? (
                        <span className="inline-flex items-center justify-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" />
                            <span>{loadingLabel}</span>
                        </span>
                    ) : (
                        label
                    )}
                </span>
            </div>
        </div>
    );
};

export default SwipeActionButton;
