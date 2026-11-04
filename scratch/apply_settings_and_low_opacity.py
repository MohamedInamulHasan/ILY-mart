import os

# 1. Update SettingsManagement.jsx
settings_code = '''import { useState, useEffect } from 'react';
import { Save, Eye, CheckCircle, AlertCircle, Wrench } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';
import MaintenanceScreen from '../../components/MaintenanceScreen';

const SettingsManagement = () => {
    const { settings, updateMaintenanceMode, updateMaintenanceMessage } = useData();
    const { t } = useLanguage();

    const [loading, setLoading] = useState(false);
    const [savingMessage, setSavingMessage] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [maintenanceMessage, setMaintenanceMessage] = useState('');
    const [showPreviewModal, setShowPreviewModal] = useState(false);

    useEffect(() => {
        if (settings) {
            if (settings.maintenanceMode !== undefined) {
                setMaintenanceMode(settings.maintenanceMode);
            }
            if (settings.maintenanceMessage !== undefined) {
                setMaintenanceMessage(settings.maintenanceMessage);
            }
        }
    }, [settings?.maintenanceMode, settings?.maintenanceMessage]);

    const toggleMaintenanceMode = async () => {
        setLoading(true);
        try {
            const newState = !maintenanceMode;
            await Promise.all([
                updateMaintenanceMode(newState),
                updateMaintenanceMessage(maintenanceMessage)
            ]);
            setMaintenanceMode(newState);
            setMessage({
                type: 'success',
                text: newState
                    ? t('Maintenance mode is now active (Store Closed).')
                    : t('Store is now open and taking orders!')
            });
        } catch (error) {
            console.error('Error toggling maintenance mode:', error);
            setMessage({ type: 'error', text: t('Failed to update maintenance status.') });
        } finally {
            setLoading(false);
            setTimeout(() => setMessage({ type: '', text: '' }), 4000);
        }
    };

    const handleSave = async () => {
        setSavingMessage(true);
        try {
            await Promise.all([
                updateMaintenanceMode(maintenanceMode),
                updateMaintenanceMessage(maintenanceMessage)
            ]);
            setMessage({ type: 'success', text: t('Maintenance settings saved successfully!') });
        } catch (error) {
            console.error('Error saving maintenance message:', error);
            setMessage({ type: 'error', text: t('Failed to save maintenance settings.') });
        } finally {
            setSavingMessage(false);
            setTimeout(() => setMessage({ type: '', text: '' }), 4000);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-12">
            {/* Header */}
            <div>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">{t('Settings')}</h2>
                <p className="text-xs sm:text-sm text-gray-400 mt-0.5">{t('Manage store maintenance status and customer announcements')}</p>
            </div>

            {/* Notification Toast */}
            {message.text && (
                <div className={`p-4 rounded-2xl flex items-center gap-2.5 text-sm font-bold ${
                    message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                    {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                    <span>{message.text}</span>
                </div>
            )}

            {/* Simple Maintenance Card: Preview, Input Field, and Save Button */}
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
                            disabled={loading}
                            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-2 shadow-sm ${
                                maintenanceMode
                                    ? 'bg-amber-500 text-white hover:bg-amber-600'
                                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                            }`}
                        >
                            {loading && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
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
                            onChange={(e) => setMaintenanceMessage(e.target.value)}
                            placeholder={t('e.g., We are closed for updates. Reopening at 5 PM.')}
                            className="flex-1 min-w-0 px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2E5A2E]"
                        />
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={savingMessage}
                            className="px-5 py-3 bg-[#2E5A2E] text-white text-sm font-bold rounded-xl hover:bg-[#1a3d1a] transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 shrink-0 shadow-sm active:scale-95"
                        >
                            {savingMessage ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
                            <span>{t('Save')}</span>
                        </button>
                    </div>
                </div>
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
'''

with open('src/pages/admin/SettingsManagement.jsx', 'w', encoding='utf-8') as f:
    f.write(settings_code)
print("Updated SettingsManagement.jsx successfully")

# 2. Update Orders.jsx: status tag background with light low opacity (80% opacity)
with open('src/pages/Orders.jsx', 'r', encoding='utf-8') as f:
    orders_code = f.read()

orders_status_color = '''    const getStatusColor = (status) => {
        switch (status) {
            case 'Delivered':
            case 'Completed':
                return 'bg-emerald-600/80 text-white';
            case 'Shipped':
            case 'Out for Delivery':
            case 'Accepted':
                return 'bg-sky-600/80 text-white';
            case 'Processing':
            case 'Pending':
                return 'bg-amber-500/80 text-white';
            case 'Cancelled':
                return 'bg-rose-600/80 text-white';
            default:
                return 'bg-gray-600/80 text-white';
        }
    };'''

import re
orders_code = re.sub(
    r'const getStatusColor = \(status\) => \{[\s\S]*?\n    \};',
    orders_status_color.strip(),
    orders_code
)

with open('src/pages/Orders.jsx', 'w', encoding='utf-8') as f:
    f.write(orders_code)
print("Updated Orders.jsx with light low opacity tag backgrounds successfully")

