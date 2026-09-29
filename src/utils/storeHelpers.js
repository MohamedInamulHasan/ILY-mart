// Helper function to get store name by storeId
// Add this to any component that needs to display store names
// Usage: const storeName = getStoreName(item.storeId, stores);

export const getStoreName = (storeId, stores) => {
    // Handle missing parameters
    if (!storeId) {
        // console.warn('getStoreName: storeId is missing'); // Remove warning to reduce noise
        return 'Unknown Store';
    }

    // Check if storeId is likely a populated object (has name field)
    if (typeof storeId === 'object' && storeId.name) {
        return storeId.name;
    }

    // Check if storeId is an object but maybe just has _id (unlikely with select: 'name' but possible)
    const idToSearch = (typeof storeId === 'object' && (storeId._id || storeId.id))
        ? (storeId._id || storeId.id)
        : storeId;

    if (!stores || !Array.isArray(stores)) {
        // console.warn('getStoreName: stores array is missing or invalid');
        return 'Unknown Store';
    }

    // Find the store by ID
    const store = stores.find(s => {
        const sId = s._id || s.id;
        return sId === idToSearch || String(sId) === String(idToSearch);
    });

    if (!store) {
        // console.warn(`getStoreName: Store not found for storeId: ${idToSearch}`);
        return 'Unknown Store';
    }

    return store.name || 'Unknown Store';
};

// Parse time string (HH:MM) to minutes since midnight
export const parseTime = (timeString) => {
    if (!timeString) return null;
    const [hours, minutes] = timeString.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return null;
    return hours * 60 + minutes;
};

// Convert HH:mm to 12-hour format (e.g., "13:00" -> "1:00 PM")
export const formatTime12h = (time24) => {
    if (!time24) return '';
    try {
        const [hours, minutes] = time24.split(':');
        const h = parseInt(hours);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${h12}:${minutes} ${ampm}`;
    } catch (e) {
        return time24;
    }
};

// Convert HH:mm to 12-hour range format (e.g., "13:00" -> "1pm - 2pm")
export const formatDeliveryRange = (time24) => {
    if (!time24) return '';
    try {
        const [hours, minutes] = time24.split(':');
        const hStart = parseInt(hours);
        const hEnd = (hStart + 1) % 24;

        const formatShortTime = (h, m) => {
            const ampmStr = h >= 12 ? ' PM' : ' AM';
            const h12 = h % 12 || 12;
            // Only show minutes if they are not 00
            const mStr = parseInt(m) === 0 ? '' : `:${m}`;
            return `${h12}${mStr}${ampmStr}`;
        };

        return `${formatShortTime(hStart, minutes)} - ${formatShortTime(hEnd, minutes)}`;
    } catch (e) {
        return time24;
    }
};

// Convert Date or ISO string to 12-hour range format (e.g., ISO -> "1pm - 2pm")
export const formatDeliveryRangeFromDate = (date) => {
    if (!date) return '';
    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return String(date);
        const hStart = d.getHours();
        const mStart = d.getMinutes().toString().padStart(2, '0');
        const hEnd = (hStart + 1) % 24;

        const formatShortTime = (h, m) => {
            const ampmStr = h >= 12 ? ' PM' : ' AM';
            const h12 = h % 12 || 12;
            const mStr = parseInt(m) === 0 ? '' : `:${m}`;
            return `${h12}${mStr}${ampmStr}`;
        };

        return `${formatShortTime(hStart, mStart)} - ${formatShortTime(hEnd, mStart)}`;
    } catch (e) {
        return String(date || '');
    }
};

// Get current time in minutes since midnight
export const getCurrentTimeInMinutes = () => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
};

// Check if a store is currently open based on opening and closing times
export const isStoreOpen = (store) => {
    // If no store is provided (e.g., platform-direct products), assume it's open
    if (!store) return true;

    // Manual override: if store is manually closed, return false
    if (store.isManuallyClosed) return false;

    // If timingType is permanent, the store is only closed if manually closed (handled above)
    if (store.timingType === 'permanent') {
        return true;
    }

    // If store has openingTime and closingTime, use those
    if (store.openingTime && store.closingTime) {
        const currentMinutes = getCurrentTimeInMinutes();
        const openingMinutes = parseTime(store.openingTime);
        const closingMinutes = parseTime(store.closingTime);

        if (openingMinutes === null || closingMinutes === null) {
            return true; // If parsing fails, assume open
        }

        // Handle cases where closing time is after midnight (e.g., 02:00)
        if (closingMinutes < openingMinutes) {
            // Store is open past midnight
            return currentMinutes >= openingMinutes || currentMinutes < closingMinutes;
        } else {
            // Normal case
            return currentMinutes >= openingMinutes && currentMinutes < closingMinutes;
        }
    }

    // Fallback: if only timing string exists, try to parse it
    if (store.timing) {
        // Try to extract times from format like "9:00 AM - 9:00 PM"
        const match = store.timing.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
        if (match) {
            let openHour = parseInt(match[1]);
            const openMin = parseInt(match[2]);
            const openPeriod = match[3];
            let closeHour = parseInt(match[4]);
            const closeMin = parseInt(match[5]);
            const closePeriod = match[6];

            // Convert to 24-hour format
            if (openPeriod && openPeriod.toUpperCase() === 'PM' && openHour !== 12) {
                openHour += 12;
            } else if (openPeriod && openPeriod.toUpperCase() === 'AM' && openHour === 12) {
                openHour = 0;
            }

            if (closePeriod && closePeriod.toUpperCase() === 'PM' && closeHour !== 12) {
                closeHour += 12;
            } else if (closePeriod && closePeriod.toUpperCase() === 'AM' && closeHour === 12) {
                closeHour = 0;
            }

            const currentMinutes = getCurrentTimeInMinutes();
            const openingMinutes = openHour * 60 + openMin;
            const closingMinutes = closeHour * 60 + closeMin;

            if (closingMinutes < openingMinutes) {
                return currentMinutes >= openingMinutes || currentMinutes < closingMinutes;
            } else {
                return currentMinutes >= openingMinutes && currentMinutes < closingMinutes;
            }
        }
    }

    // If we can't determine, assume the store is open
    return true;
};

// Check if a product is currently scheduled to be available
export const isProductScheduled = (product) => {
    if (!product || !product.useTimeLimit) return true;
    
    const openingMinutes = parseTime(product.openingTime || '00:00');
    const closingMinutes = parseTime(product.closingTime || '23:59');
    const currentMinutes = getCurrentTimeInMinutes();

    if (openingMinutes === null || closingMinutes === null) return true;

    if (openingMinutes <= closingMinutes) {
        return currentMinutes >= openingMinutes && currentMinutes < closingMinutes;
    } else {
        return currentMinutes >= openingMinutes || currentMinutes < closingMinutes;
    }
};

// Get the formatted availability label for a timed product
// e.g. "10:00 AM – 2:00 PM"
export const getProductTimeLabel = (product) => {
    if (!product || !product.useTimeLimit) return null;
    const open = formatTime12h(product.openingTime || '00:00');
    const close = formatTime12h(product.closingTime || '23:59');
    return `${open} – ${close}`;
};

// Get the formatted availability label for a timed store
// e.g. "9:00 AM – 9:00 PM"
export const getStoreTimeLabel = (store) => {
    if (!store || store.timingType === 'permanent' || store.isManuallyClosed) return null;
    if (store.openingTime && store.closingTime) {
        return `${formatTime12h(store.openingTime)} – ${formatTime12h(store.closingTime)}`;
    }
    return null;
};

export const calculateDeliveryCharge = (items) => {
    if (!items || items.length === 0) return 0;

    const uniqueStoreIds = new Set();
    items.forEach(item => {
        const storeId = item.storeId?._id || item.storeId;
        if (storeId) {
            uniqueStoreIds.add(storeId.toString());
        }
    });

    const storeCount = uniqueStoreIds.size;

    if (storeCount <= 1) return 20;
    return 20 + (storeCount - 1) * 5;
};
