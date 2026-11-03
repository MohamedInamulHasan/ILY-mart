import re

# 1. Update SwipeActionButton.jsx
swipe_path = 'src/components/SwipeActionButton.jsx'
with open(swipe_path, 'r', encoding='utf-8') as f:
    swipe_content = f.read()

# Add isEnableDisable check and restore shine + shake for regular buttons
new_body = """    const colors = getColors();
    const isEnableDisable = variant === 'outline-white' || variant === 'black-shine';

    // Calculate maximum drag width accurately via ResizeObserver & clientWidth"""

swipe_content = swipe_content.replace(
    "    const colors = getColors();\n\n    // Calculate maximum drag width accurately via ResizeObserver & clientWidth",
    new_body
)

# Restore shine effect conditionally (only if !isEnableDisable)
old_return_top = """        <div
            ref={trackRef}
            className={`relative w-full ${heightClass} rounded-full ${colors.track} ${colors.text || "text-white"} flex items-center p-1 overflow-hidden select-none shadow-xs ${className}`}
            style={{ touchAction: 'pan-y' }}
        >
            

            {/* Draggable Porter White Round Knob with idle nudge/shake like in Porter Partner */}"""

new_return_top = """        <div
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

            {/* Draggable Porter White Round Knob with idle nudge/shake like in Porter Partner */}"""

if old_return_top in swipe_content:
    swipe_content = swipe_content.replace(old_return_top, new_return_top)
    print("SUCCESS: Restored shine for regular buttons in SwipeActionButton.jsx")
else:
    print("Could not match old_return_top in SwipeActionButton.jsx")

# Restore shake effect conditionally on knob (only if !isEnableDisable)
old_knob_animate = """                animate={
                    isLoading || isCompleted
                        ? { x: maxDrag }
                        : { x: 0 }
                }
                transition={
                    isLoading || isCompleted
                        ? { type: 'spring', damping: 25, stiffness: 200 }
                        : { type: 'spring', damping: 30, stiffness: 350 }
                }"""

new_knob_animate = """                animate={
                    isLoading || isCompleted
                        ? { x: maxDrag }
                        : isDragging || isEnableDisable
                        ? { x: 0 }
                        : {
                            x: [0, 9, -2, 7, 0, 0, 0, 0]
                        }
                }
                transition={
                    isLoading || isCompleted
                        ? { type: 'spring', damping: 25, stiffness: 200 }
                        : isDragging || isEnableDisable
                        ? undefined
                        : {
                            repeat: Infinity,
                            repeatDelay: 1.8,
                            duration: 1.1,
                            ease: 'easeInOut'
                        }
                }"""

if old_knob_animate in swipe_content:
    swipe_content = swipe_content.replace(old_knob_animate, new_knob_animate)
    print("SUCCESS: Restored shake for regular buttons in SwipeActionButton.jsx")
else:
    print("Could not match old_knob_animate in SwipeActionButton.jsx")

with open(swipe_path, 'w', encoding='utf-8') as f:
    f.write(swipe_content)


# 2. Update IncomingOrderModal.jsx:
# Add cancel button below accept with enable outline UI (variant="outline-white")
modal_path = 'src/components/IncomingOrderModal.jsx'
with open(modal_path, 'r', encoding='utf-8') as f:
    modal_content = f.read()

old_is_processing_btn = """                    ) : isProcessing ? (
                        <SwipeActionButton
                            variant="yellow"
                            label={t('ACCEPT')}
                            loadingLabel={t('Accepting...')}
                            isLoading={isActionLoading}
                            heightClass="h-[68px] sm:h-[72px]"
                            knobSizeClass="w-[56px] h-[56px] sm:w-[60px] sm:h-[60px]"
                            onSuccess={handleMainSwipeAction}
                        />
                    ) : isDelivered ? ("""

new_is_processing_btn = """                    ) : isProcessing ? (
                        <div className="space-y-2.5 w-full">
                            <SwipeActionButton
                                variant="yellow"
                                label={t('ACCEPT')}
                                loadingLabel={t('Accepting...')}
                                isLoading={isActionLoading}
                                heightClass="h-[60px] sm:h-[64px]"
                                knobSizeClass="w-[48px] h-[48px] sm:w-[52px] sm:h-[52px]"
                                onSuccess={handleMainSwipeAction}
                            />
                            {/* Cancel Button below Accept styled like Enable Outline UI */}
                            <SwipeActionButton
                                variant="outline-white"
                                label={t('SWIPE TO CANCEL')}
                                loadingLabel={t('Cancelling...')}
                                isLoading={isCancelling}
                                heightClass="h-[52px] sm:h-[56px]"
                                knobSizeClass="w-[42px] h-[42px] sm:w-[46px] sm:h-[46px]"
                                textSizeClass="text-xs sm:text-sm font-black"
                                iconSize={20}
                                autoReset={true}
                                onSuccess={() => setShowCancelPopup(true)}
                            />
                        </div>
                    ) : isDelivered ? ("""

if old_is_processing_btn in modal_content:
    modal_content = modal_content.replace(old_is_processing_btn, new_is_processing_btn)
    print("SUCCESS: Added outline cancel button below ACCEPT in IncomingOrderModal.jsx")
else:
    print("Could not match old_is_processing_btn in IncomingOrderModal.jsx")

with open(modal_path, 'w', encoding='utf-8') as f:
    f.write(modal_content)

print("FAST EXECUTION COMPLETE!")

