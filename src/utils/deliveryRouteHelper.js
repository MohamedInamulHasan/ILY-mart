import { useState, useEffect, useCallback } from 'react';
import { getCurrentLocation } from './locationHelpers';

/**
 * Calculate Haversine distance in km between two lat/lon points
 */
export function haversineKm(lat1, lon1, lat2, lon2) {
    if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) return null;
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Parse latitude and longitude from Google Maps URL or coordinate string
 */
export function parseLatLon(url) {
    if (!url) return null;
    if (typeof url === 'object' && typeof url.lat === 'number' && typeof url.lon === 'number') {
        return url;
    }
    const str = String(url).trim();

    // Direct comma coords: "9.6457, 78.6366" or "9.6457,78.6366"
    const rawMatch = str.match(/^([-\d.]+)\s*,\s*([-\d.]+)$/);
    if (rawMatch) {
        const lat = parseFloat(rawMatch[1]);
        const lon = parseFloat(rawMatch[2]);
        if (!isNaN(lat) && !isNaN(lon)) return { lat, lon };
    }

    // ?q=lat,lon or &q=lat,lon or ?query=lat,lon or destination=lat,lon
    const qMatch = str.match(/[?&](?:q|query|destination)=([-\d.]+),([-\d.]+)/);
    if (qMatch) {
        const lat = parseFloat(qMatch[1]);
        const lon = parseFloat(qMatch[2]);
        if (!isNaN(lat) && !isNaN(lon)) return { lat, lon };
    }

    // @lat,lon,17z
    const atMatch = str.match(/@([-\d.]+),([-\d.]+)/);
    if (atMatch) {
        const lat = parseFloat(atMatch[1]);
        const lon = parseFloat(atMatch[2]);
        if (!isNaN(lat) && !isNaN(lon)) return { lat, lon };
    }

    // Path segments: /place/.../lat,lon or /dir/lat,lon
    const dirMatch = str.match(/\/([-\d.]+),([-\d.]+)/);
    if (dirMatch) {
        const lat = parseFloat(dirMatch[1]);
        const lon = parseFloat(dirMatch[2]);
        if (!isNaN(lat) && !isNaN(lon)) return { lat, lon };
    }

    return null;
}

/**
 * Format distance in km or m
 */
export function formatDistance(distKm) {
    if (distKm === null || distKm === undefined || isNaN(distKm)) return null;
    if (distKm < 1) {
        const meters = Math.round(distKm * 1000);
        return `${meters} m`;
    }
    return `${distKm.toFixed(1)} km`;
}

/**
 * React Hook for Driver / Delivery Boy Live Location
 */
let cachedDriverCoords = null;
try {
    const saved = localStorage.getItem('driver_live_coords');
    if (saved) {
        cachedDriverCoords = JSON.parse(saved);
    }
} catch (_) {}

export function useDriverLocation() {
    const [driverCoords, setDriverCoords] = useState(cachedDriverCoords);
    const [isDetecting, setIsDetecting] = useState(!cachedDriverCoords);

    const updateLocation = useCallback(async () => {
        try {
            setIsDetecting(true);
            const res = await getCurrentLocation();
            if (res && res.success && res.latitude && res.longitude) {
                const coords = { lat: res.latitude, lon: res.longitude };
                setDriverCoords(coords);
                cachedDriverCoords = coords;
                try {
                    localStorage.setItem('driver_live_coords', JSON.stringify(coords));
                } catch (_) {}
            }
        } catch (err) {
            console.warn('Driver location detection notice:', err);
        } finally {
            setIsDetecting(false);
        }
    }, []);

    useEffect(() => {
        // Run initial detection
        updateLocation();

        // Optional: watchPosition for background updates when moving
        let watchId = null;
        if (navigator.geolocation && navigator.geolocation.watchPosition) {
            try {
                watchId = navigator.geolocation.watchPosition(
                    (pos) => {
                        if (pos?.coords) {
                            const coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
                            setDriverCoords(coords);
                            cachedDriverCoords = coords;
                            try {
                                localStorage.setItem('driver_live_coords', JSON.stringify(coords));
                            } catch (_) {}
                        }
                    },
                    () => {},
                    { enableHighAccuracy: true, maximumAge: 30000, timeout: 20000 }
                );
            } catch (_) {}
        }

        return () => {
            if (watchId !== null && navigator.geolocation) {
                navigator.geolocation.clearWatch(watchId);
            }
        };
    }, [updateLocation]);

    return {
        driverCoords,
        isDetecting,
        refreshLocation: updateLocation
    };
}

/**
 * Nearest-Neighbor Shortest Path Route Optimization
 * Flow: Driver Location -> Nearest Store 1 -> Nearest Store 2 -> ... -> Customer Drop Location
 */
export function optimizeDeliveryRoute(driverCoords, order, stores = []) {
    if (!order) {
        return {
            sortedStores: [],
            customer: null,
            totalDistanceKm: null,
            formattedTotalDistance: null,
            hasMultipleStores: false
        };
    }

    // 1. Collect unique stores in order items
    const orderItems = order.items || [];
    const storeMap = new Map();

    orderItems.forEach((item) => {
        const sid = item.storeId?._id || item.storeId || item.store?.id || item.store?._id || 'store_default';
        const sidStr = String(sid);

        if (!storeMap.has(sidStr)) {
            // Find full store object from stores query
            const foundStore = stores.find(
                (s) => String(s._id || s.id) === sidStr || (s.name && item.storeName && s.name.toLowerCase() === item.storeName.toLowerCase())
            );

            const storeName = item.storeName || item.storeId?.name || foundStore?.name || 'Local Store';
            const locationUrl = foundStore?.location || item.storeId?.location || item.storeLocation || null;
            const coords = parseLatLon(locationUrl);

            storeMap.set(sidStr, {
                id: sidStr,
                name: storeName,
                location: locationUrl,
                coords,
                storeObj: foundStore
            });
        }
    });

    const uniqueStores = Array.from(storeMap.values());

    // 2. Customer Drop Location
    const customerLocation = order.shippingAddress?.location || order.location || null;
    const customerCoords = parseLatLon(customerLocation);
    const customerName = order.shippingAddress?.name || order.customerName || 'Customer';
    const street = order.shippingAddress?.street || order.shippingAddress?.address || '';
    const city = order.shippingAddress?.city || 'Ilayangudi';
    const customerAddress = street ? `${street}, ${city}` : city;

    // 3. Shortest Path Nearest-Neighbor Sort
    const withCoords = uniqueStores.filter((s) => Boolean(s.coords));
    const withoutCoords = uniqueStores.filter((s) => !s.coords);

    const sortedStores = [];
    let currentPoint = driverCoords ? { ...driverCoords } : null;
    let totalDist = 0;
    let hasValidDistances = false;

    const remaining = [...withCoords];

    while (remaining.length > 0) {
        if (!currentPoint) {
            // If driver location is not yet known, keep natural order or distance to customer
            const first = remaining.shift();
            sortedStores.push({
                ...first,
                distanceFromPrev: null,
                formattedDistance: null,
                stepNumber: sortedStores.length + 1
            });
            continue;
        }

        // Find store nearest to currentPoint
        let bestIdx = 0;
        let bestDist = Infinity;
        for (let i = 0; i < remaining.length; i++) {
            const d = haversineKm(
                currentPoint.lat,
                currentPoint.lon,
                remaining[i].coords.lat,
                remaining[i].coords.lon
            );
            if (d !== null && d < bestDist) {
                bestDist = d;
                bestIdx = i;
            }
        }

        const picked = remaining[bestIdx];
        if (bestDist !== Infinity && bestDist !== null) {
            totalDist += bestDist;
            hasValidDistances = true;
        }

        sortedStores.push({
            ...picked,
            distanceFromPrev: bestDist !== Infinity ? bestDist : null,
            formattedDistance: formatDistance(bestDist !== Infinity ? bestDist : null),
            stepNumber: sortedStores.length + 1
        });

        currentPoint = picked.coords;
        remaining.splice(bestIdx, 1);
    }

    // Append stores without GPS
    withoutCoords.forEach((s) => {
        sortedStores.push({
            ...s,
            distanceFromPrev: null,
            formattedDistance: null,
            stepNumber: sortedStores.length + 1
        });
    });

    // Final leg: Last store -> Customer
    let dropDist = null;
    if (customerCoords && currentPoint) {
        dropDist = haversineKm(currentPoint.lat, currentPoint.lon, customerCoords.lat, customerCoords.lon);
        if (dropDist !== null) {
            totalDist += dropDist;
            hasValidDistances = true;
        }
    }

    return {
        driverCoords,
        sortedStores,
        customer: {
            name: customerName,
            address: customerAddress,
            location: customerLocation,
            coords: customerCoords,
            distanceFromLastStore: dropDist,
            formattedDistance: formatDistance(dropDist)
        },
        totalDistanceKm: hasValidDistances ? totalDist : null,
        formattedTotalDistance: formatDistance(hasValidDistances ? totalDist : null),
        hasMultipleStores: sortedStores.length > 1
    };
}
