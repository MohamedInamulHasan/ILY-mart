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

// Convert HH:mm or period|HH:mm to 12-hour range format (e.g., "13:00" -> "1 PM - 2 PM", "today|11:00" -> "Today, 11 AM - 12 PM")
export const formatDeliveryRange = (time24, language = 'en') => {
    if (!time24 || String(time24).trim().toLowerCase() === 'null' || String(time24).trim().toLowerCase() === 'undefined') return '';
    try {
        let rawTime = time24;
        let prefix = '';

        if (typeof time24 === 'string' && time24.includes('|')) {
            const parts = time24.split('|');
            const period = parts[0].trim().toLowerCase();
            rawTime = parts[1];
            if (period === 'today') {
                prefix = language === 'ta' ? 'இன்று, ' : 'Today, ';
            } else if (period === 'tomorrow') {
                prefix = language === 'ta' ? 'நாளை, ' : 'Tomorrow, ';
            }
        }

        const [hours, minutes] = String(rawTime).split(':');
        const hStart = parseInt(hours, 10);
        if (isNaN(hStart)) {
            const trimmed = String(time24).trim();
            if (trimmed.toLowerCase() === 'null' || trimmed.toLowerCase() === 'undefined') return '';
            return trimmed;
        }
        const hEnd = (hStart + 1) % 24;

        const formatShortTime = (h, m) => {
            const ampmStr = h >= 12 ? ' PM' : ' AM';
            const h12 = h % 12 || 12;
            const mStr = parseInt(m, 10) === 0 ? '' : `:${m}`;
            return `${h12}${mStr}${ampmStr}`;
        };

        const range = `${formatShortTime(hStart, minutes)} - ${formatShortTime(hEnd, minutes)}`;
        return `${prefix}${range}`;
    } catch (e) {
        return '';
    }
};

// Convert Date or ISO string or period|HH:mm string to 12-hour range format
export const formatDeliveryRangeFromDate = (date, language = 'en') => {
    if (!date || String(date).trim().toLowerCase() === 'null' || String(date).trim().toLowerCase() === 'undefined') return '';
    try {
        if (typeof date === 'string' && date.includes('|')) {
            return formatDeliveryRange(date, language);
        }

        const d = new Date(date);
        if (isNaN(d.getTime())) return formatDeliveryRange(String(date), language);

        const now = new Date();
        const isToday = d.toDateString() === now.toDateString();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const isTomorrow = d.toDateString() === tomorrow.toDateString();

        const hStart = d.getHours();
        const mStart = d.getMinutes().toString().padStart(2, '0');
        const hEnd = (hStart + 1) % 24;

        const formatShortTime = (h, m) => {
            const ampmStr = h >= 12 ? ' PM' : ' AM';
            const h12 = h % 12 || 12;
            const mStr = parseInt(m, 10) === 0 ? '' : `:${m}`;
            return `${h12}${mStr}${ampmStr}`;
        };

        const timeStr = `${formatShortTime(hStart, mStart)} - ${formatShortTime(hEnd, mStart)}`;
        if (isTomorrow) {
            return language === 'ta' ? `நாளை, ${timeStr}` : `Tomorrow, ${timeStr}`;
        }
        if (isToday) {
            return language === 'ta' ? `இன்று, ${timeStr}` : `Today, ${timeStr}`;
        }
        return timeStr;
    } catch (e) {
        return '';
    }
};

/**
 * Calculates the next 4 real available delivery schedule timing slots.
 * Rules:
 * - Uses configured delivery times if available, or default operating hours (09:00 - 21:00).
 * - Slots are sorted chronologically.
 * - For today: a slot HH:mm is available if current time has at least 30 mins remaining
 *   in the delivery window (window ends at slot + 60 mins -> currentMinutes <= slotStartMinutes + 30).
 * - If today has fewer than 4 slots remaining, the remaining slots needed to make 4
 *   seamlessly roll over to Tomorrow starting from the first configured morning slot.
 * - If all slots for today have passed (or it's late night), returns the first 4 slots for Tomorrow.
 * - Always returns exactly 4 available schedule timings with 'today|' or 'tomorrow|' prefix.
 */
export const getAvailableDeliverySlots = (configuredTimes, period = 'today') => {
    const defaultWorkingHours = [
        '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
        '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'
    ];

    let rawTimes = [];
    if (Array.isArray(configuredTimes) && configuredTimes.length > 0) {
        rawTimes = [...configuredTimes];
    } else {
        rawTimes = defaultWorkingHours;
    }

    // Sort chronologically
    rawTimes.sort((a, b) => {
        const cleanA = a.includes('|') ? a.split('|')[1] : a;
        const cleanB = b.includes('|') ? b.split('|')[1] : b;
        const [hA, mA] = cleanA.split(':').map(Number);
        const [hB, mB] = cleanB.split(':').map(Number);
        return (hA * 60 + (mA || 0)) - (hB * 60 + (mB || 0));
    });

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // Today's available slots:
    // Slot window is 60 minutes long. A slot is available if there is at least 30 minutes left before window ends
    // i.e., currentMinutes <= slotStartMinutes + 30
    const todaySlots = rawTimes.filter(slot => {
        const cleanSlot = slot.includes('|') ? slot.split('|')[1] : slot;
        const [h, m] = cleanSlot.split(':').map(Number);
        const slotStartMinutes = h * 60 + (m || 0);
        return currentMinutes <= slotStartMinutes + 30;
    });

    const result = [];

    // If caller specifically requested 'tomorrow'
    if (period === 'tomorrow') {
        rawTimes.slice(0, 4).forEach(slot => {
            const cleanSlot = slot.includes('|') ? slot.split('|')[1] : slot;
            result.push(`tomorrow|${cleanSlot}`);
        });
        return result;
    }

    // Otherwise, calculate the next 4 available slots starting from today
    todaySlots.slice(0, 4).forEach(slot => {
        const cleanSlot = slot.includes('|') ? slot.split('|')[1] : slot;
        result.push(`today|${cleanSlot}`);
    });

    // If today has fewer than 4 slots left, fill remainder with tomorrow's slots
    if (result.length < 4) {
        const needed = 4 - result.length;
        rawTimes.slice(0, needed).forEach(slot => {
            const cleanSlot = slot.includes('|') ? slot.split('|')[1] : slot;
            result.push(`tomorrow|${cleanSlot}`);
        });
    }

    return result.slice(0, 4);
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
    try {
        if (!items || !Array.isArray(items) || items.length === 0) return 0;

        const uniqueStoreIds = new Set();
        items.forEach(item => {
            if (!item) return;
            const rawStoreId = item.storeId?._id || item.storeId || item.product?.storeId?._id || item.product?.storeId;
            if (rawStoreId) {
                const str = typeof rawStoreId === 'object' ? (rawStoreId._id || String(rawStoreId)) : String(rawStoreId);
                uniqueStoreIds.add(str);
            }
        });

        const storeCount = uniqueStoreIds.size;
        if (storeCount <= 1) return 20;
        return 20 + (storeCount - 1) * 10;
    } catch (err) {
        console.warn('calculateDeliveryCharge fallback error:', err);
        return 20;
    }
};

// Check if a store is active and not hidden
export const isStoreActiveAndVisible = (store) => {
    if (!store) return false;
    if (store.isActive === false) return false;
    if (store.isHidden === true) return false;
    if (store.isHomeHidden === true) return false;
    return true;
};

// Check if a product belongs to an active, non-hidden store
export const isProductFromActiveStore = (product, stores = []) => {
    if (!product) return false;
    // Check product's own availability/hidden flags
    if (product.isAvailable === false || product.isHidden === true) return false;

    // Check populated storeId object if available
    if (product.storeId && typeof product.storeId === 'object') {
        if (!isStoreActiveAndVisible(product.storeId)) return false;
    }

    // Check against stores array if available
    const storeId = String(product.storeId?._id || product.storeId || '');
    if (storeId && Array.isArray(stores) && stores.length > 0) {
        const found = stores.find(s => String(s._id || s.id) === storeId);
        // If the store is explicitly known in stores array and is hidden/inactive:
        if (found && !isStoreActiveAndVisible(found)) return false;
        // If stores list has active stores and this store is missing from active stores:
        const activeStores = stores.filter(isStoreActiveAndVisible);
        if (activeStores.length > 0 && !activeStores.some(s => String(s._id || s.id) === storeId)) {
            return false;
        }
    }

    return true;
};
