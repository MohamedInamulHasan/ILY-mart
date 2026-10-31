import React from 'react';
import { AlertTriangle, Clock, Hammer, X } from 'lucide-react';
import { useData } from '../context/DataContext';

const MaintenanceScreen = ({ isPreview = false, onClose, previewMessage }) => {
    const { settings } = useData();
    const customMessage = previewMessage !== undefined ? previewMessage : settings?.maintenanceMessage;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
            {/* Elegant Blurred Backdrop */}
            <div 
                className="absolute inset-0 bg-gray-900/60 backdrop-blur-md animate-fade-in"
                onClick={isPreview ? onClose : undefined} 
            />

            {/* Premium Dialog Box */}
            <div className="relative bg-white dark:bg-gray-900 w-full max-w-md rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/20 dark:border-gray-800 p-8 sm:p-10 transform animate-scale-up text-center overflow-hidden">
                {isPreview && (
                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                        <span className="px-3 py-1 bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 rounded-full text-xs font-bold uppercase tracking-wider">
                            Preview Mode
                        </span>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                            aria-label="Close Preview"
                        >
                            <X size={18} />
                        </button>
                    </div>
                )}
                
                {/* Decorative Background Elements */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-amber-50 dark:from-amber-900/10 to-transparent pointer-events-none" />
                
                {/* Icon Section */}
                <div className="relative mb-8">
                    <div className="w-24 h-24 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto ring-8 ring-amber-50 dark:ring-amber-900/10">
                        <Hammer className="text-amber-600 dark:text-amber-400 animate-pulse" size={48} />
                    </div>
                    <div className="absolute -bottom-2 right-1/2 translate-x-12 bg-white dark:bg-gray-800 p-2 rounded-full shadow-lg border border-amber-100 dark:border-amber-900/30">
                        <Clock className="text-amber-600 dark:text-amber-400" size={20} />
                    </div>
                </div>

                {/* Content */}
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight leading-tight whitespace-pre-wrap">
                    {customMessage || "Closed for Updates"}
                </h1>

                {!customMessage && (
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 mb-8 border border-gray-100 dark:border-gray-700/50">
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                            We are currently performing system maintenance or are not accepting orders at this time. Please check back later!
                        </p>
                    </div>
                )}

                {customMessage && (
                    <div className="mb-8">
                        <p className="text-gray-500 dark:text-gray-400 font-medium">
                            Please check back with us later.
                        </p>
                    </div>
                )}

                {/* Status Bar */}
                <div className="space-y-4">
                    <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 w-full animate-progress-bar rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                        <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-ping"></span>
                        <p className="text-xs text-amber-600 dark:text-amber-400 uppercase tracking-[0.2em] font-bold">
                            Live Maintenance
                        </p>
                    </div>
                </div>

                <p className="mt-10 text-sm text-gray-400 dark:text-gray-500 font-medium italic">
                    &copy; {new Date().getFullYear()} ILY mart. App is currently in safe mode.
                </p>
            </div>

            <style jsx>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scale-up {
                    from { opacity: 0; transform: scale(0.9) translateY(20px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                @keyframes progress-bar {
                    0% { width: 0%; opacity: 0.5; }
                    50% { width: 70%; opacity: 1; }
                    100% { width: 100%; opacity: 0.5; }
                }
                .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
                .animate-scale-up { animation: scale-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .animate-progress-bar { animation: progress-bar 3s infinite ease-in-out; }
            `}</style>
        </div>
    );
};

export default MaintenanceScreen;
