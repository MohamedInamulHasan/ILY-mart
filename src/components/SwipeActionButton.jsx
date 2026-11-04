import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Check } from 'lucide-react';

/**
 * SwipeActionButton - A robust, mobile-optimized swipe-to-action button
 * supporting yellow (processing), blue (out for delivery), green (delivered), and red (cancel) variants.
 * Requires swiping fully to the right track end. As it reaches the end / upon release,
 * the round arrow changes into a round tick mark before moving to the next action/step.
 */
const SwipeActionButton = ({
    onSuccess,
    label = 'Swipe to Accept',
    isLoading = false,
    loadingLabel = 'Processing...',
    heightClass = 'h-[60px] sm:h-[64px]',
    knobSizeClass = 'w-[48px] h-[48px] sm:w-[52px] sm:h-[52px]',
    textSizeClass = 'text-base sm:text-lg',
    iconSize = 22,
    variant = 'green', // 'yellow' | 'amber' | 'blue' | 'sky' | 'green' | 'red'
    autoReset = false,
    className = ''
}) => {
    const trackRef = useRef(null);
    const knobRef = useRef(null);
    const [maxDrag, setMaxDrag] = useState(200);
    const [isDragging, setIsDragging] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);
    const [isNearEnd, setIsNearEnd] = useState(false);
    const [isSuccessState, setIsSuccessState] = useState(false);

    // Color definitions based on variant
    const getColors = () => {
        switch (variant) {
            case 'outline-white':
            case 'white':
                return {
                    track: 'bg-white border-2 border-black',
                    text: 'text-black',
                    knob: 'text-white',
                    knobBg: 'bg-black shadow-md',
                    sheen: 'via-gray-400/20'
                };
            case 'black-shine':
            case 'black':
                return {
                    track: 'bg-black border-2 border-black shadow-lg',
                    text: 'text-white',
                    knob: 'text-black',
                    knobBg: 'bg-white shadow-md',
                    sheen: 'via-white/40'
                };
            case 'gray':
            case 'grey':
                return {
                    track: 'bg-gray-400 hover:bg-gray-500 border-gray-400',
                    text: 'text-white',
                    knob: 'text-gray-500',
                    knobBg: 'bg-white shadow-md',
                    sheen: 'via-white/25'
                };
            case 'yellow':
            case 'amber':
                return {
                    track: 'bg-amber-500 hover:bg-amber-600 border-amber-500',
                    text: 'text-white',
                    knob: 'text-amber-600',
                    knobBg: 'bg-white',
                    sheen: 'via-white/25'
                };
            case 'blue':
            case 'sky':
                return {
                    track: 'bg-[#0284c7] hover:bg-[#0369a1] border-[#0284c7]',
                    text: 'text-white',
                    knob: 'text-[#0284c7]',
                    knobBg: 'bg-white',
                    sheen: 'via-white/25'
                };
            case 'red':
            case 'rose':
                return {
                    track: 'bg-rose-600 hover:bg-rose-700 border-rose-600',
                    text: 'text-white',
                    knob: 'text-rose-600',
                    knobBg: 'bg-white',
                    sheen: 'via-white/25'
                };
            case 'green':
            default:
                return {
                    track: 'bg-emerald-600 hover:bg-emerald-700 border-emerald-600',
                    text: 'text-white',
                    knob: 'text-emerald-600',
                    knobBg: 'bg-white',
                    sheen: 'via-white/25'
                };
        }
    };

    const colors = getColors();
    const isEnableDisable = variant === 'outline-white' || variant === 'black-shine';

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

    const handleDrag = (e, info) => {
        const traveled = info.offset.x;
        // When dragged near the end (past 80% or within 28px of maxDrag), transform arrow to tick
        if (traveled >= maxDrag * 0.8 || traveled >= maxDrag - 28) {
            setIsNearEnd(true);
        } else {
            setIsNearEnd(false);
        }
    };

    const handleDragEnd = (e, info) => {
        setIsDragging(false);
        const traveled = info.offset.x;

        // User must swipe FULLY to the end (at least 82% of track or within 24px of maxDrag)
        const isFullySwiped = (traveled >= maxDrag * 0.82 || traveled >= maxDrag - 24) && maxDrag > 30;

        if (isFullySwiped) {
            setIsCompleted(true);
            setIsSuccessState(true);
            setIsNearEnd(true);

            // Give a crisp, satisfying pause with the round tick icon before moving to next
            setTimeout(() => {
                if (onSuccess) {
                    onSuccess();
                }
                if (autoReset) {
                    setTimeout(() => {
                        setIsCompleted(false);
                        setIsSuccessState(false);
                        setIsNearEnd(false);
                    }, 400);
                }
            }, 260);
        } else {
            setIsCompleted(false);
            setIsSuccessState(false);
            setIsNearEnd(false);
        }
    };

    const showTickIcon = isCompleted || isSuccessState || isNearEnd;

    return (
        <div
            ref={trackRef}
            className={`relative w-full ${heightClass} rounded-full ${colors.track} ${colors.text || "text-white"} flex items-center p-1 overflow-hidden select-none shadow-xs ${className}`}
            style={{ touchAction: 'pan-y' }}
        >
            {/* Continuous sliding light sheen animation only for non-enable/disable buttons */}
            {!isEnableDisable && (
                <motion.div
                    className={`absolute inset-0 bg-gradient-to-r from-transparent ${colors.sheen || "via-white/25"} to-transparent pointer-events-none`}
                    animate={{ x: ['-100%', '150%'] }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                />
            )}

            {/* Draggable Porter White Round Knob with idle shake effect */}
            <motion.div
                ref={knobRef}
                drag={!isLoading && !isCompleted && !isSuccessState ? 'x' : false}
                dragDirectionLock
                dragConstraints={{ left: 0, right: maxDrag }}
                dragElastic={0}
                dragMomentum={false}
                dragSnapToOrigin={!isCompleted && !isSuccessState}
                onDragStart={handleDragStart}
                onDrag={handleDrag}
                onDragEnd={handleDragEnd}
                animate={
                    isLoading || isCompleted || isSuccessState
                        ? { x: maxDrag }
                        : isDragging || isEnableDisable
                        ? { x: 0 }
                        : {
                            x: [0, 9, -2, 7, 0, 0, 0, 0]
                        }
                }
                transition={
                    isLoading || isCompleted || isSuccessState
                        ? { type: 'spring', damping: 25, stiffness: 220 }
                        : isDragging || isEnableDisable
                        ? undefined
                        : {
                            repeat: Infinity,
                            repeatDelay: 1.8,
                            duration: 1.1,
                            ease: 'easeInOut'
                        }
                }
                className={`${knobSizeClass} aspect-square rounded-full ${colors.knobBg || "bg-white"} ${colors.knob} flex items-center justify-center shrink-0 z-20 cursor-grab active:cursor-grabbing select-none shadow-md transform-gpu`}
                style={{ touchAction: 'none' }}
                onClick={(e) => e.stopPropagation()}
            >
                <AnimatePresence mode="wait" initial={false}>
                    {showTickIcon ? (
                        <motion.div
                            key="tick"
                            initial={{ scale: 0.4, opacity: 0, rotate: -25 }}
                            animate={{ scale: 1, opacity: 1, rotate: 0 }}
                            exit={{ scale: 0.4, opacity: 0 }}
                            transition={{ duration: 0.15, ease: 'easeOut' }}
                            className="flex items-center justify-center w-full h-full"
                        >
                            <Check size={iconSize} className={`stroke-[3.8] ${colors.knob}`} />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="arrow"
                            initial={{ scale: 0.7, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.5, opacity: 0 }}
                            transition={{ duration: 0.15, ease: 'easeOut' }}
                            className="flex items-center justify-center w-full h-full"
                        >
                            <ChevronRight size={iconSize} className={`stroke-[3.8] ${colors.knob}`} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Centered Track Label - Exactly in the center of button for all */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 px-4">
                <span className={`font-black ${textSizeClass} tracking-wider uppercase ${colors.text || "text-white"} text-center select-none truncate`}>
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
