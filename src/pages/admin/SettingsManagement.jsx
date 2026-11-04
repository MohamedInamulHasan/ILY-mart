import { useState, useEffect } from 'react';
import { Save, Eye, CheckCircle, AlertCircle, Wrench, Clock, Zap, Calendar, Check } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';
import { formatDeliveryRange } from '../../utils/storeHelpers';
import MaintenanceScreen from '../../components/MaintenanceScreen';

const SettingsManagement = () => {
    const {
        settings,
        updateDeliverySettings,
        updateDeliveryTimingType,
        updateMaintenanceMode,
        updateMaintenanceMessage
    } = useData();
    const { t } = useLanguage();

    const [loadingMode, setLoadingMode] = useState(false);
    const [savingMaintenance, setSavingMaintenance] = useState(false);
    const [savingTiming, setSavingTiming] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Generate 30-minute slots for a 24-hour day
    const generateAllSlots = () => {
        const slots = [];
        for (let i = 0; i < 24; i++) {
            for (let j = 0; j < 60; j += 30) {
                const hour = i.toString().padStart(2, '0');
                const minute = j.toString().padStart(2, '0');
                const timeString = `${hour}:${minute}`;
                const displayTime = formatDeliveryRange(timeString);
                slots.push({ id: timeString, label: displayTime, hour: i });
            }
        }
        return slots;
    };

    const allSlots = generateAllSlots();

    // State initialized from context
    const [allowedSlots, setAllowedSlots] = useState([]);
    const [deliveryTimingMode, setDeliveryTimingMode] = useState('instant');
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [maintenanceMessage, setMaintenanceMessage] = useState('');
    const [hasInitialized, setHasInitialized] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);

    useEffect(() => {
        if (settings && Object.keys(settings).length > 0) {
            if (!hasInitialized) {
                if (settings.deliveryTimes && Array.isArray(settings.deliveryTimes)) {
                    setAllowedSlots(settings.deliveryTimes);
                }
                if (settings.deliveryTimingType) {
                    setDeliveryTimingMode(settings.deliveryTimingType);
                }
                if (settings.maintenanceMode !== undefined) {
                    setMaintenanceMode(settings.maintenanceMode);
                }
                if (settings.maintenanceMessage !== undefined) {
                    setMaintenanceMessage(settings.maintenanceMessage);
                }
                setHasInitialized(true);
            } else if (!isDirty) {
                // Keep synced with background updates only if user hasn't edited the field
                if (settings.maintenanceMode !== undefined) {
                    setMaintenanceMode(settings.maintenanceMode);
                }
                if (settings.maintenanceMessage !== undefined) {
                    setMaintenanceMessage(settings.maintenanceMessage);
                }
            }
        }
    }, [settings, hasInitialized, isDirty]);

    // Toggle Maintenance On/Off
    const toggleMaintenanceMode = async () => {
        setLoadingMode(true);
        try {
            const newState = !maintenanceMode;
            await Promise.all([
                updateMaintenanceMode(newState),
                updateMaintenanceMessage(maintenanceMessage)
            ]);
            setMaintenanceMode(newState);
            setIsDirty(false);
            setMessage({
                type: 'success',
                text: newState
                    ? t('Maintenance mode is now active (Store Closed).')
                    : t('Store is now open and taking orders!')
            });
        } catch (error) {
            console.error('Error toggling maintenance mode:', error);
            const errText = error?.response?.data?.message || error?.message || t('Failed to update maintenance status.');
            setMessage({ type: 'error', text: errText });
        } finally {
            setLoadingMode(false);
            setTimeout(() => setMessage({ type: '', text: '' }), 4000);
        }
    };

    // Save Maintenance Message & Mode
    const handleSaveMaintenance = async () => {
        setSavingMaintenance(true);
        try {
            await Promise.all([
                updateMaintenanceMode(maintenanceMode),
                updateMaintenanceMessage(maintenanceMessage)
            ]);
            setIsDirty(false);
            setMessage({ type: 'success', text: t('Maintenance settings saved successfully!') });
        } catch (error) {
            console.error('Error saving maintenance message:', error);
            const errText = error?.response?.data?.message || error?.message || t('Failed to save maintenance settings.');
            setMessage({ type: 'error', text: errText });
        } finally {
            setSavingMaintenance(false);
            setTimeout(() => setMessage({ type: '', text: '' }), 4000);
        }
    };

    // Delivery Slot Handlers
    const toggleSlot = (slotId) => {
        setAllowedSlots(prev => {
            if (prev.includes(slotId)) {
                return prev.filter(id => id !== slotId);
            } else {
                return [...prev, slotId].sort();
            }
        });
    };

    const selectWorkingHours = () => {
        const workingSlots = allSlots
            .filter(s => s.hour >= 9 && s.hour < 21)
            .map(s => s.id);
        setAllowedSlots(workingSlots);
    };

    const selectAll = () => setAllowedSlots(allSlots.map(s => s.id));
    const deselectAll = () => setAllowedSlots([]);

    // Save Time Management Settings
    const handleSaveTiming = async () => {
        setSavingTiming(true);
        try {
            await Promise.all([
                updateDeliveryTimingType(deliveryTimingMode),
                updateDeliverySettings(allowedSlots)
            ]);
            setMessage({ type: 'success', text: t('Delivery timing settings saved successfully!') });
        } catch (error) {
            console.error('Error saving delivery timing:', error);
            const errText = error?.response?.data?.message || error?.message || t('Failed to save delivery timing settings.');
            setMessage({ type: 'error', text: errText });
        } finally {
            setSavingTiming(false);
            setTimeout(() => setMessage({ type: '', text: '' }), 4000);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-12">
            {/* Header */}
            <div>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">{t('Settings')}</h2>
                <p className="text-xs sm:text-sm text-gray-400 mt-0.5">{t('Manage store maintenance status and customer delivery timings')}</p>
            </div>

            {/* Notification Toast */}
            {message.text && (
                <div className={`p-4 rounded-2xl flex items-center gap-2.5 text-sm font-bold ${
                    message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                    {message.type === 'success' ? <CheckCircle size={18} className="shrink-0" /> : <AlertCircle size={18} className="shrink-0" />}
                    <span>{message.text}</span>
                </div>
            )}

            {/* CARD 1: Maintenance Status (Simple Card) */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 sm:p-6 border border-gray-100 dark:border-gray-700 space-y-5 shadow-sm">
                <div className="flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-2xl ${maintenanceMode ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'}`}>
                            <Wrench size={22} />
                        </div>
                        <div>
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{t('Maintenance')}</span>
                            <div className="flex items-center gap-2 mt-0.5">
                                <h3 className="font-bold text-gray-900 dark:text-white text-base sm:text-lg">
                                    {maintenanceMode ? t('Maintenance Active (Closed)') : t('Store Online (Open)')}
                                </h3>
                                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${maintenanceMode ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Preview Button */}
                        <button
                            type="button"
                            onClick={() => setShowPreviewModal(true)}
                            className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-colors flex items-center gap-1.5"
                            title={t('Preview customer view')}
                        >
                            <Eye size={16} />
                            <span>{t('Preview')}</span>
                        </button>

                        {/* Toggle Mode Button */}
                        <button
                            type="button"
                            onClick={toggleMaintenanceMode}
                            disabled={loadingMode}
                            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-2 shadow-sm ${
                                maintenanceMode
                                    ? 'bg-amber-500 text-white hover:bg-amber-600'
                                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                            }`}
                        >
                            {loadingMode && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                            <span>{maintenanceMode ? t('Turn Online') : t('Turn Maintenance On')}</span>
                        </button>
                    </div>
                </div>

                {/* Input Field and Save Button */}
                <div className="space-y-2">
                    <label className="block text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300">
                        {t('Maintenance Message')}
                    </label>
                    <div className="flex items-center gap-2.5">
                        <input
                            type="text"
                            value={maintenanceMessage}
                            onChange={(e) => {
                                setIsDirty(true);
                                setMaintenanceMessage(e.target.value);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleSaveMaintenance();
                                }
                            }}
                            placeholder={t('e.g., We are closed for updates. Reopening at 5 PM.')}
                            className="flex-1 min-w-0 px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2E5A2E]"
                        />
                        <button
                            type="button"
                            onClick={handleSaveMaintenance}
                            disabled={savingMaintenance}
                            className="px-5 py-3 bg-[#2E5A2E] text-white text-sm font-bold rounded-xl hover:bg-[#1a3d1a] transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 shrink-0 shadow-sm active:scale-95"
                        >
                            {savingMaintenance ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
                            <span>{t('Save')}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* CARD 2: Time Management - Order Delivery Mode */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 sm:p-6 border border-gray-100 dark:border-gray-700 space-y-4 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-emerald-100 text-[#2E5A2E] dark:bg-emerald-950/40 dark:text-emerald-300">
                        <Clock size={22} />
                    </div>
                    <div>
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{t('Time Management')}</span>
                        <h3 className="font-bold text-gray-900 dark:text-white text-base sm:text-lg">{t('Customer Delivery Timing')}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{t('Choose how customers order on checkout')}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                    {/* Instant Mode */}
                    <button
                        type="button"
                        onClick={() => setDeliveryTimingMode('instant')}
                        className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
                            deliveryTimingMode === 'instant'
                                ? 'border-[#2E5A2E] bg-emerald-50/50 text-[#2E5A2E] dark:bg-emerald-950/20 dark:text-[#7CA90E]'
                                : 'border-gray-100 dark:border-gray-700 bg-gray-50/30 text-gray-600 dark:text-gray-300 hover:border-gray-200'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <Zap size={22} className={deliveryTimingMode === 'instant' ? 'text-[#2E5A2E] dark:text-[#7CA90E]' : 'text-gray-400'} />
                            <div>
                                <h4 className="font-bold text-sm sm:text-base">{t('Instant Delivery Only')}</h4>
                                <p className="text-xs text-gray-400">{t('Hides timing picker from checkout')}</p>
                            </div>
                        </div>
                        {deliveryTimingMode === 'instant' && <Check size={18} className="shrink-0 text-[#2E5A2E] dark:text-[#7CA90E]" />}
                    </button>

                    {/* Scheduled Mode */}
                    <button
                        type="button"
                        onClick={() => setDeliveryTimingMode('scheduled')}
                        className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
                            deliveryTimingMode !== 'instant'
                                ? 'border-[#2E5A2E] bg-emerald-50/50 text-[#2E5A2E] dark:bg-emerald-950/20 dark:text-[#7CA90E]'
                                : 'border-gray-100 dark:border-gray-700 bg-gray-50/30 text-gray-600 dark:text-gray-300 hover:border-gray-200'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <Calendar size={22} className={deliveryTimingMode !== 'instant' ? 'text-[#2E5A2E] dark:text-[#7CA90E]' : 'text-gray-400'} />
                            <div>
                                <h4 className="font-bold text-sm sm:text-base">{t('Scheduled Timing Enabled')}</h4>
                                <p className="text-xs text-gray-400">{t('Allows customer to pick delivery slot')}</p>
                            </div>
                        </div>
                        {deliveryTimingMode !== 'instant' && <Check size={18} className="shrink-0 text-[#2E5A2E] dark:text-[#7CA90E]" />}
                    </button>
                </div>
            </div>

            {/* CARD 3: Available Delivery Slots (Compact Grid) */}
            {deliveryTimingMode !== 'instant' && (
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 sm:p-6 border border-gray-100 dark:border-gray-700 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{t('Delivery Time Slots')}</span>
                            <h3 className="font-bold text-gray-900 dark:text-white text-base sm:text-lg">{t('Available Delivery Slots')}</h3>
                            <p className="text-xs text-gray-400 mt-0.5">{t('Select slots to enable for customer delivery')}</p>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={selectWorkingHours}
                                className="px-3 py-1.5 text-xs font-bold text-[#2E5A2E] bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-xl transition-colors"
                            >
                                {t('9am - 9pm')}
                            </button>
                            <button
                                type="button"
                                onClick={selectAll}
                                className="px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-200 bg-gray-100 dark:bg-gray-700 dark:text-gray-200 rounded-xl transition-colors"
                            >
                                {t('All')}
                            </button>
                            <button
                                type="button"
                                onClick={deselectAll}
                                className="px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-100 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300 rounded-xl transition-colors"
                            >
                                {t('Clear')}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 pt-1">
                        {allSlots.map(slot => {
                            const isSelected = allowedSlots.includes(slot.id);
                            return (
                                <button
                                    key={slot.id}
                                    type="button"
                                    onClick={() => toggleSlot(slot.id)}
                                    className={`py-2 px-3 rounded-xl border text-xs sm:text-sm font-semibold transition-all text-center flex items-center justify-between ${
                                        isSelected
                                            ? 'bg-[#2E5A2E] border-[#2E5A2E] text-white shadow-sm'
                                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300'
                                    }`}
                                >
                                    <span>{slot.label}</span>
                                    {isSelected && <Check size={14} className="text-[#CBF9B2] shrink-0" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Time Management Save Button */}
            <div className="pt-1">
                <button
                    type="button"
                    onClick={handleSaveTiming}
                    disabled={savingTiming}
                    className="w-full py-3.5 px-6 bg-[#2E5A2E] text-white text-sm font-bold rounded-2xl hover:bg-[#1a3d1a] transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50 whitespace-nowrap active:scale-[0.99]"
                >
                    {savingTiming ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <Save size={18} />
                    )}
                    <span>{t('Save Timing Settings')}</span>
                </button>
            </div>

            {/* Maintenance Screen Preview Modal */}
            {showPreviewModal && (
                <MaintenanceScreen
                    isPreview={true}
                    previewMessage={maintenanceMessage}
                    onClose={() => setShowPreviewModal(false)}
                />
            )}
        </div>
    );
};

export default SettingsManagement;
