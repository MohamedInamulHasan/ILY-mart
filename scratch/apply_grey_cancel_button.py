# 1. Update SwipeActionButton.jsx
swipe_path = 'src/components/SwipeActionButton.jsx'
with open(swipe_path, 'r', encoding='utf-8') as f:
    swipe = f.read()

target_variant = """            case 'yellow':
            case 'amber':"""

replacement_variant = """            case 'gray':
            case 'grey':
                return {
                    track: 'bg-gray-400 hover:bg-gray-500 border-gray-400',
                    text: 'text-white',
                    knob: 'text-gray-500',
                    knobBg: 'bg-white shadow-md',
                    sheen: 'via-white/25'
                };
            case 'yellow':
            case 'amber':"""

if target_variant in swipe and 'case \'gray\':' not in swipe:
    swipe = swipe.replace(target_variant, replacement_variant, 1)
    with open(swipe_path, 'w', encoding='utf-8') as f:
        f.write(swipe)
    print("SUCCESS: Added gray/grey variant to SwipeActionButton.jsx")
else:
    print("SwipeActionButton already has gray or target not found")


# 2. Update IncomingOrderModal.jsx
modal_path = 'src/components/IncomingOrderModal.jsx'
with open(modal_path, 'r', encoding='utf-8') as f:
    modal = f.read()

old_cancel_btn = """                            {/* Cancel Button below Accept styled like Enable Outline UI */}
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
                            />"""

new_cancel_btn = """                            {/* Cancel Button styled like Accept button in Grey */}
                            <SwipeActionButton
                                variant="gray"
                                label={t('SWIPE TO CANCEL')}
                                loadingLabel={t('Cancelling...')}
                                isLoading={isCancelling}
                                heightClass="h-[60px] sm:h-[64px]"
                                knobSizeClass="w-[48px] h-[48px] sm:w-[52px] sm:h-[52px]"
                                autoReset={true}
                                onSuccess={() => setShowCancelPopup(true)}
                            />"""

if old_cancel_btn in modal:
    modal = modal.replace(old_cancel_btn, new_cancel_btn)
    with open(modal_path, 'w', encoding='utf-8') as f:
        f.write(modal)
    print("SUCCESS: Updated Cancel button to match Accept button in Grey")
else:
    print("old_cancel_btn not matched in IncomingOrderModal.jsx")

print("ALL CHANGES COMPLETE!")

