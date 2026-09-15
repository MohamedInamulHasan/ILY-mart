import { API_BASE_URL } from '../../utils/api';
import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Wrench, Plus, Upload, Search, Edit2, Trash2, 
    ArrowLeft, Save, ChevronRight, X, Clock, MapPin, Power, Phone
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import {
    useServices, useCreateService, useUpdateService, useDeleteService,
    useServiceItems, useCreateServiceItem, useUpdateServiceItem, useDeleteServiceItem
} from '../../hooks/queries/useServices';
import useCloudinaryUpload from '../../hooks/useCloudinaryUpload';
import { formatTime12h, isStoreOpen as isServiceOpen } from '../../utils/storeHelpers';

const ServiceManagement = ({ serviceAdminMode = false, myServiceId = null }) => {
    const { t } = useLanguage();
    const { data: allServices = [], isLoading: loadingServices } = useServices();

    // Filter services if in service admin mode
    const services = useMemo(() => {
        if (serviceAdminMode && myServiceId) {
            const targetId = myServiceId?._id || myServiceId?.id || myServiceId;
            return allServices.filter(s => String(s._id || s.id) === String(targetId));
        }
        return allServices;
    }, [allServices, serviceAdminMode, myServiceId]);

    const { mutateAsync: addService } = useCreateService();
    const { mutateAsync: updateService } = useUpdateService();
    const { mutateAsync: deleteService } = useDeleteService();

    const { mutateAsync: addServiceItem } = useCreateServiceItem();
    const { mutateAsync: updateServiceItem } = useUpdateServiceItem();
    const { mutateAsync: deleteServiceItem } = useDeleteServiceItem();

    const { uploadImage, uploading: uploadingImage } = useCloudinaryUpload();

    const [view, setView] = useState('list'); // 'list', 'form', 'items', 'itemForm'
    const [selectedService, setSelectedService] = useState(null);
    const [editingData, setEditingData] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Form States
    const [serviceForm, setServiceForm] = useState({
        name: '', category: '', description: '', image: '', address: '', mobile: '',
        timingType: 'daily', openingTime: '09:00', closingTime: '21:00', isManuallyClosed: false
    });
    const [itemForm, setItemForm] = useState({
        name: '', description: '', image: '', isAvailable: true
    });

    const filteredServices = useMemo(() => {
        return services.filter(s => 
            s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.category?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [services, searchQuery]);

    // Actions
    const handleAddService = () => {
        setEditingData(null);
        setServiceForm({ 
            name: '', category: '', description: '', image: '', address: '', mobile: '',
            timingType: 'daily', openingTime: '09:00', closingTime: '21:00', isManuallyClosed: false
        });
        setView('form');
    };

    const handleEditService = (service) => {
        setEditingData(service);
        setServiceForm({
            name: service.name || '',
            category: service.category || '',
            description: service.description || '',
            image: service.image || '',
            address: service.address || '',
            mobile: service.mobile || '',
            timingType: service.timingType || 'daily',
            openingTime: service.openingTime || '09:00',
            closingTime: service.closingTime || '21:00',
            isManuallyClosed: service.isManuallyClosed || false
        });
        setView('form');
    };

    const handleToggleStatus = async (service) => {
        const newManualStatus = !service.isManuallyClosed;
        const isCurrentlyClosedBySchedule = !isServiceOpen({ ...service, isManuallyClosed: false });
        
        try {
            await updateService({ 
                id: service._id || service.id, 
                data: { isManuallyClosed: newManualStatus } 
            });
            
            // If we just manually opened it but it's still closed by time
            if (!newManualStatus && isCurrentlyClosedBySchedule) {
                alert(t('Manual status set to Open, but service remains closed due to daily schedule.'));
            }
        } catch (err) {
            alert(t('Failed to update status'));
        }
    };

    const handleServiceSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingData) {
                await updateService({ id: editingData._id || editingData.id, data: serviceForm });
                alert(t('Service updated successfully!'));
            } else {
                await addService(serviceForm);
                alert(t('Service added successfully!'));
            }
            setView('list');
        } catch (err) {
            alert(t('Failed to save service. Please try again.'));
        }
    };

    const handleManageItems = (service) => {
        setSelectedService(service);
        setView('items');
    };

    const handleAddItem = () => {
        setEditingData(null);
        setItemForm({ name: '', description: '', image: '', isAvailable: true });
        setView('itemForm');
    };

    const handleEditItem = (item) => {
        setEditingData(item);
        setItemForm({
            name: item.name || '',
            description: item.description || '',
            image: item.image || '',
            isAvailable: item.isAvailable !== false
        });
        setView('itemForm');
    };

    const handleItemSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingData) {
                await updateServiceItem({ itemId: editingData._id || editingData.id, data: itemForm });
                alert(t('Item updated successfully!'));
            } else {
                await addServiceItem({ serviceId: selectedService?._id || selectedService?.id, data: itemForm });
                alert(t('Item added successfully!'));
            }
            setView('items');
        } catch (err) {
            alert(t('Failed to save item. Please try again.'));
        }
    };

    const handleImageUpload = async (e, type) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const url = await uploadImage(file);
            if (type === 'service') setServiceForm(p => ({ ...p, image: url }));
            else setItemForm(p => ({ ...p, image: url }));
        } catch (err) {
            alert(t('Image upload failed.'));
        }
    };

    const handleBack = () => {
        if (view === 'itemForm') setView('items');
        else if (view === 'items') setView('list');
        else if (view === 'form') setView('list');
    };

    if (loadingServices) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2E5A2E]"></div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl">
            {/* Header Area */}
            <div className="flex justify-between items-center mb-6 gap-3">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    {view !== 'list' && !(serviceAdminMode && view === 'items') && (
                        <button onClick={handleBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-700 dark:text-gray-200 flex-shrink-0">
                            <ArrowLeft size={24} />
                        </button>
                    )}
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white truncate flex items-center gap-2">
                        {view === 'list' && t('Service Management')}
                        {view === 'form' && (editingData ? t('Edit Service') : t('Add New Service'))}
                        {view === 'items' && `${selectedService?.name}`}
                        {view === 'itemForm' && (editingData ? t('Edit Item') : t('Add New Item'))}
                    </h2>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                    {view === 'list' && !serviceAdminMode && (
                        <button onClick={handleAddService} className="flex items-center gap-2 px-4 py-2 bg-[#2E5A2E] text-white rounded-xl hover:bg-[#1a3d1a] transition-colors font-bold shadow-sm">
                            <Plus size={20} />
                            {t('New Service')}
                        </button>
                    )}
                    {view === 'items' && (
                        <button onClick={handleAddItem} className="flex items-center gap-2 px-4 py-2 bg-[#2E5A2E] text-white rounded-xl hover:bg-[#1a3d1a] transition-colors font-bold shadow-sm text-sm">
                            <Plus size={18} />
                            {t('Add Item')}
                        </button>
                    )}
                </div>
            </div>

            <AnimatePresence mode="wait">
                {view === 'list' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key="list">
                        {!serviceAdminMode && (
                            <div className="relative mb-6">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    placeholder={t('Search services...')}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-[#2E5A2E] outline-none shadow-sm transition-all"
                                />
                            </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredServices.map(service => {
                                const isOpen = isServiceOpen(service);
                                return (
                                    <div key={service._id || service.id} className={`bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm group flex flex-col h-full transition-all ${!isOpen ? '' : ''}`}>
                                        <div className={`relative h-44 overflow-hidden cursor-pointer ${!isOpen ? 'opacity-60' : ''}`} onClick={() => handleManageItems(service)}>
                                            <img 
                                                src={service.image || 'https://placehold.co/400x300?text=Service'} 
                                                alt={service.name} 
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                            <div className="absolute top-3 left-3 px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full border border-white/30 shadow-lg">
                                                <span className="text-[10px] font-bold text-white uppercase tracking-[0.15em]">{service.category}</span>
                                            </div>

                                            {/* Status Badge */}
                                            <div className="absolute top-3 right-3 z-10">
                                                <div className={`backdrop-blur-md px-3 py-1 rounded-full border border-white/20 flex items-center gap-1.5 ${service.isManuallyClosed
                                                    ? 'bg-gray-500/80 text-white'
                                                    : !isOpen
                                                        ? 'bg-gray-600/80 text-white'
                                                        : 'bg-emerald-500/80 text-white'
                                                    }`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${isOpen && !service.isManuallyClosed ? 'bg-white animate-pulse' : 'bg-white/50'}`} />
                                                    <span className="text-[9px] font-bold uppercase tracking-wider">
                                                        {!isOpen && !service.isManuallyClosed ? t('Closed') : service.isManuallyClosed ? t('Closed') : t('Open')}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Large Closed Overlay */}
                                            {(!isOpen || service.isManuallyClosed) && (
                                                <div className="absolute inset-0 z-10 bg-black/10 flex items-center justify-center backdrop-blur-[1px]">
                                                    <span className="bg-gray-800 text-white px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg animate-in fade-in zoom-in-95 duration-500">
                                                        {t('Closed')}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-4 flex flex-col flex-grow">
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 truncate">{service.name}</h3>
                                            <div className="space-y-1 mb-4 opacity-70">
                                                <div className="flex items-center gap-2 text-[11px] text-gray-500">
                                                    <MapPin size={12} className="text-[#2E5A2E]" />
                                                    <span className="truncate">{service.address}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-[11px] text-gray-500">
                                                    <Clock size={12} className="text-orange-500" />
                                                    <span>{service.timingType === 'permanent' ? t('Always Open') : `${formatTime12h(service.openingTime)} - ${formatTime12h(service.closingTime)}`}</span>
                                                </div>
                                            </div>

                                            <div className="mt-auto grid grid-cols-2 gap-2 pt-4 border-t border-gray-50 dark:border-gray-700/50">
                                                <button onClick={() => handleManageItems(service)} className="py-2 bg-[#2E5A2E] text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors hover:bg-[#1a3d1a]">
                                                    {t('Items')}
                                                </button>
                                                <div className="flex justify-end gap-1 items-center">
                                                    <button 
                                                        onClick={() => handleToggleStatus(service)}
                                                        disabled={!isOpen && !service.isManuallyClosed}
                                                        title={!isOpen && !service.isManuallyClosed ? t('Already closed by schedule') : service.isManuallyClosed ? t('Open Service') : t('Close Service')}
                                                        className={`p-2 rounded-xl transition-all active:scale-90 ${service.isManuallyClosed 
                                                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-400' 
                                                            : !isOpen ? 'bg-gray-50 dark:bg-gray-800 text-gray-300 cursor-not-allowed' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600'}`}
                                                    >
                                                        <Power size={16} />
                                                    </button>
                                                    <button onClick={() => handleEditService(service)} className="p-2 text-[#2E5A2E] hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl transition-colors">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    {!serviceAdminMode && (
                                                        <button 
                                                            onClick={async () => { if(window.confirm(t('Delete service?'))) await deleteService(service._id || service.id); }}
                                                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                {view === 'form' && (
                    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} key="form" className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm max-w-4xl mx-auto">
                        <form onSubmit={handleServiceSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('Service Name')}</label>
                                    <input 
                                        type="text" value={serviceForm.name} onChange={e => setServiceForm(p => ({...p, name: e.target.value}))}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#2E5A2E] transition-all"
                                        placeholder={t('e.g., Electrician Services, AC Repair')}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('Category')}</label>
                                    <input 
                                        type="text" value={serviceForm.category} onChange={e => setServiceForm(p => ({...p, category: e.target.value}))}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#2E5A2E] transition-all"
                                        placeholder={t('e.g., Home Care, Maintenance')} required
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('Description')}</label>
                                    <textarea 
                                        value={serviceForm.description} onChange={e => setServiceForm(p => ({...p, description: e.target.value}))}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#2E5A2E] transition-all h-24"
                                        placeholder={t('Service description...')}
                                        required
                                    />
                                </div>

                                {/* Scheduling UI */}
                                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                                    <div>
                                        <label className="block text-xs font-bold text-[#2E5A2E] dark:text-[#CBF9B2] uppercase tracking-widest mb-3">{t('Timing Mode')}</label>
                                        <div className="flex gap-2">
                                            {['daily', 'permanent'].map((mode) => (
                                                <button
                                                    key={mode} type="button"
                                                    onClick={() => setServiceForm(p => ({ ...p, timingType: mode }))}
                                                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all border ${serviceForm.timingType === mode 
                                                        ? 'bg-[#2E5A2E] text-white border-[#2E5A2E]' 
                                                        : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700'}`}
                                                >
                                                    {t(mode.charAt(0).toUpperCase() + mode.slice(1))}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    {serviceForm.timingType === 'daily' && (
                                        <>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{t('Opening Time')}</label>
                                                <input 
                                                    type="time" value={serviceForm.openingTime} onChange={e => setServiceForm(p => ({...p, openingTime: e.target.value}))}
                                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#2E5A2E]"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{t('Closing Time')}</label>
                                                <input 
                                                    type="time" value={serviceForm.closingTime} onChange={e => setServiceForm(p => ({...p, closingTime: e.target.value}))}
                                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#2E5A2E]"
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                                
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('Manual Status')}</label>
                                    <button
                                        type="button"
                                        onClick={() => setServiceForm(prev => ({ ...prev, isManuallyClosed: !prev.isManuallyClosed }))}
                                        className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${serviceForm.isManuallyClosed 
                                            ? 'border-red-200 bg-red-50 text-red-600' 
                                            : 'border-emerald-200 bg-emerald-50 text-emerald-600'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Power size={20} />
                                            <div className="text-left">
                                                <p className="font-bold text-sm">{serviceForm.isManuallyClosed ? t('Manually Closed') : t('Operational')}</p>
                                                <p className="text-[10px] opacity-70">{serviceForm.isManuallyClosed ? t('Service is forced closed') : t('Following schedule/mode')}</p>
                                            </div>
                                        </div>
                                        <div className={`w-10 h-5 rounded-full relative transition-colors ${serviceForm.isManuallyClosed ? 'bg-red-500' : 'bg-emerald-500'}`}>
                                            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${serviceForm.isManuallyClosed ? 'right-1' : 'left-1'}`} />
                                        </div>
                                    </button>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('Address')}</label>
                                    <input 
                                        type="text" value={serviceForm.address} onChange={e => setServiceForm(p => ({...p, address: e.target.value}))}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#2E5A2E] transition-all"
                                        placeholder={t('e.g., Main Road, Ilayangudi')}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('Mobile')}</label>
                                    <input 
                                        type="text" value={serviceForm.mobile} onChange={e => setServiceForm(p => ({...p, mobile: e.target.value}))}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#2E5A2E] transition-all"
                                        placeholder={t('e.g., 9876543210')}
                                        required
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('Image')}</label>
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-xl bg-gray-50 dark:bg-gray-700 overflow-hidden border border-gray-200 dark:border-gray-600 flex-shrink-0">
                                            {serviceForm.image ? <img src={serviceForm.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><Upload size={20}/></div>}
                                        </div>
                                        <label className="flex-1 cursor-pointer">
                                            <div className="w-full px-4 py-2 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-600 hover:border-[#2E5A2E] transition-colors flex items-center justify-center gap-2 text-gray-500 text-sm font-bold">
                                                <Upload size={18} />
                                                {uploadingImage ? t('Uploading...') : t('Change Image')}
                                            </div>
                                            <input type="file" className="hidden" onChange={(e) => handleImageUpload(e, 'service')} accept="image/*" />
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                                <button type="button" onClick={() => setView('list')} className="px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-bold hover:bg-gray-200 transition-colors">
                                    {t('Cancel')}
                                </button>
                                <button type="submit" className="px-8 py-2 bg-[#2E5A2E] text-white rounded-xl font-bold shadow-sm hover:bg-[#1a3d1a] transition-colors flex items-center gap-2">
                                    <Save size={18} />
                                    {editingData ? t('Update Service') : t('Save Service')}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}

                {view === 'items' && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} key="items" className="space-y-6">
                        <ItemsList 
                            service={selectedService} 
                            onEdit={handleEditItem}
                            onDelete={async (id) => { if(window.confirm(t('Delete this item?'))) await deleteServiceItem(id); }}
                            updateStatus={updateServiceItem}
                            t={t}
                        />
                    </motion.div>
                )}

                {view === 'itemForm' && (
                    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} key="itemForm" className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm max-w-2xl mx-auto">
                        <form onSubmit={handleItemSubmit} className="space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('Item Name')}</label>
                                    <input 
                                        type="text" value={itemForm.name} onChange={e => setItemForm(p => ({...p, name: e.target.value}))}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#2E5A2E] transition-all font-bold"
                                        placeholder={t('e.g., AC Filter Cleaning, Wiring Check')}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('Description')}</label>
                                    <textarea 
                                        value={itemForm.description} onChange={e => setItemForm(p => ({...p, description: e.target.value}))}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#2E5A2E] transition-all h-20 text-sm"
                                        placeholder={t('Item description...')}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('Image')}</label>
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-xl bg-gray-50 dark:bg-gray-700 overflow-hidden border border-gray-200 dark:border-gray-600 flex-shrink-0">
                                            {itemForm.image ? <img src={itemForm.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><Upload size={16}/></div>}
                                        </div>
                                        <label className="flex-1 cursor-pointer">
                                            <div className="w-full px-4 py-2 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-600 hover:border-[#2E5A2E] transition-colors flex items-center justify-center gap-2 text-gray-500 text-xs font-bold">
                                                <Upload size={16} />
                                                {uploadingImage ? t('Uploading...') : t('Upload')}
                                            </div>
                                            <input type="file" className="hidden" onChange={(e) => handleImageUpload(e, 'item')} accept="image/*" />
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                                <button type="button" onClick={() => setView('items')} className="px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-bold hover:bg-gray-200 transition-colors text-sm">
                                    {t('Cancel')}
                                </button>
                                <button type="submit" className="px-8 py-2 bg-[#2E5A2E] text-white rounded-xl font-bold shadow-sm hover:bg-[#1a3d1a] transition-colors flex items-center gap-2 text-sm">
                                    <Save size={16} />
                                    {editingData ? t('Update Item') : t('Save Item')}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const ServiceItemToggle = ({ item, updateStatus }) => {
    const [localIsAvailable, setLocalIsAvailable] = useState(item.isAvailable !== false);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        setLocalIsAvailable(item.isAvailable !== false);
    }, [item.isAvailable]);

    const handleToggle = async (e) => {
        e.stopPropagation();
        if (isUpdating) return;
        
        const nextValue = !localIsAvailable;
        setLocalIsAvailable(nextValue);
        setIsUpdating(true);
        
        try {
            await updateStatus({ itemId: item._id || item.id, data: { isAvailable: nextValue } });
        } catch (err) {
            console.error("Toggle Error:", err);
            setLocalIsAvailable(!nextValue); // Rollback
            alert(err.message || "Failed to update status");
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <button 
            onClick={handleToggle}
            disabled={isUpdating}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none ${localIsAvailable ? 'bg-[#2E5A2E]' : 'bg-gray-300 dark:bg-gray-600'} ${isUpdating ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
            <span 
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-300 ease-in-out ${localIsAvailable ? 'translate-x-6' : 'translate-x-1'}`} 
            />
        </button>
    );
};

const ItemsList = ({ service, onEdit, onDelete, updateStatus, t }) => {
    const { data: items = [], isLoading } = useServiceItems(service?._id || service?.id, { all: true });

    if (isLoading) return <div className="py-12 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2E5A2E]"></div></div>;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400">{t('Details')}</th>
                            <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400">{t('Status')}</th>
                            <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">{t('Actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                        {items.map(item => (
                            <tr key={item._id || item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/20 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-900 overflow-hidden border border-gray-100 dark:border-gray-700 flex-shrink-0">
                                            <img src={item.image || 'https://placehold.co/100?text=Item'} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{item.name}</p>
                                            <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-1">{item.description}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <ServiceItemToggle item={item} updateStatus={updateStatus} />
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-1">
                                        <button onClick={() => onEdit(item)} className="p-2 text-[#2E5A2E] hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl transition-colors">
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={() => onDelete(item._id || item.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {items.length === 0 && (
                            <tr><td colSpan="3" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400 font-bold">{t('No items found')}</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ServiceManagement;
