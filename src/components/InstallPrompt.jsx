import React, { useState, useEffect } from 'react';
import { Download, X, Sparkles, Share, PlusSquare } from 'lucide-react';
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
        };

        window.addEventListener('appinstalled', handleAppInstalled);

        // Automatically show prompt 2s after load if not dismissed
        const timer = setTimeout(() => {
            const isDismissed = sessionStorage.getItem('installPromptDismissed') === 'true';
            if (!isStandalone && !isDismissed) {
                setShowPrompt(true);
            }
        }, 2000);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            try {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    setIsInstalled(true);
                    setShowPrompt(false);
                }
                setDeferredPrompt(null);
            } catch (err) {
                setShowGuideModal(true);
            }
        } else {
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
            {/* Compact Non-Intrusive Bottom Banner */}
            {showPrompt && !showGuideModal && (
                <div className="fixed bottom-20 md:bottom-5 left-3 right-3 sm:left-auto sm:right-5 sm:max-w-sm z-[90] animate-slide-up">
                    <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-2xl shadow-xl border border-emerald-500/40 p-3 sm:p-3.5 relative overflow-hidden flex items-center gap-3">
                        {/* Top Green Accent bar */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#2E5A2E] to-[#8bc910]" />

                        {/* App Icon */}
                        <div className="w-10 h-10 bg-gradient-to-br from-[#2E5A2E] to-[#5A7C0A] rounded-xl p-1.5 flex items-center justify-center flex-shrink-0 shadow-sm">
                            <img src="/icon.svg" alt="ILY mart Logo" className="w-full h-full object-contain" />
                        </div>

                        {/* Text details */}
                        <div className="flex-1 min-w-0 pr-1">
                            <div className="flex items-center gap-1">
                                <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">
                                    {t('Install ILY mart App')}
                                </h4>
                                <Sparkles size={11} className="text-[#5A7C0A] dark:text-[#8bc910] flex-shrink-0" />
                            </div>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                {t('Faster ordering & app access')}
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                                onClick={handleInstallClick}
                                className="bg-gradient-to-r from-[#2E5A2E] to-[#5A7C0A] hover:from-[#244724] hover:to-[#496508] active:scale-95 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition-all flex items-center gap-1"
                            >
                                <Download size={13} />
                                <span>{t('Install')}</span>
                            </button>

                            <button
                                onClick={handleDismiss}
                                className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                aria-label="Dismiss"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Step-by-Step Install Guide Modal (Only shows if direct install isn't supported like iOS Safari) */}
            {showGuideModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-xs w-full p-5 shadow-2xl border border-emerald-500/30 relative text-center">
                        <button
                            onClick={() => setShowGuideModal(false)}
                            className="absolute top-3 right-3 p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <X size={18} />
                        </button>

                        <div className="w-12 h-12 bg-gradient-to-br from-[#2E5A2E] to-[#5A7C0A] rounded-2xl mx-auto p-2.5 flex items-center justify-center shadow-md mb-2">
                            <img src="/icon.svg" alt="ILY mart Logo" className="w-full h-full object-contain" />
                        </div>
                        
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                            {t('Install ILY mart App')}
                        </h3>

                        {isIOS ? (
                            <div className="space-y-2 bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/40 text-left mt-3">
                                <div className="flex items-center gap-2 text-xs text-gray-800 dark:text-emerald-100">
                                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0">1</div>
                                    <span>{t('Tap Share')} <Share size={13} className="inline text-emerald-600 dark:text-emerald-400 mx-0.5" /> {t('in Safari')}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-800 dark:text-emerald-100">
                                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs flex-shrink-0">2</div>
                                    <span>{t('Tap Add to Home Screen')} <PlusSquare size={13} className="inline text-emerald-600 dark:text-emerald-400 mx-0.5" /></span>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2 bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/40 text-left mt-3">
                                <div className="flex items-center gap-2 text-xs text-gray-800 dark:text-emerald-100">
                                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0">1</div>
                                    <span>{t('Tap browser menu')} <strong>(⋮)</strong></span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-800 dark:text-emerald-100">
                                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs flex-shrink-0">2</div>
                                    <span>{t('Select')} <strong>{t('Install App')}</strong></span>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={() => {
                                setShowGuideModal(false);
                                handleDismiss();
                            }}
                            className="w-full mt-4 bg-gradient-to-r from-[#2E5A2E] to-[#5A7C0A] hover:from-[#244724] hover:to-[#496508] text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-md"
                        >
                            {t('Got It')}
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default InstallPrompt;
