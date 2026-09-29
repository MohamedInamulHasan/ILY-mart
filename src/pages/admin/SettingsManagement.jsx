import { useState, useEffect } from 'react';
import { Save, Clock, CheckCircle, AlertCircle, ShieldAlert, Zap, Calendar, Check, KeyRound, Eye, EyeOff, Lock } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { formatDeliveryRange } from '../../utils/storeHelpers';
import { apiService } from '../../utils/api';

const SettingsManagement = () => {
    const { settings, updateDeliverySettings, updateMaintenanceMode, updateDeliveryTimingType, updateMaintenanceMessage } = useData();
    const { user } = useAuth();
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Admin Password Security State
    const [adminPassword, setAdminPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

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
            setMessage({ type: 'success', text: t(`Store is now ${newState ? 'CLOSED (Maintenance)' : 'OPEN & LIVE'}`) });
        } catch (error) {
            setMessage({ type: 'error', text: t('Failed to update status.') });
        } finally {
            setLoading(false);
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
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

    const selectWorkingHours = () => {
        const workingSlots = allSlots
            .filter(s => s.hour >= 9 && s.hour < 21)
            .map(s => s.id);
        setAllowedSlots(workingSlots);
    };

    const selectAll = () => setAllowedSlots(allSlots.map(s => s.id));
    const deselectAll = () => setAllowedSlots([]);

    const handleSave = async () => {
        setLoading(true);
        setMessage({ type: '', text: '' });
        try {
            await Promise.all([
                updateDeliverySettings(allowedSlots),
                updateDeliveryTimingType(deliveryTimingMode),
                updateMaintenanceMessage(maintenanceMessage)
            ]);
            setMessage({ type: 'success', text: t('Settings saved instantly!') });
        } catch (error) {
            console.error('Error saving settings:', error);
            setMessage({ type: 'error', text: t('Failed to save settings.') });
        } finally {
            setLoading(false);
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        }
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        if (!adminPassword || adminPassword.length < 6) {
            setPasswordMessage({ type: 'error', text: t('Password must be at least 6 characters long.') });
            return;
        }
        if (adminPassword !== confirmPassword) {
            setPasswordMessage({ type: 'error', text: t('Passwords do not match.') });
            return;
        }

        setPasswordLoading(true);
        setPasswordMessage({ type: '', text: '' });
        try {
            await apiService.updateProfile({ password: adminPassword });
            setPasswordMessage({ type: 'success', text: t('Admin password updated successfully!') });
            setAdminPassword('');
            setConfirmPassword('');
        } catch (err) {
            console.error('Password update error:', err);
            const errText = err?.message || err?.data?.message || t('Failed to update admin password.');
            setPasswordMessage({ type: 'error', text: errText });
        } finally {
            setPasswordLoading(false);
            setTimeout(() => setPasswordMessage({ type: '', text: '' }), 4000);
        }
    };

    return (
        <div className="max-w-4xl space-y-5 text-sm">
            {/* Header */}
            <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('Store Settings')}</h2>
                    <p className="text-xs text-gray-400">{t('Configure store mode and delivery timing options')}</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="px-4 py-2 bg-[#2E5A2E] text-white text-xs font-bold rounded-xl hover:bg-[#1a3d1a] transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                    {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
                    <span>{t('Save Settings')}</span>
                </button>
            </div>

            {/* Notification Toast */}
            {message.text && (
                <div className={`p-3 rounded-xl flex items-center gap-2 text-xs font-semibold ${
                    message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                    {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    <span>{message.text}</span>
                </div>
            )}

            {/* CARD 1: Store Open / Maintenance Status */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 space-y-3">
                <div className="flex items-center justify-between">
                    <div>
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('App Status')}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                            <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                                {maintenanceMode ? t('Maintenance Mode (Closed)') : t('Taking Orders (Online)')}
                            </h3>
                            <span className={`w-2 h-2 rounded-full ${maintenanceMode ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={toggleMaintenanceMode}
                        disabled={loading}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                            maintenanceMode ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        }`}
                    >
                        {maintenanceMode ? t('Turn Online') : t('Turn Maintenance On')}
                    </button>
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t('Maintenance Message')}</label>
                    <input
                        type="text"
                        value={maintenanceMessage}
                        onChange={(e) => setMaintenanceMessage(e.target.value)}
                        placeholder={t('e.g., We are closed for maintenance. Reopening at 5 PM.')}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none"
                    />
                </div>
            </div>

            {/* CARD 2: Order Delivery Mode (Instant vs Scheduled) */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 space-y-3">
                <div>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('Order Mode')}</span>
                    <p className="text-xs text-gray-400 mt-0.5">{t('Choose how customers order on checkout')}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Instant Mode */}
                    <button
                        type="button"
                        onClick={() => setDeliveryTimingMode('instant')}
                        className={`p-3 rounded-xl border-2 text-left transition-all flex items-center justify-between ${
                            deliveryTimingMode === 'instant'
                                ? 'border-[#2E5A2E] bg-emerald-50/50 text-[#2E5A2E] dark:bg-emerald-950/20 dark:text-[#7CA90E]'
                                : 'border-gray-100 dark:border-gray-700 bg-gray-50/30 text-gray-600 dark:text-gray-300'
                        }`}
                    >
                        <div className="flex items-center gap-2.5">
                            <Zap size={18} className={deliveryTimingMode === 'instant' ? 'text-[#2E5A2E] dark:text-[#7CA90E]' : 'text-gray-400'} />
                            <div>
                                <h4 className="font-bold text-xs">{t('Instant Delivery Only')}</h4>
                                <p className="text-[11px] text-gray-400">{t('Hides timing picker from checkout')}</p>
                            </div>
                        </div>
                        {deliveryTimingMode === 'instant' && <Check size={16} />}
                    </button>

                    {/* Scheduled Mode */}
                    <button
                        type="button"
                        onClick={() => setDeliveryTimingMode('scheduled')}
                        className={`p-3 rounded-xl border-2 text-left transition-all flex items-center justify-between ${
                            deliveryTimingMode !== 'instant'
                                ? 'border-[#2E5A2E] bg-emerald-50/50 text-[#2E5A2E] dark:bg-emerald-950/20 dark:text-[#7CA90E]'
                                : 'border-gray-100 dark:border-gray-700 bg-gray-50/30 text-gray-600 dark:text-gray-300'
                        }`}
                    >
                        <div className="flex items-center gap-2.5">
                            <Calendar size={18} className={deliveryTimingMode !== 'instant' ? 'text-[#2E5A2E] dark:text-[#7CA90E]' : 'text-gray-400'} />
                            <div>
                                <h4 className="font-bold text-xs">{t('Scheduled Timing Enabled')}</h4>
                                <p className="text-[11px] text-gray-400">{t('Allows customer to pick delivery slot')}</p>
                            </div>
                        </div>
                        {deliveryTimingMode !== 'instant' && <Check size={16} />}
                    </button>
                </div>
            </div>

            {/* CARD 3: Admin Account & Password Edit Security Box */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-[#E8F5E9] dark:bg-[#2E5A2E]/20 text-[#2E5A2E] dark:text-[#CBF9B2] rounded-xl">
                            <KeyRound size={18} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white text-sm">{t('Admin Account Security')}</h3>
                            <p className="text-xs text-gray-400">{user?.email || user?.name || user?.mobile || t('Edit Admin Password')}</p>
                        </div>
                    </div>
                    <span className="text-[10px] bg-[#2E5A2E] text-white font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        {t('ADMIN')}
                    </span>
                </div>

                {passwordMessage.text && (
                    <div className={`p-3 rounded-xl flex items-center gap-2 text-xs font-semibold ${
                        passwordMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                        {passwordMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                        <span>{passwordMessage.text}</span>
                    </div>
                )}

                <form onSubmit={handlePasswordUpdate} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">{t('New Admin Password')}</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={adminPassword}
                                    onChange={(e) => setAdminPassword(e.target.value)}
                                    placeholder={t('Enter new password')}
                                    className="w-full pl-3 pr-10 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                >
                                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">{t('Confirm Password')}</label>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder={t('Re-enter new password')}
                                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-1">
                        <button
                            type="submit"
                            disabled={passwordLoading || !adminPassword}
                            className="px-4 py-2 bg-[#2E5A2E] text-white text-xs font-bold rounded-xl hover:bg-[#1a3d1a] transition-all flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
                        >
                            {passwordLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Lock size={14} />}
                            <span>{t('Update Admin Password')}</span>
                        </button>
                    </div>
                </form>
            </div>

            {/* CARD 4: Delivery Time Slots (Compact Grid) */}
            {deliveryTimingMode !== 'instant' && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('Available Delivery Slots')}</span>
                            <p className="text-xs text-gray-400 mt-0.5">{t('Select slots to enable for delivery')}</p>
                        </div>

                        <div className="flex items-center gap-2">
                            <button type="button" onClick={selectWorkingHours} className="px-2.5 py-1 text-[11px] font-bold text-[#2E5A2E] bg-emerald-50 rounded-lg hover:bg-emerald-100">{t('9am - 9pm')}</button>
                            <button type="button" onClick={selectAll} className="px-2.5 py-1 text-[11px] font-bold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">{t('All')}</button>
                            <button type="button" onClick={deselectAll} className="px-2.5 py-1 text-[11px] font-bold text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100">{t('Clear')}</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                        {allSlots.map(slot => {
                            const isSelected = allowedSlots.includes(slot.id);
                            return (
                                <button
                                    key={slot.id}
                                    type="button"
                                    onClick={() => toggleSlot(slot.id)}
                                    className={`py-1.5 px-2.5 rounded-xl border text-xs font-semibold transition-all text-center flex items-center justify-between ${
                                        isSelected
                                            ? 'bg-[#2E5A2E] border-[#2E5A2E] text-white shadow-sm'
                                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                                    }`}
                                >
                                    <span>{slot.label}</span>
                                    {isSelected && <Check size={12} className="text-[#CBF9B2]" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsManagement;
