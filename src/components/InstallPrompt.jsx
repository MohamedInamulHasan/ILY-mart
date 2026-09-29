import React, { useState, useEffect } from 'react';
import { Download, X, Sparkles, Share, PlusSquare, Smartphone, Check, ChevronRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const InstallPrompt = () => {
    const { t } = useLanguage();
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [showGuideModal, setShowGuideModal] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Detect iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(isIosDevice);

        // Check if app is already running in standalone / PWA mode
        const isStandalone = 
            window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone === true ||
            window.Capacitor?.isNativePlatform?.() === true;

        if (isStandalone) {
            setIsInstalled(true);
            return;
        }

        // Listen for browser's beforeinstallprompt event (Chrome, Edge, Android)
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Check if app was installed successfully
        const handleAppInstalled = () => {
            setIsInstalled(true);
            setShowPrompt(false);
            setShowGuideModal(false);
            console.log('ILY mart PWA was installed');
        };

        window.addEventListener('appinstalled', handleAppInstalled);

        // Automatically show the green install prompt when website opens (if not dismissed)
        const timer = setTimeout(() => {
            const isDismissed = sessionStorage.getItem('installPromptDismissed') === 'true';
            if (!isStandalone && !isDismissed) {
                setShowPrompt(true);
            }
        }, 1500); // 1.5 seconds delay after website load

        return () => {
            clearTimeout(timer);
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            // Native browser prompt available (Android / Chrome / Edge)
            try {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    console.log('User accepted PWA installation');
                    setIsInstalled(true);
                    setShowPrompt(false);
                } else {
                    console.log('User dismissed PWA installation');
                }
                setDeferredPrompt(null);
            } catch (err) {
                console.error('Install prompt error:', err);
                setShowGuideModal(true);
            }
        } else {
            // Browser doesn't support automatic prompt (e.g. iOS Safari) -> Show step-by-step guide
            setShowGuideModal(true);
        }
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        sessionStorage.setItem('installPromptDismissed', 'true');
    };

    if (isInstalled) {
        return null;
    }

    return (
        <>
            {/* Floating Green PWA Install Banner / Popup */}
            {showPrompt && !showGuideModal && (
                <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-[100] animate-slide-up">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-[0_10px_35px_rgba(46,90,46,0.25)] border-2 border-emerald-500/30 dark:border-emerald-700/50 p-4 md:p-5 relative overflow-hidden backdrop-blur-md">
                        {/* Decorative Top Green Accent Line */}
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#2E5A2E] via-[#5A7C0A] to-[#8bc910]" />

                        {/* Close button */}
                        <button
                            onClick={handleDismiss}
                            className="absolute top-3 right-3 p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            aria-label="Close"
                        >
                            <X size={18} />
                        </button>

                        <div className="flex items-start gap-3.5 pt-1">
                            {/* App Green Icon */}
                            <div className="flex-shrink-0 w-13 h-13 bg-gradient-to-br from-[#2E5A2E] to-[#5A7C0A] rounded-2xl p-2.5 flex items-center justify-center shadow-md ring-2 ring-emerald-500/20">
                                <img src="/icon.svg" alt="ILY mart Logo" className="w-full h-full object-contain filter drop-shadow" />
                            </div>

                            <div className="flex-1 min-w-0 pr-4">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-emerald-100 dark:bg-emerald-950 text-[#2E5A2E] dark:text-[#CBF9B2] border border-emerald-300/40">
                                        <Sparkles size={11} className="text-[#5A7C0A] dark:text-[#8bc910]" />
                                        {t('Official App')}
                                    </span>
                                </div>
                                
                                <h3 className="text-base font-bold text-gray-900 dark:text-white leading-snug">
                                    {t('Install ILY mart App')}
                                </h3>
                                
                                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                                    {t('Get faster ordering, instant updates & easy access from your home screen!')}
                                </p>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-2 mt-3.5">
                                    <button
                                        onClick={handleInstallClick}
                                        className="flex-1 bg-gradient-to-r from-[#2E5A2E] to-[#5A7C0A] hover:from-[#244724] hover:to-[#496508] active:scale-95 text-white text-xs md:text-sm font-bold py-2.5 px-4 rounded-xl transition-all duration-200 shadow-md flex items-center justify-center gap-2"
                                    >
                                        <Download size={16} />
                                        <span>{t('Install App')}</span>
                                    </button>
                                    
                                    <button
                                        onClick={handleDismiss}
                                        className="px-3 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                                    >
                                        {t('Not Now')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Step-by-Step Install Guide Modal (When direct prompt isn't supported) */}
            {showGuideModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-emerald-500/30 relative">
                        <button
                            onClick={() => setShowGuideModal(false)}
                            className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="text-center mb-5">
                            <div className="w-16 h-16 bg-gradient-to-br from-[#2E5A2E] to-[#5A7C0A] rounded-2xl mx-auto p-3 flex items-center justify-center shadow-lg ring-4 ring-emerald-500/20 mb-3">
                                <img src="/icon.svg" alt="ILY mart Logo" className="w-full h-full object-contain" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                {t('How to Install ILY mart')}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {t('Follow these simple steps to add the app to your home screen')}
                            </p>
                        </div>

                        {isIOS ? (
                            /* iOS Instructions */
                            <div className="space-y-3 bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/40">
                                <div className="flex items-center gap-3 text-xs text-gray-800 dark:text-emerald-100">
                                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs flex-shrink-0">1</div>
                                    <span>{t('Tap the')} <strong>{t('Share button')}</strong> <Share size={15} className="inline mx-1 text-emerald-600 dark:text-emerald-400" /> {t('in Safari bottom bar')}</span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-gray-800 dark:text-emerald-100">
                                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs flex-shrink-0">2</div>
                                    <span>{t('Scroll down & tap')} <strong>{t('Add to Home Screen')}</strong> <PlusSquare size={15} className="inline mx-1 text-emerald-600 dark:text-emerald-400" /></span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-gray-800 dark:text-emerald-100">
                                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs flex-shrink-0">3</div>
                                    <span>{t('Tap')} <strong>{t('Add')}</strong> {t('at the top right corner')}</span>
                                </div>
                            </div>
                        ) : (
                            /* Android / Desktop Instructions */
                            <div className="space-y-3 bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/40">
                                <div className="flex items-center gap-3 text-xs text-gray-800 dark:text-emerald-100">
                                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs flex-shrink-0">1</div>
                                    <span>{t('Tap browser menu')} <strong>(⋮ or ⋯)</strong> {t('at top right')}</span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-gray-800 dark:text-emerald-100">
                                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs flex-shrink-0">2</div>
                                    <span>{t('Select')} <strong>{t('Install App')}</strong> {t('or')} <strong>{t('Add to Home Screen')}</strong></span>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={() => {
                                setShowGuideModal(false);
                                handleDismiss();
                            }}
                            className="w-full mt-5 bg-gradient-to-r from-[#2E5A2E] to-[#5A7C0A] hover:from-[#244724] hover:to-[#496508] text-white font-bold py-3 px-4 rounded-xl transition-all text-sm shadow-md"
                        >
                            {t('Got It!')}
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default InstallPrompt;
