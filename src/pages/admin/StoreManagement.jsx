import { API_BASE_URL } from '../../utils/api';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isStoreOpen, formatTime12h, isProductScheduled } from '../../utils/storeHelpers';
import { motion } from 'framer-motion';
import {
    Store,
    Plus,
    Upload,
    Search,
    Edit2,
    Trash2,
    MapPin,
    ArrowLeft,
    Package,
    Save,
    X,
    Clock,
    Star,
    Power,
    GripVertical,
    ShoppingBag,
    Copy,
    Eye,
    EyeOff
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useStores, useCreateStore, useUpdateStore, useDeleteStore, useUpdateStoreOrder } from '../../hooks/queries/useStores';
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct, useUpdateProductOrder } from '../../hooks/queries/useProducts';
import { useCategories } from '../../hooks/queries/useCategories';
import useCloudinaryUpload from '../../hooks/useCloudinaryUpload';
import { useQueryClient } from '@tanstack/react-query';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SortableStoreCard, SortableProductRow, DragHandle } from './AdminDashboard_Sortables';

const StoreManagement = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();

    // NEW HOOKS
    const { data: stores = [] } = useStores();
    const { data: products = [] } = useProducts();
    const { data: categories = [] } = useCategories();

    const { mutateAsync: addStore } = useCreateStore();
    const { mutateAsync: updateStore } = useUpdateStore();
    const { mutateAsync: deleteStore } = useDeleteStore();

    const { mutateAsync: addProduct } = useCreateProduct();
    const { mutateAsync: updateProduct } = useUpdateProduct();
    const { mutateAsync: deleteProduct } = useDeleteProduct();

    const { mutateAsync: reorderStores } = useUpdateStoreOrder();
    const { mutateAsync: reorderProducts } = useUpdateProductOrder();

    // DnD Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250,
                tolerance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // DnD Handler
    const handleDragEnd = async (event) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            if (view === 'list') {
                // Reorder Stores
                const oldIndex = displayedStores.findIndex((store) => (store.id || store._id) === active.id);
                const newIndex = displayedStores.findIndex((store) => (store.id || store._id) === over.id);

                if (oldIndex !== -1 && newIndex !== -1) {
                    const newOrder = arrayMove(displayedStores, oldIndex, newIndex);
                    // Optimistic update if possible, but for now we rely on query invalidation
                    // To make it smooth, we might want to update local state if we had one for the list
                    // But 'displayedStores' is derived.
                    // We will just fire the mutation. The UI might jump a bit until refetch.
                    // For better UX, we'd need local state for the list.

                    const orderedIds = newOrder.map(s => s.id || s._id);
                    await reorderStores(orderedIds);
                }
            } else if (view === 'storeProducts') {
                // Reorder Products
                const storeProducts = products.filter(p => {
                    const pStoreId = p.storeId?._id || p.storeId;
                    const targetId = selectedStore._id || selectedStore.id;
                    return targetId === 'none' 
                        ? (!pStoreId || pStoreId === 'none') 
                        : (pStoreId == targetId || String(pStoreId) === String(targetId));
                });

                const oldIndex = storeProducts.findIndex((p) => (p.id || p._id) === active.id);
                const newIndex = storeProducts.findIndex((p) => (p.id || p._id) === over.id);

                if (oldIndex !== -1 && newIndex !== -1) {
                    const newOrder = arrayMove(storeProducts, oldIndex, newIndex);
                    const orderedIds = newOrder.map(p => p.id || p._id);
                    await reorderProducts(orderedIds);
                }
            }
        }
    };

    const { uploadImage, uploading: uploadingImage } = useCloudinaryUpload();
    const queryClient = useQueryClient();

    const userRoles = Array.isArray(user?.role) ? user.role : [user?.role || 'customer'];
    const isStoreAdmin = userRoles.includes('store_admin');
    const myStoreId = user?.storeId?._id || user?.storeId;
    const myStore = isStoreAdmin ? stores.find(s => (s._id || s.id) === myStoreId || s._id === myStoreId) : null;

    const [view, setView] = useState('list'); // Default to list view for everyone
    const [selectedStore, setSelectedStore] = useState(myStore);
    const [editingStore, setEditingStore] = useState(myStore);

    // Initial load for Store Admin
    useEffect(() => {
        if (isStoreAdmin && myStore && !editingStore) {
            // We can pre-set these for convenience, but we DON'T change the view to 'form'
            setEditingStore(myStore);
            setSelectedStore(myStore);

            const storeCategories = Array.isArray(myStore.type) ? myStore.type : (myStore.type ? [myStore.type] : []);
            const validCategories = storeCategories.filter(c => categories.some(cat => cat.name === c));

            setStoreForm({
                name: myStore.name,
                address: myStore.address || '',
                image: myStore.image,
                rating: myStore.rating,
                openingTime: myStore.openingTime || '09:00',
                closingTime: myStore.closingTime || '21:00',
                mobile: myStore.mobile || '',
                category: validCategories
            });
        }
    }, [isStoreAdmin, myStore, stores, editingStore, categories]);

    // Add back button logic for Store Admin? Maybe not needed if we force view.
    const handleBackToList = () => {
        if (isStoreAdmin) return; // Store admin doesn't go back to list
        setView('list');
    };
    const [editingProduct, setEditingProduct] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [storeForm, setStoreForm] = useState({
        name: '',
        address: '',
        image: '',
        rating: 4.5,
        openingTime: '09:00',
        closingTime: '21:00',
        mobile: '',
        timingType: 'daily',
        category: []
    });
    const [productForm, setProductForm] = useState({
        title: '',
        price: '',
        category: '',
        subcategory: [],
        description: '',
        image: '',
        sliderImages: [],
        stock: 0,
        unit: '',
        useTimeLimit: false,
        openingTime: '00:00',
        closingTime: '23:59'
    });

    const handleStoreImageUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const imageUrl = await uploadImage(file);
                setStoreForm({ ...storeForm, image: imageUrl });
            } catch (error) {
                console.error('Store image upload failed:', error);
                alert(t('Failed to upload image. Please try again.'));
            }
        }
    };

    const handleProductImageUpload = async (e, isSlider = false) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            try {
                if (isSlider) {
                    // Upload all slider images
                    const promises = files.map(file => uploadImage(file));
                    const urls = await Promise.all(promises);
                    setProductForm(prev => ({ ...prev, sliderImages: [...prev.sliderImages, ...urls] }));
                } else {
                    // Single image upload
                    const imageUrl = await uploadImage(files[0]);
                    setProductForm(prev => ({ ...prev, image: imageUrl }));
                }
            } catch (error) {
                console.error('Product image upload failed:', error);
                alert(t('Failed to upload image. Please try again.'));
            }
        }
    };

    const removeSliderImage = (index) => {
        setProductForm(prev => ({
            ...prev,
            sliderImages: prev.sliderImages.filter((_, i) => i !== index)
        }));
    };

    const handleEditStore = (store) => {
        setEditingStore(store);

        const storeCategories = Array.isArray(store.type) ? store.type : (store.type ? [store.type] : []);
        const validCategories = storeCategories.filter(c => categories.some(cat => cat.name === c));

        setStoreForm({
            name: store.name,
            address: store.address || '',
            image: store.image,
            rating: store.rating,
            openingTime: store.openingTime || '09:00',
            closingTime: store.closingTime || '21:00',
            mobile: store.mobile || '',
            timingType: store.timingType || 'daily',
            category: validCategories
        });
        setView('form');
    };

    const handleDeleteStore = async (id) => {
        if (window.confirm(t('Are you sure you want to delete this store?'))) {
            try {
                await deleteStore(id);
                alert(t('Store deleted successfully!'));
            } catch (error) {
                console.error('Error deleting store:', error);
                alert(t('Failed to delete store. Please try again.'));
            }
        }
    };

    const handleStoreSubmit = async (e) => {
        e.preventDefault();

        // Generate timing string from time fields for backward compatibility
        const formatTime = (time24) => {
            const [hours, minutes] = time24.split(':');
            const hour = parseInt(hours);
            const period = hour >= 12 ? 'PM' : 'AM';
            const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
            return `${hour12}:${minutes} ${period}`;
        };

        const timingString = `${formatTime(storeForm.openingTime)} - ${formatTime(storeForm.closingTime)}`;

        const storeData = {
            name: storeForm.name,
            type: storeForm.category.length > 0 ? storeForm.category : ['General Store'], // Use selected categories
            address: storeForm.address,
            mobile: storeForm.mobile,
            timing: timingString,
            openingTime: storeForm.openingTime,
            closingTime: storeForm.closingTime,
            timingType: storeForm.timingType,

            image: storeForm.image,
            rating: storeForm.rating || 4.5
        };

        try {
            if (editingStore) {
                // Clone data to avoid mutating state directly if we were using it elsewhere
                const updateData = { ...storeData };

                // Don't send proxy URL for image
                if (updateData.image && (updateData.image.includes(API_BASE_URL) || updateData.image.includes('/api/stores'))) {
                    delete updateData.image;
                }

                await updateStore({ id: editingStore._id || editingStore.id, data: updateData });
                alert(t('Store updated successfully!'));
            } else {
                await addStore(storeData);
                alert(t('Store added successfully!'));
            }
            setStoreForm({ name: '', address: '', mobile: '', image: '', rating: 4.5, openingTime: '09:00', closingTime: '21:00', timingType: 'daily', category: [] });
            setEditingStore(null);
            setView('list');
        } catch (error) {
            alert(t('Failed to save store. Please try again.'));
            console.error('Error saving store:', error);
        }
    };

    const handleManageProducts = (store) => {
        setSelectedStore(store);
        setView('storeProducts');
    };

    const proceedToManageProducts = (store) => {
        setSelectedStore(store);
        setView('storeProducts');
    };

    const handleAddProductToStore = () => {
        setProductForm({ title: '', price: '', category: '', subcategory: [], description: '', image: '', sliderImages: [], stock: 0, unit: '', useTimeLimit: false, openingTime: '00:00', closingTime: '23:59' });
        setEditingProduct(null);
        setView('addProductToStore');
    };

    const handleEditProduct = (product) => {
        setEditingProduct(product);
        setProductForm({
            title: product.title,
            price: product.price,
            category: product.category,
            subcategory: Array.isArray(product.subcategory) ? product.subcategory : (product.subcategory ? [product.subcategory] : []),
            description: product.description,
            image: product.image,
            sliderImages: product.images || [],
            stock: product.stock || 0,
            unit: product.unit || '',
            useTimeLimit: product.useTimeLimit || false,
            openingTime: product.openingTime || '00:00',
            closingTime: product.closingTime || '23:59'
        });
        setView('addProductToStore'); // Reusing the add form for editing
    };

    const handleDeleteProduct = async (productId) => {
        if (window.confirm(t('Are you sure you want to delete this product?'))) {
            try {
                await deleteProduct(productId);
                alert(t('Product deleted successfully!'));
            } catch (error) {
                console.error('Error deleting product:', error);
                alert(t('Failed to delete product. Please try again.'));
            }
        }
    };

    const handleDuplicateProduct = async (product) => {
        if (!window.confirm(t('Duplicate this product?'))) return;
        try {
            // Exclude system fields
            const { _id, id, createdAt, updatedAt, __v, ...rest } = product;

            // Ensure duplicate has the same storeId
            const newProduct = {
                ...rest,
                title: `${rest.title} (Copy)`,
                storeId: selectedStore._id || selectedStore.id, // Explicitly set storeId
                images: rest.images || [],
                image: rest.image
            };

            await addProduct(newProduct);
            alert(t('Product duplicated successfully!'));
        } catch (error) {
            console.error('Error duplicating product:', error);
        alert(t('Failed to duplicate product.'));
        }
    };

    const handleToggleStatus = async (store) => {
        const newManualStatus = !store.isManuallyClosed;
        const isCurrentlyClosedBySchedule = !isStoreOpen({ ...store, isManuallyClosed: false });

        try {
            await updateStore({
                id: store.id || store._id,
                data: { isManuallyClosed: newManualStatus }
            });

            // If we just manually opened it but it's still closed by time
            if (!newManualStatus && isCurrentlyClosedBySchedule) {
                alert(t('Manual status set to Open, but store remains closed due to daily schedule.'));
            }
        } catch (error) {
            console.error('Error toggling store status:', error);
            alert(t('Failed to update store status.'));
        }
    };

    const handleToggleActive = async (store) => {
        const currentActive = store.isActive !== false;
        const newActive = !currentActive;

        try {
            await updateStore({
                id: store.id || store._id,
                data: { isActive: newActive }
            });
        } catch (error) {
            console.error('Error toggling store active status:', error);
            alert(t('Failed to update store status.'));
        }
    };

    const handleProductSubmit = async (e) => {
        e.preventDefault();

        if (!selectedStore && !isStoreAdmin) {
            alert(t('No store selected. Please select a store or choose "None".'));
            return;
        }

        const imagesArray = productForm.sliderImages.length > 0
            ? productForm.sliderImages
            : (productForm.image ? [productForm.image] : []);

        const productData = {
            title: productForm.title,
            description: productForm.description,
            category: productForm.category,
            subcategory: productForm.subcategory,
            price: parseFloat(productForm.price),
            storeId: (selectedStore?.id === 'none' || !selectedStore) ? null : (selectedStore._id || selectedStore.id),
            image: productForm.image || imagesArray[0],
            images: imagesArray,
            unit: productForm.unit,
            useTimeLimit: productForm.useTimeLimit,
            openingTime: productForm.openingTime,
            closingTime: productForm.closingTime
        };

        try {
            if (editingProduct) {
                const updateData = { ...productData };

                // Don't send proxy URL for main image
                if (updateData.image && (updateData.image.includes(API_BASE_URL) || updateData.image.includes('/api/products'))) {
                    delete updateData.image;
                }

                // Filter out proxy URLs from slider images if they exist
                if (updateData.images && updateData.images.length > 0) {
                    updateData.images = updateData.images.filter(img =>
                        !img.includes(API_BASE_URL) && !img.includes('/api/products')
                    );
                }

                await updateProduct({ id: editingProduct._id || editingProduct.id, data: updateData });
                alert(t('Product updated successfully!'));
            } else {
                await addProduct(productData);
                alert(t('Product added to store successfully!'));
            }
            setView('storeProducts');
        } catch (error) {
            console.error('Error saving product:', error);
            const errorMessage = error.response?.data?.message || error.message || t('Failed to save product. Please try again.');
            alert(`${t('Error')}: ${errorMessage}`);
        }
    };

    // Determine stores to display
    const displayedStores = isStoreAdmin
        ? (myStore ? [myStore] : [])
        : stores.filter(s =>
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (s.address && s.address.toLowerCase().includes(searchQuery.toLowerCase()))
        );

    return (
        <div className="max-w-6xl">
            {/* Header */}
            {/* Dynamic Header for all views */}
            <div className="flex justify-between items-center mb-6 gap-3">
                <div className="flex items-center gap-2 min-w-0 flex-1 relative">
                    {(view !== 'list' || isStoreAdmin) && (
                        <button
                            onClick={() => {
                                if (view === 'addProductToStore') {
                                    setView('storeProducts');
                                } else if (view === 'form' || view === 'storeProducts') {
                                    setView('list');
                                } else {
                                    navigate(-1);
                                }
                            }}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-700 dark:text-gray-200 flex-shrink-0 z-10"
                            title={t('Back')}
                        >
                            <ArrowLeft size={24} />
                        </button>
                    )}
                    <h2 className={`text-xl md:text-2xl text-gray-900 dark:text-white truncate flex items-center gap-2 ${view === 'list' && isStoreAdmin ? 'font-bold text-center flex-1 text-2xl pr-8' : 'font-normal'}`}>
                        {view === 'list' ? (!isStoreAdmin ? t('Manage Stores') : t('My Store')) :
                            view === 'form' ? (editingStore ? t('Edit Store') : t('Add New Store')) :
                                view === 'storeProducts' ? `${selectedStore?.name || ''}` :
                                    view === 'addProductToStore' ? (editingProduct ? t('Edit Product') : `${t('Add Product')}`) :
                                        t('Manage Stores')}
                    </h2>
                </div>

                <div className="flex gap-2 flex-shrink-0">

                    {view === 'list' && !isStoreAdmin && (
                        <button
                            onClick={() => {
                                setEditingStore(null);
                                setStoreForm({ name: '', address: '', image: '', rating: 4.5, openingTime: '09:00', closingTime: '21:00', mobile: '', category: [] });
                                setView('form');
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-[#2E5A2E] text-white rounded-xl hover:bg-[#1a3d1a] transition-colors font-bold shadow-sm"
                        >
                            <Plus size={20} />
                            {t('Add New Store')}
                        </button>
                    )}

                    {view === 'storeProducts' && (
                        <button
                            onClick={handleAddProductToStore}
                            className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 bg-[#2E5A2E] text-white rounded-xl hover:bg-[#1a3d1a] transition-colors text-sm md:text-base whitespace-nowrap font-bold shadow-sm"
                        >
                            <Plus size={18} className="md:w-5 md:h-5" />
                            {t('Add Product')}
                        </button>
                    )}

                </div>
            </div>

            {view === 'list' && (
                <>
                    {/* Search Bar - Hide for Store Admin */}
                    {!isStoreAdmin && (
                        <div className="mb-4">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder={t('Search by store name or location...')}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#7CA90E] outline-none"
                                />
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            </div>
                        </div>
                    )}

                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={displayedStores.map(s => s.id || s._id)} strategy={rectSortingStrategy}>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {displayedStores.map(store => {
                                    const isTimeOpen = isStoreOpen({ ...store, isManuallyClosed: false });
                                    const isOpen = isStoreOpen(store);
                                    const isClosed = !isOpen;

                                    return (
                                        <SortableStoreCard key={store.id || store._id} store={store}>
                                            <div className={`group relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm flex flex-col h-full transition-all duration-300 ${isClosed ? '' : ''}`}>
                                                <div className={`relative h-44 overflow-hidden ${isClosed ? 'opacity-60' : ''}`}>
                                                    <DragHandle className="absolute top-3 left-3 z-30 p-2 bg-black/50 hover:bg-black/70 text-white rounded-xl backdrop-blur-md transition-all border border-white/10 shadow-lg">
                                                        <GripVertical size={18} />
                                                    </DragHandle>

                                                    <img
                                                        src={store.image || `${API_BASE_URL}/stores/${store.id || store._id}/image`}
                                                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/400x300?text=No+Image'; }}
                                                        alt={store.name}
                                                        className={`w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 ${isClosed ? '' : ''}`}
                                                    />

                                                    {/* Status Badge - Floating Glassmorphism */}
                                                    <div className="absolute top-3 right-3 z-20">
                                                        <div className={`backdrop-blur-md px-3 py-1 rounded-full border border-white/20 flex items-center gap-1.5 ${store.isManuallyClosed
                                                            ? 'bg-gray-500/80 text-white'
                                                            : !isOpen
                                                                ? 'bg-gray-600/80 text-white'
                                                                : 'bg-emerald-500/80 text-white'
                                                            }`}>
                                                            <div className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-white animate-pulse' : 'bg-white/50'}`} />
                                                            <span className="text-[9px] font-bold uppercase tracking-wider whitespace-nowrap">
                                                                {!isOpen && !store.isManuallyClosed ? t('Closed') : store.isManuallyClosed ? t('Closed') : t('Open')}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Large Closed/Hidden Overlay */}
                                                    {store.isActive === false ? (
                                                        <div className="absolute inset-0 z-20 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
                                                            <span className="bg-red-600 text-white px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg animate-in fade-in zoom-in-95 duration-500">
                                                                {t('Hidden')}
                                                            </span>
                                                        </div>
                                                    ) : isClosed ? (
                                                        <div className="absolute inset-0 z-20 bg-black/10 flex items-center justify-center backdrop-blur-[1px]">
                                                            <span className="bg-gray-800 text-white px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg animate-in fade-in zoom-in-95 duration-500">
                                                                {t('Closed')}
                                                            </span>
                                                        </div>
                                                    ) : null}
                                                </div>

                                                <div className="p-4 flex flex-col flex-grow">
                                                    <div className="mb-3">
                                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight line-clamp-1 group-hover:text-[#2E5A2E] dark:group-hover:text-[#8bc910] transition-colors duration-300">
                                                            {store.name}
                                                        </h3>
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {(Array.isArray(store.type) ? store.type : (store.type ? [store.type] : []))
                                                                .slice(0, 1)
                                                                .map((cat, idx) => (
                                                                    <span key={idx} className="text-[10px] font-bold text-[#2E5A2E] dark:text-[#CBF9B2] uppercase tracking-widest opacity-60">
                                                                        {t(cat)}
                                                                    </span>
                                                                ))}
                                                        </div>
                                                    </div>

                                                    {/* Quick Info */}
                                                    <div className="space-y-1.5 mb-4">
                                                        <div className="flex items-start gap-2 text-gray-500 dark:text-gray-400">
                                                            <MapPin size={14} className="mt-0.5 flex-shrink-0 text-[#2E5A2E] dark:text-[#7CA90E]" />
                                                            <span className="text-[11px] leading-tight line-clamp-1">{store.address || t('No address')}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                                            <Clock size={14} className="flex-shrink-0 text-orange-500" />
                                                            <span className="text-[11px]">{store.timingType === 'permanent' ? t('Always Open') : `${formatTime12h(store.openingTime)} - ${formatTime12h(store.closingTime)}`}</span>
                                                        </div>
                                                    </div>

                                                    {/* Admin Actions */}
                                                    <div className="mt-auto grid grid-cols-2 gap-2 pt-4 border-t border-gray-50 dark:border-gray-700/50">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); proceedToManageProducts(store); }}
                                                            className="flex items-center justify-center gap-2 py-2 bg-[#2E5A2E] text-white rounded-xl hover:bg-[#1a3d1a] transition-all text-[10px] font-bold uppercase tracking-wider"
                                                        >
                                                            <Package size={16} />
                                                            {t('Products')}
                                                        </button>

                                                        <div className="flex justify-end items-center gap-1">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleToggleStatus(store); }}
                                                                disabled={!isOpen && !store.isManuallyClosed}
                                                                title={!isOpen && !store.isManuallyClosed ? t('Already closed by schedule') : store.isManuallyClosed ? t('Open Store') : t('Close Store')}
                                                                className={`p-2 rounded-xl transition-all active:scale-90 ${store.isManuallyClosed 
                                                                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-400' 
                                                                    : !isOpen ? 'bg-gray-50 dark:bg-gray-800 text-gray-300 cursor-not-allowed' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600'}`}
                                                            >
                                                                <Power size={18} />
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleToggleActive(store); }}
                                                                title={store.isActive === false ? t('Unhide Store') : t('Hide Store')}
                                                                className={`p-2 rounded-xl transition-all active:scale-90 ${store.isActive === false 
                                                                    ? 'bg-red-50 dark:bg-red-900/20 text-red-500' 
                                                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-400 hover:text-gray-600'}`}
                                                            >
                                                                {store.isActive === false ? <EyeOff size={18} /> : <Eye size={18} />}
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleEditStore(store); }}
                                                                className="p-2 text-[#2E5A2E] hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl transition-colors"
                                                            >
                                                                <Edit2 size={18} />
                                                            </button>
                                                            {!isStoreAdmin && (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleDeleteStore(store.id || store._id); }}
                                                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                                                                >
                                                                    <Trash2 size={18} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </SortableStoreCard>
                                    );
                                })}
                                {displayedStores.length === 0 && (
                                    <div className="col-span-full text-center py-10 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                                        {t('No stores found matching your search.')}
                                    </div>
                                )}
                            </div>
                        </SortableContext>
                    </DndContext>
                </>
            )}

            {view === 'form' && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <form onSubmit={handleStoreSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('Store Name')}</label>
                                <input
                                    type="text"
                                    value={storeForm.name}
                                    onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('Address')}</label>
                                <input
                                    type="text"
                                    value={storeForm.address}
                                    onChange={(e) => setStoreForm({ ...storeForm, address: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="e.g., 123 Main St"
                                    required
                                />
                            </div>

                            <div className="col-span-full bg-gray-50 dark:bg-gray-750 p-4 rounded-2xl border border-gray-200/80 dark:border-gray-700">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-[#E8F5E9] dark:bg-[#2E5A2E]/30 text-[#2E5A2E] dark:text-[#CBF9B2] rounded-xl">
                                            <Clock size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-900 dark:text-white">{t('Store Timing')}</h4>
                                            <p className="text-[10px] text-gray-500 dark:text-gray-400 tracking-tight">{t('Schedule opening and closing hours for this store')}</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={storeForm.timingType === 'daily'}
                                            onChange={(e) => setStoreForm({ ...storeForm, timingType: e.target.checked ? 'daily' : 'permanent' })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#2E5A2E]"></div>
                                    </label>
                                </div>

                                {storeForm.timingType === 'daily' && (
                                    <div className="grid grid-cols-2 gap-4 mt-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div>
                                            <label className="block text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1.5 ml-1">{t('Opening')}</label>
                                            <input
                                                type="time"
                                                value={storeForm.openingTime}
                                                onChange={(e) => setStoreForm({ ...storeForm, openingTime: e.target.value })}
                                                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#2E5A2E] outline-none text-sm"
                                                required={storeForm.timingType === 'daily'}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1.5 ml-1">{t('Closing')}</label>
                                            <input
                                                type="time"
                                                value={storeForm.closingTime}
                                                onChange={(e) => setStoreForm({ ...storeForm, closingTime: e.target.value })}
                                                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#2E5A2E] outline-none text-sm"
                                                required={storeForm.timingType === 'daily'}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('Mobile Number')}</label>
                                <input
                                    type="text"
                                    value={storeForm.mobile}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '');
                                        if (val.length <= 10) {
                                            setStoreForm({ ...storeForm, mobile: val });
                                        }
                                    }}
                                    maxLength={10}
                                    pattern="[0-9]*"
                                    inputMode="numeric"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#7CA90E] outline-none"
                                    placeholder="e.g., 9876543210"
                                    required
                                />
                            </div>

                            <div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('Categories')}</label>
                                    <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 max-h-56 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {categories && categories.length > 0 ? categories.map((cat) => (
                                            <label key={cat._id || cat.id} className="flex items-start gap-2.5 cursor-pointer p-2.5 hover:bg-gray-100 dark:hover:bg-gray-600/50 rounded-xl transition-colors min-w-0">
                                                <input
                                                    type="checkbox"
                                                    value={cat.name}
                                                    checked={storeForm.category.includes(cat.name)}
                                                    onChange={(e) => {
                                                        const { checked, value } = e.target;
                                                        setStoreForm(prev => ({
                                                            ...prev,
                                                            category: checked
                                                                ? [...prev.category, value]
                                                                : prev.category.filter(c => c !== value)
                                                        }));
                                                    }}
                                                    className="w-4 h-4 mt-0.5 text-[#2E5A2E] rounded border-gray-300 focus:ring-[#2E5A2E] flex-shrink-0"
                                                />
                                                <span className="text-gray-900 dark:text-white text-xs sm:text-sm font-medium leading-snug break-words flex-1 min-w-0">{t(cat.name)}</span>
                                            </label>
                                        )) : <p className="text-gray-500 text-sm col-span-full">{t('No categories available')}</p>}
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {storeForm.category.length > 0
                                            ? `${t('Selected')}: ${storeForm.category.join(', ')}`
                                            : t('Please select at least one category')}
                                    </p>
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('Store Image')}</label>
                                <div className="flex items-center gap-4">
                                    {(storeForm.image || editingStore) && (
                                        <img
                                            src={storeForm.image || `${API_BASE_URL}/stores/${editingStore?._id || editingStore?.id}/image`}
                                            onError={(e) => { e.target.style.display = 'none'; }}
                                            alt="Preview"
                                            className="w-16 h-16 rounded-lg object-cover bg-white"
                                        />
                                    )}
                                    <label className="flex-1 cursor-pointer">
                                        <div className="w-full px-4 py-2 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2">
                                            <Upload size={20} />
                                            <span>{uploadingImage ? t('Uploading...') : t('Upload Image')}</span>
                                        </div>
                                        <input type="file" accept="image/*" onChange={handleStoreImageUpload} className="hidden" required={!storeForm.image && !editingStore} />
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={uploadingImage}
                                className={`px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2 ${uploadingImage
                                    ? 'bg-gray-400 cursor-not-allowed text-white'
                                    : 'bg-[#2E5A2E] text-white hover:bg-[#1a3d1a] shadow-sm'
                                    }`}
                            >
                                {uploadingImage ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        <span>{t('Uploading...')}</span>
                                    </>
                                ) : (
                                    <>
                                        <Save size={20} />
                                        {editingStore ? t('Update Store') : t('Add Store')}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {view === 'storeProducts' && selectedStore && (
                <div className="space-y-6">



                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="overflow-x-auto">
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                                        <tr>
                                            <th className="p-4 w-12"></th>
                                            <th className="p-4 text-sm font-medium text-gray-500 dark:text-gray-400">{t('Image')}</th>
                                            <th className="p-4 text-sm font-medium text-gray-500 dark:text-gray-400">{t('Title')}</th>
                                            <th className="p-4 text-sm font-medium text-gray-500 dark:text-gray-400">{t('Category')}</th>
                                            <th className="p-4 text-sm font-medium text-gray-500 dark:text-gray-400">{t('Price')}</th>
                                            <th className="p-4 text-sm font-medium text-gray-500 dark:text-gray-400">{t('Free Delivery')}</th>
                                            <th className="p-4 text-sm font-medium text-gray-500 dark:text-gray-400">{t('Hide')}</th>
                                            <th className="p-4 text-sm font-medium text-gray-500 dark:text-gray-400 text-right">{t('Actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        <SortableContext
                                            items={products.filter(p => {
                                                const pStoreId = p.storeId?._id || p.storeId;
                                                const targetId = selectedStore._id || selectedStore.id;
                                                return targetId === 'none' 
                                                    ? (!pStoreId || pStoreId === 'none') 
                                                    : (pStoreId == targetId || String(pStoreId) === String(targetId));
                                            }).map(p => p._id || p.id)}
                                            strategy={verticalListSortingStrategy}
                                        >
                                            {products.filter(p => {
                                                const pStoreId = p.storeId?._id || p.storeId;
                                                const targetId = selectedStore._id || selectedStore.id;
                                                return targetId === 'none' 
                                                    ? (!pStoreId || pStoreId === 'none') 
                                                    : (pStoreId == targetId || String(pStoreId) === String(targetId));
                                            }).map(product => (
                                                <SortableProductRow key={product._id || product.id} product={product}>
                                                    <td className="p-4">
                                                        <DragHandle className="text-gray-400 hover:text-gray-600">
                                                            <GripVertical size={20} />
                                                        </DragHandle>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-white">
                                                            <img
                                                                src={product.image || `${API_BASE_URL}/products/${product.id || product._id}/image`}
                                                                onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/100x100?text=No+Image'; }}
                                                                alt={product.title}
                                                                className="w-12 h-12 object-cover"
                                                            />
                                                            {product.unit && (
                                                                <span className="absolute bottom-0 right-0 bg-white/70 backdrop-blur-[2px] text-black text-[9px] font-medium px-1.5 py-0.5 rounded-tl-md shadow-sm z-10 leading-none flex items-center justify-center">
                                                                    {product.unit}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 font-medium text-gray-900 dark:text-white">
                                                        <div className="flex flex-col">
                                                            {(() => {
                                                                const fullTitle = product.title;
                                                                const bracketIndex = fullTitle?.indexOf('(');

                                                                if (bracketIndex !== -1) {
                                                                    const mainTitle = fullTitle.substring(0, bracketIndex).trim();
                                                                    const bracketText = fullTitle.substring(bracketIndex).trim();
                                                                    return (
                                                                        <div className="max-w-[150px] sm:max-w-xs">
                                                                            <div className="truncate" title={mainTitle}>{mainTitle}</div>
                                                                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate" title={bracketText}>{bracketText}</div>
                                                                        </div>
                                                                    );
                                                                }
                                                                return (
                                                                    <div className="max-w-[150px] sm:max-w-xs truncate" title={fullTitle}>
                                                                        {fullTitle}
                                                                    </div>
                                                                );
                                                            })()}
                                                            {product.useTimeLimit && (
                                                                <div className={`mt-1 text-[10px] font-black uppercase tracking-wider ${isProductScheduled(product) ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                                                    <span className="flex items-center gap-1">
                                                                        <Clock size={10} />
                                                                        <span>{t('TIMED')}</span>
                                                                    </span>
                                                                    <span className="opacity-70 whitespace-nowrap block font-normal normal-case tracking-normal">{formatTime12h(product.openingTime)} - {formatTime12h(product.closingTime)}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 font-medium text-gray-900 dark:text-white">
                                                        {(() => {
                                                            const fullCat = t(product.category);
                                                            const bracketIndex = fullCat?.indexOf('(');
                                                            let mainCat = fullCat;
                                                            let bracketText = '';

                                                            if (bracketIndex !== -1) {
                                                                mainCat = fullCat.substring(0, bracketIndex).trim();
                                                                bracketText = fullCat.substring(bracketIndex).trim();
                                                            }

                                                            return (
                                                                <div className="flex flex-col max-w-[150px]">
                                                                    <span className="text-sm truncate" title={mainCat}>{mainCat}</span>
                                                                    {bracketText && (
                                                                        <span className="text-xs text-gray-500 dark:text-gray-400 truncate" title={bracketText}>{bracketText}</span>
                                                                    )}
                                                                    {selectedStore?.id !== 'none' && product.subcategory && Array.isArray(product.subcategory) && product.subcategory.length > 0 && (
                                                                        <span className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5" title={product.subcategory.join(', ')}>
                                                                            {product.subcategory.join(', ')}
                                                                        </span>
                                                                    )}
                                                                    {selectedStore?.id !== 'none' && product.subcategory && typeof product.subcategory === 'string' && (
                                                                        <span className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5" title={product.subcategory}>
                                                                            {product.subcategory}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            );
                                                        })()}
                                                    </td>
                                                    <td className="p-4 font-medium text-gray-900 dark:text-white">₹{product.price}</td>
                                                    <td className="p-4">
                                                        <button
                                                                onClick={async () => {
                                                                    if (isStoreAdmin) return;
                                                                    const currentGold = product.isGold || false;
                                                                    const productId = product._id || product.id;

                                                                    // Optimistic update
                                                                    queryClient.setQueryData(['products'], (old) => {
                                                                        const oldData = Array.isArray(old) ? old : (old?.data || []);
                                                                        return oldData.map(p =>
                                                                            (p._id || p.id) === productId
                                                                                ? { ...p, isGold: !currentGold }
                                                                                : p
                                                                        );
                                                                    });

                                                                    try {
                                                                        await updateProduct({
                                                                            id: productId,
                                                                            data: { ...product, isGold: !currentGold }
                                                                        });
                                                                    } catch (error) {
                                                                        // Rollback
                                                                        queryClient.setQueryData(['products'], (old) => {
                                                                            const oldData = Array.isArray(old) ? old : (old?.data || []);
                                                                            return oldData.map(p =>
                                                                                (p._id || p.id) === productId
                                                                                    ? { ...p, isGold: currentGold }
                                                                                    : p
                                                                        );
                                                                        });
                                                                        console.error('Failed to toggle gold status:', error);
                                                                        alert(t('Failed to update status'));
                                                                    }
                                                                }}
                                                                disabled={isStoreAdmin}
                                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 ${product.isGold ? 'bg-yellow-400' : 'bg-gray-200 dark:bg-gray-600'} ${isStoreAdmin ? 'opacity-70 cursor-not-allowed' : ''}`}
                                                                title={isStoreAdmin ? (product.isGold ? t('Free Delivery Product') : t('Standard Product')) : (product.isGold ? t('Disable Free Delivery') : t('Enable Free Delivery'))}
                                                            >
                                                                <span
                                                                    className={`${product.isGold ? 'translate-x-6' : 'translate-x-1'
                                                                        } inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out`}
                                                                />
                                                            </button>
                                                        </td>
                                                    <td className="p-4">
                                                        <button
                                                            onClick={async () => {
                                                                const currentStatus = product.isAvailable !== false;
                                                                const productId = product._id || product.id;

                                                                // Optimistic update - instant UI response
                                                                queryClient.setQueryData(['products'], (old) => {
                                                                    const oldData = Array.isArray(old) ? old : (old?.data || []);
                                                                    return oldData.map(p =>
                                                                        (p._id || p.id) === productId
                                                                            ? { ...p, isAvailable: !currentStatus }
                                                                            : p
                                                                    );
                                                                });

                                                                try {
                                                                    await updateProduct({
                                                                        id: productId,
                                                                        data: { ...product, isAvailable: !currentStatus }
                                                                    });
                                                                } catch (error) {
                                                                    // Rollback on error
                                                                    queryClient.setQueryData(['products'], (old) => {
                                                                        const oldData = Array.isArray(old) ? old : (old?.data || []);
                                                                        return oldData.map(p =>
                                                                            (p._id || p.id) === productId
                                                                                ? { ...p, isAvailable: currentStatus }
                                                                                : p
                                                                        );
                                                                    });
                                                                    console.error('Failed to toggle availability:', error);
                                                                    alert(t('Failed to update status'));
                                                                }
                                                            }}
                                                            className={`p-2 rounded-xl transition-all active:scale-90 flex items-center gap-1.5 text-xs font-semibold ${
                                                                product.isAvailable === false
                                                                    ? 'bg-red-50 dark:bg-red-900/20 text-red-500'
                                                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 hover:text-gray-700'
                                                            }`}
                                                            title={product.isAvailable === false ? t('Unhide Product') : t('Hide Product')}
                                                        >
                                                            {product.isAvailable === false ? <EyeOff size={18} /> : <Eye size={18} />}
                                                            <span>{product.isAvailable === false ? t('Hidden') : t('Hide')}</span>
                                                        </button>
                                                        {!isProductScheduled(product) && product.isAvailable !== false && (
                                                            <div className="mt-1 text-[9px] font-black uppercase text-amber-500 tracking-tighter text-center leading-none">
                                                                {t('Auto Off')}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex gap-3 justify-end items-center">
                                                            <button
                                                                onClick={() => handleDuplicateProduct(product)}
                                                                className="p-2 text-[#2E5A2E] hover:bg-[#E8F5E9] dark:hover:bg-[#2E5A2E]/20 rounded-lg transition-colors"
                                                                title={t('Duplicate Product')}
                                                            >
                                                                <Copy size={20} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleEditProduct(product)}
                                                                className="p-2 text-[#2E5A2E] hover:bg-[#E8F5E9] dark:hover:bg-[#2E5A2E]/20 rounded-lg transition-colors"
                                                            >
                                                                <Edit2 size={20} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteProduct(product._id || product.id)}
                                                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                            >
                                                                <Trash2 size={20} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </SortableProductRow>
                                            ))}
                                        </SortableContext>
                                        {products.filter(p => {
                                            const pStoreId = p.storeId?._id || p.storeId;
                                            const targetId = selectedStore._id || selectedStore.id;
                                            return targetId === 'none' 
                                                ? (!pStoreId || pStoreId === 'none') 
                                                : (pStoreId == targetId || String(pStoreId) === String(targetId));
                                        }).length === 0 && (
                                                <tr>
                                                    <td colSpan="4" className="p-8 text-center text-gray-500 dark:text-gray-400">
                                                        {t('No products found in this store. Add one to get started!')}
                                                    </td>
                                                </tr>
                                            )}
                                    </tbody>
                                </table>
                            </DndContext>
                        </div>
                    </div>
                </div>
            )}

            {view === 'addProductToStore' && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <form onSubmit={handleProductSubmit} className="space-y-6">
                        {/* Product Form Fields - Similar to ProductManagement but with slider images */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {!isStoreAdmin && (
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('Select Store')}</label>
                                    <select
                                        value={selectedStore?.id === 'none' ? 'none' : (selectedStore?._id || selectedStore?.id || '')}
                                        onChange={(e) => {
                                            if (e.target.value === 'none') {
                                                setSelectedStore({ id: 'none', name: t('General Products') });
                                            } else {
                                                const store = stores.find(s => (s._id || s.id) === e.target.value);
                                                setSelectedStore(store);
                                            }
                                        }}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#2E5A2E] outline-none"
                                        required
                                    >
                                        <option value="">{t('Select Store')}</option>
                                        <option value="none">{t('None (Move to General Products)')}</option>
                                        {stores.map((s) => (
                                            <option key={s._id || s.id} value={s._id || s.id}>
                                                {s.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('Product Title')}</label>
                                <input
                                    type="text"
                                    value={productForm.title}
                                    onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#2E5A2E] outline-none"
                                    placeholder={t('e.g., Wireless Headphones, Fresh Milk')}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Price ($)</label>
                                <input
                                    type="number"
                                    value={productForm.price}
                                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#2E5A2E] outline-none"
                                    placeholder="0.00"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('Mention (e.g., kg, packs)')}</label>
                                <input
                                    type="text"
                                    value={productForm.unit}
                                    onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#2E5A2E] outline-none"
                                    placeholder={t('e.g., 1 kg, 500g, 1 Pack')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('Category')}</label>
                                <select
                                    value={productForm.category}
                                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value, subcategory: [] })}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#2E5A2E] outline-none"
                                    required
                                >
                                    <option value="">{t('Select Category')}</option>
                                    {categories && categories.length > 0 ? (
                                        categories.map((cat) => (
                                            <option key={cat._id || cat.id} value={cat.name}>
                                                {t(cat.name)}
                                            </option>
                                        ))
                                    ) : (
                                        <>
                                            <option value="Electronics">{t('Electronics')}</option>
                                            <option value="Fashion">{t('Fashion')}</option>
                                            <option value="Home">{t('Home')}</option>
                                            <option value="Beauty">{t('Beauty')}</option>
                                        </>
                                    )}
                                </select>
                            </div>

                            {/* Subcategory multi-select */}
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    {t('Subcategories')} ({t('Optional')})
                                </label>
                                <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 min-h-[100px] max-h-48 overflow-y-auto">
                                    {(() => {
                                        const selectedCategoryData = categories.find(cat => cat.name === productForm.category);
                                        if (selectedCategoryData?.subcategories && selectedCategoryData.subcategories.length > 0) {
                                            return (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                                    {selectedCategoryData.subcategories.map((sub, index) => (
                                                        <label key={index} className="flex items-start gap-2.5 cursor-pointer p-2.5 hover:bg-white dark:hover:bg-gray-600/50 rounded-xl transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-500 min-w-0">
                                                            <input
                                                                type="checkbox"
                                                                checked={productForm.subcategory.includes(sub)}
                                                                onChange={(e) => {
                                                                    const checked = e.target.checked;
                                                                    setProductForm(prev => ({
                                                                        ...prev,
                                                                        subcategory: checked
                                                                            ? [...prev.subcategory, sub]
                                                                            : prev.subcategory.filter(s => s !== sub)
                                                                    }));
                                                                }}
                                                                className="w-4 h-4 mt-0.5 text-[#2E5A2E] rounded border-gray-300 focus:ring-[#2E5A2E] flex-shrink-0"
                                                            />
                                                            <span className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm font-medium leading-snug break-words flex-1 min-w-0">{t(sub)}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            );
                                        }
                                        return <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">{t('Select a category to see its subcategories')}</p>;
                                    })()}
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                    {t('Select one or more subcategories for this product')}
                                </p>
                            </div>



                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('Main Image')}</label>
                                <div className="flex items-center gap-4">
                                    {(productForm.image || editingProduct) && (
                                        <img
                                            src={productForm.image || `${API_BASE_URL}/products/${editingProduct?._id || editingProduct?.id}/image`}
                                            onError={(e) => { e.target.style.display = 'none'; }}
                                            alt="Preview"
                                            className="w-16 h-16 rounded-lg object-cover bg-white"
                                        />
                                    )}
                                    <label className="flex-1 cursor-pointer">
                                        <div className="w-full px-4 py-2 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2">
                                            <Upload size={20} />
                                            <span>{uploadingImage ? t('Uploading...') : t('Upload Image')}</span>
                                        </div>
                                        <input type="file" accept="image/*" onChange={(e) => handleProductImageUpload(e, false)} className="hidden" required={!productForm.image && !editingProduct} />
                                    </label>
                                </div>
                            </div>
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('Slider Images (Optional)')}</label>
                                <div className="space-y-4">
                                    <div className="flex flex-wrap gap-4">
                                        {productForm.sliderImages.map((img, idx) => (
                                            <div key={idx} className="relative w-20 h-20 group bg-white rounded-lg">
                                                <img src={img} alt={`Slider ${idx}`} className="w-full h-full rounded-lg object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => removeSliderImage(idx)}
                                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}
                                        <label className="cursor-pointer">
                                            <div className="w-20 h-20 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center justify-center">
                                                <Plus size={24} />
                                            </div>
                                            <input type="file" accept="image/*" multiple onChange={(e) => handleProductImageUpload(e, true)} className="hidden" />
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Product Timing Section */}
                            <div className="col-span-1 md:col-span-2">
                                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-gray-200 dark:bg-gray-600 rounded-lg text-gray-700 dark:text-gray-300">
                                                <Clock size={18} />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-gray-900 dark:text-white">{t('Product Timing')}</h4>
                                                <p className="text-[10px] text-gray-500 dark:text-gray-400 tracking-tight">{t('Schedule when this product appears in the store')}</p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={productForm.useTimeLimit}
                                                onChange={(e) => setProductForm({ ...productForm, useTimeLimit: e.target.checked })}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#2E5A2E]"></div>
                                        </label>
                                    </div>

                                    {productForm.useTimeLimit && (
                                        <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div>
                                                <label className="block text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1.5 ml-1">{t('Opening')}</label>
                                                <input
                                                    type="time"
                                                    value={productForm.openingTime}
                                                    onChange={(e) => setProductForm({ ...productForm, openingTime: e.target.value })}
                                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#2E5A2E] outline-none text-sm"
                                                    required={productForm.useTimeLimit}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1.5 ml-1">{t('Closing')}</label>
                                                <input
                                                    type="time"
                                                    value={productForm.closingTime}
                                                    onChange={(e) => setProductForm({ ...productForm, closingTime: e.target.value })}
                                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#2E5A2E] outline-none text-sm"
                                                    required={productForm.useTimeLimit}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('Description')}</label>
                            <textarea
                                value={productForm.description}
                                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                                rows="4"
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#2E5A2E] outline-none"
                                placeholder={t('Product description...')}
                                required
                            ></textarea>
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={uploadingImage}
                                className={`px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2 ${uploadingImage
                                    ? 'bg-gray-400 cursor-not-allowed text-white'
                                    : 'bg-[#2E5A2E] text-white hover:bg-[#1a3d1a]'
                                    }`}
                            >
                                {uploadingImage ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        <span>{t('Uploading...')}</span>
                                    </>
                                ) : (
                                    <>
                                        <Plus size={20} />
                                        {editingProduct ? t('Update Product') : t('Add Product to Store')}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default StoreManagement;
