import { useState, useEffect } from 'react';
import { Save, Clock, CheckCircle, AlertCircle, ShieldAlert, Sun, Sunrise, Moon, Sunset, Sparkles, RefreshCw, Eye, Check, HelpCircle, Power } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';
import { formatDeliveryRange } from '../../utils/storeHelpers';

const SettingsManagement = () => {
    const { settings, updateDeliverySettings, updateMaintenanceMode, updateDeliveryTimingType, updateMaintenanceMessage } = useData();
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Generate all 30-minute slots for a 24-hour day
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

    // Group slots by time of day for intuitive UI
    const morningSlots = allSlots.filter(s => s.hour >= 6 && s.hour < 12);
    const afternoonSlots = allSlots.filter(s => s.hour >= 12 && s.hour < 17);
    const eveningSlots = allSlots.filter(s => s.hour >= 17 && s.hour < 22);
    const nightSlots = allSlots.filter(s => s.hour >= 22 || s.hour < 6);

    // Initialize state from context
    const [allowedSlots, setAllowedSlots] = useState([]);
    const [deliveryTimingMode, setDeliveryTimingMode] = useState('permanent');
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [maintenanceMessage, setMaintenanceMessage] = useState('');
    const [hasInitialized, setHasInitialized] = useState(false);

    useEffect(() => {
        if (settings && !hasInitialized) {
            if (settings.deliveryTimes) {
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
        }
    }, [settings, hasInitialized]);

    useEffect(() => {
        if (settings && settings.maintenanceMode !== undefined) {
            setMaintenanceMode(settings.maintenanceMode);
        }
    }, [settings?.maintenanceMode]);

    const toggleMaintenanceMode = async () => {
        setLoading(true);
        try {
            const newState = !maintenanceMode;
            await updateMaintenanceMode(newState);
            setMaintenanceMode(newState);
            setMessage({ type: 'success', text: t(`Store status changed to: ${newState ? 'CLOSED (Maintenance Mode)' : 'OPEN & LIVE'}`) });
        } catch (error) {
            console.error('Error updating status:', error);
            setMessage({ type: 'error', text: t('Failed to update status.') });
        } finally {
            setLoading(false);
            setTimeout(() => setMessage({ type: '', text: '' }), 4000);
        }
    };

    const toggleSlot = (slotId) => {
        setAllowedSlots(prev => {
            if (prev.includes(slotId)) {
                return prev.filter(id => id !== slotId);
            } else {
                return [...prev, slotId].sort();
            }
        });
    };

    // Quick Presets
    const selectPreset = (slotsToSelect) => {
        const ids = slotsToSelect.map(s => s.id);
        setAllowedSlots(prev => Array.from(new Set([...prev, ...ids])).sort());
    };

    const deselectPreset = (slotsToDeselect) => {
        const ids = slotsToDeselect.map(s => s.id);
        setAllowedSlots(prev => prev.filter(id => !ids.includes(id)));
    };

    const selectWorkingHours = () => {
        const workingSlots = allSlots
            .filter(s => s.hour >= 9 && s.hour < 21)
            .map(s => s.id);
        setAllowedSlots(workingSlots);
    };

    const selectAll = () => {
        setAllowedSlots(allSlots.map(s => s.id));
    };

    const deselectAll = () => {
        setAllowedSlots([]);
    };

    const handleSave = async () => {
        setLoading(true);
        setMessage({ type: '', text: '' });
        try {
            await Promise.all([
                updateDeliverySettings(allowedSlots),
                updateDeliveryTimingType(deliveryTimingMode),
                updateMaintenanceMessage(maintenanceMessage)
            ]);
            setMessage({ type: 'success', text: t('Settings saved successfully!') });
        } catch (error) {
            console.error('Error saving settings:', error);
            setMessage({ type: 'error', text: t('Failed to save settings. Please try again.') });
        } finally {
            setLoading(false);
            setTimeout(() => setMessage({ type: '', text: '' }), 4000);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12">
            {/* Header Title */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="p-3.5 bg-[#2E5A2E]/10 dark:bg-[#7CA90E]/20 rounded-2xl text-[#2E5A2E] dark:text-[#7CA90E]">
                        <Clock size={28} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{t('Store Settings & Delivery Timings')}</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('Manage store status, maintenance messages, and customer delivery time slots')}</p>
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="px-6 py-3 bg-[#2E5A2E] hover:bg-[#1a3d1a] text-white rounded-2xl font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 disabled:opacity-50"
                >
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <Save size={18} />
                    )}
                    <span>{t('Save All Changes')}</span>
                </button>
            </div>

            {/* Global Toast Message */}
            {message.text && (
                <div className={`p-4 rounded-2xl flex items-center gap-3 animate-fade-in shadow-sm ${
                    message.type === 'success' 
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800' 
                        : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                }`}>
                    {message.type === 'success' ? <CheckCircle size={22} className="flex-shrink-0" /> : <AlertCircle size={22} className="flex-shrink-0" />}
                    <span className="font-semibold text-sm">{message.text}</span>
                </div>
            )}

            {/* Quick Status KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Store Status Card */}
                <div className={`p-5 rounded-3xl border transition-all flex items-center gap-4 ${
                    maintenanceMode 
                        ? 'bg-amber-50/70 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800' 
                        : 'bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800'
                }`}>
                    <div className={`p-3 rounded-2xl ${maintenanceMode ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'}`}>
                        {maintenanceMode ? <ShieldAlert size={24} /> : <Power size={24} />}
                    </div>
                    <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-400">{t('Store Status')}</span>
                        <h4 className={`text-lg font-bold ${maintenanceMode ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                            {maintenanceMode ? t('Maintenance Mode') : t('Live & Online')}
                        </h4>
                    </div>
                </div>

                {/* Active Slots Counter Card */}
                <div className="p-5 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl">
                        <Clock size={24} />
                    </div>
                    <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-400">{t('Active Time Slots')}</span>
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                            {allowedSlots.length} {t('Slots Enabled')}
                        </h4>
                    </div>
                </div>

                {/* Refresh Mode Card */}
                <div className="p-5 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-2xl">
                        <RefreshCw size={24} />
                    </div>
                    <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-400">{t('Slot Refresh Mode')}</span>
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                            {deliveryTimingMode === 'dynamic' ? t('Dynamic Auto-Hide') : t('Permanent All-Day')}
                        </h4>
                    </div>
                </div>
            </div>

            {/* SECTION 1: Store Online / Maintenance Mode Card */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-gray-100 dark:border-gray-700">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('1. Store Status & Maintenance Mode')}</h3>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                maintenanceMode ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                            }`}>
                                {maintenanceMode ? t('PAUSED') : t('ONLINE')}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {t('Toggle store online status or pause orders during maintenance')}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            {maintenanceMode ? t('Enable Maintenance') : t('Taking Orders')}
                        </span>
                        <button
                            type="button"
                            onClick={toggleMaintenanceMode}
                            disabled={loading}
                            className={`relative inline-flex h-8 w-16 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${
                                maintenanceMode ? 'bg-amber-500' : 'bg-emerald-600'
                            }`}
                        >
                            <span
                                className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-md ring-0 transition duration-300 ease-in-out ${
                                    maintenanceMode ? 'translate-x-8' : 'translate-x-0'
                                }`}
                            />
                        </button>
                    </div>
                </div>

                {/* Maintenance Message & Live Preview */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label htmlFor="maintenanceMessage" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                            {t('Custom Maintenance Message')}
                        </label>
                        <textarea
                            id="maintenanceMessage"
                            rows={3}
                            value={maintenanceMessage}
                            onChange={(e) => setMaintenanceMessage(e.target.value)}
                            placeholder={t('e.g., We are taking a short break! We will reopen at 5:00 PM.')}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-[#2E5A2E] outline-none text-sm text-gray-900 dark:text-white transition-all"
                        />
                        <p className="text-xs text-gray-400">
                            {t('This message will be shown on the customer homepage when Maintenance Mode is ON.')}
                        </p>
                    </div>

                    {/* Customer Screen Live Preview Card */}
                    <div className="bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700/80 rounded-2xl p-4 space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                            <Eye size={14} />
                            <span>{t('Customer Screen Preview')}</span>
                        </div>
                        <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                            maintenanceMode
                                ? 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200'
                                : 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200'
                        }`}>
                            {maintenanceMode ? <ShieldAlert size={20} className="flex-shrink-0 mt-0.5 text-amber-600" /> : <CheckCircle size={20} className="flex-shrink-0 mt-0.5 text-emerald-600" />}
                            <div className="text-xs space-y-0.5">
                                <p className="font-bold">
                                    {maintenanceMode ? t('Store Closed / Maintenance') : t('Store is Live & Accepting Orders')}
                                </p>
                                <p className="opacity-90">
                                    {maintenanceMessage || (maintenanceMode ? t('We are currently unavailable. Please check back later!') : t('Browse products and place your order.'))}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECTION 2: Delivery Slot Mode (Dynamic vs Permanent) */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 sm:p-8 space-y-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('2. Delivery Slot Display Mode')}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t('Select how available delivery time slots behave during the day')}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Dynamic Option */}
                    <button
                        type="button"
                        onClick={() => setDeliveryTimingMode('dynamic')}
                        className={`p-5 rounded-2xl border-2 text-left transition-all flex items-start gap-4 ${
                            deliveryTimingMode === 'dynamic'
                                ? 'border-[#2E5A2E] bg-[#2E5A2E]/5 dark:bg-[#7CA90E]/10 dark:border-[#7CA90E]'
                                : 'border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 hover:border-gray-200'
                        }`}
                    >
                        <div className={`p-3 rounded-2xl ${deliveryTimingMode === 'dynamic' ? 'bg-[#2E5A2E] text-white dark:bg-[#7CA90E] dark:text-gray-900' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                            <RefreshCw size={22} />
                        </div>
                        <div className="space-y-1 flex-1">
                            <div className="flex items-center justify-between">
                                <h4 className="font-bold text-sm text-gray-900 dark:text-white">{t('Dynamic Auto-Refresh')}</h4>
                                {deliveryTimingMode === 'dynamic' && <Check size={18} className="text-[#2E5A2E] dark:text-[#7CA90E]" />}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {t('Automatically hides time slots that have already passed earlier in the day.')}
                            </p>
                        </div>
                    </button>

                    {/* Permanent Option */}
                    <button
                        type="button"
                        onClick={() => setDeliveryTimingMode('permanent')}
                        className={`p-5 rounded-2xl border-2 text-left transition-all flex items-start gap-4 ${
                            deliveryTimingMode === 'permanent'
                                ? 'border-[#2E5A2E] bg-[#2E5A2E]/5 dark:bg-[#7CA90E]/10 dark:border-[#7CA90E]'
                                : 'border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 hover:border-gray-200'
                        }`}
                    >
                        <div className={`p-3 rounded-2xl ${deliveryTimingMode === 'permanent' ? 'bg-[#2E5A2E] text-white dark:bg-[#7CA90E] dark:text-gray-900' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                            <Clock size={22} />
                        </div>
                        <div className="space-y-1 flex-1">
                            <div className="flex items-center justify-between">
                                <h4 className="font-bold text-sm text-gray-900 dark:text-white">{t('Permanent All-Day Slots')}</h4>
                                {deliveryTimingMode === 'permanent' && <Check size={18} className="text-[#2E5A2E] dark:text-[#7CA90E]" />}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {t('Keeps all enabled slots visible to customers all day for advance scheduling.')}
                            </p>
                        </div>
                    </button>
                </div>
            </div>

            {/* SECTION 3: Delivery Time Slot Selection Grid (Grouped) */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 sm:p-8 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-700">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('3. Available Delivery Time Slots')}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t('Click time slot pills to enable or disable them for customer delivery')}</p>
                    </div>

                    {/* Quick Presets Toolbar */}
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={selectWorkingHours}
                            className="px-3.5 py-2 text-xs font-bold text-[#2E5A2E] bg-[#2E5A2E]/10 hover:bg-[#2E5A2E]/20 dark:bg-[#7CA90E]/20 dark:text-[#7CA90E] rounded-xl transition-all flex items-center gap-1.5"
                        >
                            <Sparkles size={14} />
                            {t('Working Hours (9am - 9pm)')}
                        </button>
                        <button
                            type="button"
                            onClick={selectAll}
                            className="px-3.5 py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 rounded-xl transition-all"
                        >
                            {t('Select All')}
                        </button>
                        <button
                            type="button"
                            onClick={deselectAll}
                            className="px-3.5 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 rounded-xl transition-all"
                        >
                            {t('Clear All')}
                        </button>
                    </div>
                </div>

                {/* Categorized Time Slot Sections */}
                <div className="space-y-6">
                    {/* Morning Section */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                                <Sunrise size={18} />
                                <h4 className="text-sm font-bold uppercase tracking-wider">{t('Morning Slots (6:00 AM - 12:00 PM)')}</h4>
                            </div>
                            <div className="flex items-center gap-2">
                                <button type="button" onClick={() => selectPreset(morningSlots)} className="text-[11px] font-bold text-amber-600 hover:underline">{t('+ Enable Morning')}</button>
                                <span className="text-gray-300">•</span>
                                <button type="button" onClick={() => deselectPreset(morningSlots)} className="text-[11px] font-medium text-gray-400 hover:underline">{t('- Clear')}</button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                            {morningSlots.map(slot => {
                                const isSelected = allowedSlots.includes(slot.id);
                                return (
                                    <button
                                        key={slot.id}
                                        type="button"
                                        onClick={() => toggleSlot(slot.id)}
                                        className={`py-2.5 px-3 rounded-2xl border text-xs font-bold transition-all text-center flex items-center justify-between ${
                                            isSelected
                                                ? 'bg-[#2E5A2E] border-[#2E5A2E] text-white shadow-md scale-[1.02]'
                                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-amber-400'
                                        }`}
                                    >
                                        <span>{slot.label}</span>
                                        {isSelected && <Check size={14} className="text-white" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Afternoon Section */}
                    <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-700/60">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-orange-500 dark:text-orange-400">
                                <Sun size={18} />
                                <h4 className="text-sm font-bold uppercase tracking-wider">{t('Afternoon Slots (12:00 PM - 5:00 PM)')}</h4>
                            </div>
                            <div className="flex items-center gap-2">
                                <button type="button" onClick={() => selectPreset(afternoonSlots)} className="text-[11px] font-bold text-orange-500 hover:underline">{t('+ Enable Afternoon')}</button>
                                <span className="text-gray-300">•</span>
                                <button type="button" onClick={() => deselectPreset(afternoonSlots)} className="text-[11px] font-medium text-gray-400 hover:underline">{t('- Clear')}</button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                            {afternoonSlots.map(slot => {
                                const isSelected = allowedSlots.includes(slot.id);
                                return (
                                    <button
                                        key={slot.id}
                                        type="button"
                                        onClick={() => toggleSlot(slot.id)}
                                        className={`py-2.5 px-3 rounded-2xl border text-xs font-bold transition-all text-center flex items-center justify-between ${
                                            isSelected
                                                ? 'bg-[#2E5A2E] border-[#2E5A2E] text-white shadow-md scale-[1.02]'
                                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-orange-400'
                                        }`}
                                    >
                                        <span>{slot.label}</span>
                                        {isSelected && <Check size={14} className="text-white" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Evening Section */}
                    <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-700/60">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-indigo-500 dark:text-indigo-400">
                                <Sunset size={18} />
                                <h4 className="text-sm font-bold uppercase tracking-wider">{t('Evening Slots (5:00 PM - 10:00 PM)')}</h4>
                            </div>
                            <div className="flex items-center gap-2">
                                <button type="button" onClick={() => selectPreset(eveningSlots)} className="text-[11px] font-bold text-indigo-500 hover:underline">{t('+ Enable Evening')}</button>
                                <span className="text-gray-300">•</span>
                                <button type="button" onClick={() => deselectPreset(eveningSlots)} className="text-[11px] font-medium text-gray-400 hover:underline">{t('- Clear')}</button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                            {eveningSlots.map(slot => {
                                const isSelected = allowedSlots.includes(slot.id);
                                return (
                                    <button
                                        key={slot.id}
                                        type="button"
                                        onClick={() => toggleSlot(slot.id)}
                                        className={`py-2.5 px-3 rounded-2xl border text-xs font-bold transition-all text-center flex items-center justify-between ${
                                            isSelected
                                                ? 'bg-[#2E5A2E] border-[#2E5A2E] text-white shadow-md scale-[1.02]'
                                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-indigo-400'
                                        }`}
                                    >
                                        <span>{slot.label}</span>
                                        {isSelected && <Check size={14} className="text-white" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Night Section */}
                    <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-700/60">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                                <Moon size={18} />
                                <h4 className="text-sm font-bold uppercase tracking-wider">{t('Late Night / Early Hours (10:00 PM - 6:00 AM)')}</h4>
                            </div>
                            <div className="flex items-center gap-2">
                                <button type="button" onClick={() => selectPreset(nightSlots)} className="text-[11px] font-bold text-purple-600 hover:underline">{t('+ Enable Night')}</button>
                                <span className="text-gray-300">•</span>
                                <button type="button" onClick={() => deselectPreset(nightSlots)} className="text-[11px] font-medium text-gray-400 hover:underline">{t('- Clear')}</button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                            {nightSlots.map(slot => {
                                const isSelected = allowedSlots.includes(slot.id);
                                return (
                                    <button
                                        key={slot.id}
                                        type="button"
                                        onClick={() => toggleSlot(slot.id)}
                                        className={`py-2.5 px-3 rounded-2xl border text-xs font-bold transition-all text-center flex items-center justify-between ${
                                            isSelected
                                                ? 'bg-[#2E5A2E] border-[#2E5A2E] text-white shadow-md scale-[1.02]'
                                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-purple-400'
                                        }`}
                                    >
                                        <span>{slot.label}</span>
                                        {isSelected && <Check size={14} className="text-white" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Save Bar */}
            <div className="sticky bottom-4 z-40 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md p-4 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                    <HelpCircle size={16} />
                    <span>{t('Click "Save All Changes" to activate settings for customer checkout.')}</span>
                </div>

                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="px-8 py-3 bg-[#2E5A2E] hover:bg-[#1a3d1a] text-white rounded-2xl font-bold shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                >
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <Save size={18} />
                    )}
                    <span>{t('Save All Changes')}</span>
                </button>
            </div>
        </div>
    );
};

export default SettingsManagement;
