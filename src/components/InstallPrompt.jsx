import React, { useState, useEffect } from 'react';
import { Download, X, Sparkles, Share, PlusSquare } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const InstallPrompt = () => {
    const { t } = useLanguage();
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showPrompt, setShowPrompt] = useState(true);
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

        // ALWAYS show prompt every time website is opened in browser if not installed
        const timer = setTimeout(() => {
            if (!isStandalone) {
                setShowPrompt(true);
            }
        }, 800);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
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
    };

    if (isInstalled || isMobile) {
        return null;
    }

    return (
        <>
            {/* Compact Non-Intrusive Bottom Banner */}
            {showPrompt && !showGuideModal && (
                <div className="hidden md:block fixed bottom-5 right-5 sm:max-w-sm z-[90] animate-slide-up">
                    <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-2xl shadow-[0_8px_30px_rgba(46,90,46,0.18)] border border-emerald-500/30 p-3 sm:p-3.5 relative overflow-hidden flex items-center gap-3">
                        {/* Clean App Icon Container */}
                        <div className="w-11 h-11 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 rounded-2xl p-1.5 flex items-center justify-center flex-shrink-0 shadow-sm">
                            <img src="/logo-new.png" alt="ILY mart Logo" className="w-full h-full object-contain" />
                        </div>

                        {/* Text details */}
                        <div className="flex-1 min-w-0 pr-1">
                            <div className="flex items-center gap-1">
                                <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">
                                    {t('Install ILY mart App')}
                                </h4>
                                <Sparkles size={12} className="text-[#5A7C0A] dark:text-[#8bc910] flex-shrink-0" />
                            </div>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                {t('Faster ordering & app access')}
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                                onClick={handleInstallClick}
                                className="bg-[#2E5A2E] hover:bg-[#234523] active:scale-95 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-md transition-all flex items-center gap-1.5"
                            >
                                <Download size={13} />
                                <span>{t('Install')}</span>
                            </button>

                            <button
                                onClick={handleDismiss}
                                className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
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
                <div className="hidden md:flex fixed inset-0 z-[110] items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-xs w-full p-5 shadow-2xl border border-emerald-500/30 relative text-center">
                        <button
                            onClick={() => setShowGuideModal(false)}
                            className="absolute top-3 right-3 p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <X size={18} />
                        </button>

                        <div className="w-14 h-14 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 rounded-2xl mx-auto p-2 flex items-center justify-center shadow-md mb-2.5">
                            <img src="/logo-new.png" alt="ILY mart Logo" className="w-full h-full object-contain" />
                        </div>
                        
                        <h3 className="text-base font-bold text-gray-900 dark:text-white">
                            {t('Install ILY mart App')}
                        </h3>

                        {isIOS ? (
                            <div className="space-y-2.5 bg-emerald-50/70 dark:bg-emerald-950/40 p-3.5 rounded-2xl border border-emerald-200/60 dark:border-emerald-800/40 text-left mt-3">
                                <div className="flex items-center gap-2.5 text-xs text-gray-800 dark:text-emerald-100">
                                    <div className="w-5 h-5 rounded-full bg-[#2E5A2E] text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0">1</div>
                                    <span>{t('Tap Share')} <Share size={13} className="inline text-[#2E5A2E] dark:text-emerald-400 mx-0.5" /> {t('in Safari')}</span>
                                </div>
                                <div className="flex items-center gap-2.5 text-xs text-gray-800 dark:text-emerald-100">
                                    <div className="w-5 h-5 rounded-full bg-[#2E5A2E] text-white font-bold flex items-center justify-center text-xs flex-shrink-0">2</div>
                                    <span>{t('Tap Add to Home Screen')} <PlusSquare size={13} className="inline text-[#2E5A2E] dark:text-emerald-400 mx-0.5" /></span>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2.5 bg-emerald-50/70 dark:bg-emerald-950/40 p-3.5 rounded-2xl border border-emerald-200/60 dark:border-emerald-800/40 text-left mt-3">
                                <div className="flex items-center gap-2.5 text-xs text-gray-800 dark:text-emerald-100">
                                    <div className="w-5 h-5 rounded-full bg-[#2E5A2E] text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0">1</div>
                                    <span>{t('Tap browser menu')} <strong>(⋮)</strong></span>
                                </div>
                                <div className="flex items-center gap-2.5 text-xs text-gray-800 dark:text-emerald-100">
                                    <div className="w-5 h-5 rounded-full bg-[#2E5A2E] text-white font-bold flex items-center justify-center text-xs flex-shrink-0">2</div>
                                    <span>{t('Select')} <strong>{t('Install App')}</strong></span>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={() => {
                                setShowGuideModal(false);
                                handleDismiss();
                            }}
                            className="w-full mt-4 bg-[#2E5A2E] hover:bg-[#234523] text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-md transition-all active:scale-95"
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
