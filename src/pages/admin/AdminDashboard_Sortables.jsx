import React, { createContext, useContext } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Context to pass drag listeners to a specific handle
export const SortableItemContext = createContext({
    attributes: {},
    listeners: undefined,
    ref: undefined,
});

export const DragHandle = ({ children, className = '' }) => {
    const { attributes, listeners, ref } = useContext(SortableItemContext);

    return (
        <div
            ref={ref}
            {...attributes}
            {...listeners}
            className={`touch-none cursor-grab active:cursor-grabbing ${className}`}
            style={{ touchAction: 'none' }} // Critical for preventing scroll on the handle
        >
            {children}
        </div>
    );
};

// Sortable Ads Card Component
export const SortableAdCard = ({ ad, children }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        setActivatorNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: ad.id || ad._id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        // touchAction: 'none', // REMOVED to allow scrolling on the card content
    };

    return (
        <SortableItemContext.Provider value={{ attributes, listeners, ref: setActivatorNodeRef }}>
            <div ref={setNodeRef} style={style} className="h-full relative group">
                {children}
            </div>
        </SortableItemContext.Provider>
    );
};

// Sortable Store Card Component
export const SortableStoreCard = ({ store, children }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        setActivatorNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: store.id || store._id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <SortableItemContext.Provider value={{ attributes, listeners, ref: setActivatorNodeRef }}>
            <div ref={setNodeRef} style={style} className="h-full relative group">
                {children}
            </div>
        </SortableItemContext.Provider>
    );
};

// Sortable Service Card Component
export const SortableServiceCard = ({ service, children }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        setActivatorNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: service.id || service._id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <SortableItemContext.Provider value={{ attributes, listeners, ref: setActivatorNodeRef }}>
            <div ref={setNodeRef} style={style} className="h-full relative group">
                {children}
            </div>
        </SortableItemContext.Provider>
    );
};

// Sortable Product Row Component
export const SortableProductRow = ({ product, children }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        setActivatorNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: product.id || product._id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 999 : 'auto',
        position: 'relative',
        // touchAction: 'none', // REMOVED so user can scroll the table
    };

    return (
        <SortableItemContext.Provider value={{ attributes, listeners, ref: setActivatorNodeRef }}>
            <tr ref={setNodeRef} style={style} className={`${isDragging ? 'bg-[#E8F5E9] dark:bg-[#2E5A2E]/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'} transition-colors`}>
                {children}
            </tr>
        </SortableItemContext.Provider>
    );
};

// Sortable Service Item Row Component
export const SortableServiceItemRow = ({ item, children }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        setActivatorNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: item.id || item._id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 999 : 'auto',
        position: 'relative',
    };

    return (
        <SortableItemContext.Provider value={{ attributes, listeners, ref: setActivatorNodeRef }}>
            <tr ref={setNodeRef} style={style} className={`${isDragging ? 'bg-[#E8F5E9] dark:bg-[#2E5A2E]/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'} transition-colors`}>
                {children}
            </tr>
        </SortableItemContext.Provider>
    );
};
// Sortable Subcategory Item Component
export const SortableSubcategoryItem = ({ id, children }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        setActivatorNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 999 : 'auto',
        position: 'relative',
    };

    return (
        <SortableItemContext.Provider value={{ attributes, listeners, ref: setActivatorNodeRef }}>
            <div ref={setNodeRef} style={style} className="transition-all">
                {children}
            </div>
        </SortableItemContext.Provider>
    );
};
