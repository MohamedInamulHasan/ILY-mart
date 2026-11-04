/**
 * Location and Accurate GPS Geocoding Helper
 * 
 * Strict Standards:
 * - Uses real hardware/device GPS with enableHighAccuracy: true
 * - NEVER uses IP-based geolocation as a substitute for real GPS
 * - NEVER invents, hardcodes, or mocks address/street names
 * - Extracts and returns structured address components:
 *   1. Exact street name
 *   2. Building / House number
 *   3. Area / Locality
 *   4. City
 *   5. District
 *   6. State
 *   7. PIN code
 *   8. Country
 */

export const checkLocationPermission = async () => {
    const isNative = window.Capacitor?.isNativePlatform?.() ?? false;

    if (isNative) {
        try {
            const { Geolocation } = await import('@capacitor/geolocation');
            const permission = await Geolocation.checkPermissions();

            return {
                isEnabled: permission.location === 'granted',
                status: permission.location,
                isNative: true
            };
        } catch (error) {
            console.error('Error checking native location permission:', error);
            return { isEnabled: false, status: 'error', error: error.message, isNative: true };
        }
    } else {
        if (!navigator.geolocation) {
            return { isEnabled: false, status: 'unsupported', isNative: false };
        }
        return { isEnabled: true, status: 'available', isNative: false };
    }
};

export const requestLocationPermission = async () => {
    const isNative = window.Capacitor?.isNativePlatform?.() ?? false;

    if (isNative) {
        try {
            const { Geolocation } = await import('@capacitor/geolocation');
            const permission = await Geolocation.requestPermissions();
            return {
                granted: permission.location === 'granted',
                status: permission.location
            };
        } catch (error) {
            console.error('Error requesting location permission:', error);
            return { granted: false, status: 'error', error: error.message };
        }
    }

    return { granted: true, status: 'browser' };
};

/**
 * Reverse geocodes coordinates into real structured address components.
 * Prioritizes high-precision Nominatim & BigDataCloud geocoding without hardcoding.
 */
export const reverseGeocode = async (latitude, longitude) => {
    if (!latitude || !longitude) return null;

    // Helper to format clean full address from components
    const formatAddress = (parts) => {
        return parts.filter(p => Boolean(p && typeof p === 'string' && p.trim())).map(p => p.trim()).join(', ');
    };

    // 1. Primary: Nominatim OpenStreetMap (High accuracy address details)
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4500);

        const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            {
                headers: {
                    'User-Agent': 'ILYMart-App/2.0 (contact@ilymart.com)',
                    'Accept-Language': 'en'
                },
                signal: controller.signal
            }
        );
        clearTimeout(timeoutId);

        if (res.ok) {
            const data = await res.json();
            if (data && data.address) {
                const addr = data.address;

                const houseNumber = (addr.house_number || addr.building || addr.flats || addr.office || '').trim();
                const rawRoad = (addr.road || addr.street || addr.pedestrian || addr.footway || addr.path || addr.highway || addr.lane || '').trim();
                const area = (addr.suburb || addr.neighbourhood || addr.residential || addr.quarter || addr.subdivision || addr.colony || addr.sector || addr.hamlet || addr.village || '').trim();
                const city = (addr.city || addr.town || addr.municipality || addr.city_district || addr.county || '').trim();
                const district = (addr.state_district || addr.county || '').trim();
                const state = (addr.state || '').trim();
                const zip = (addr.postcode || '').trim();
                const country = (addr.country || 'India').trim();

                // Build clean street representation
                let street = [houseNumber, rawRoad].filter(Boolean).join(' ').trim();
                if (!street && area) {
                    street = area;
                } else if (street && area && !street.toLowerCase().includes(area.toLowerCase())) {
                    street = `${street}, ${area}`;
                }

                const fullAddress = formatAddress([
                    street,
                    city,
                    district && district.toLowerCase() !== city.toLowerCase() ? district : '',
                    state,
                    zip,
                    country
                ]);

                return {
                    street: street || '', // Empty if unavailable, customer can type manually
                    houseNumber: houseNumber || '',
                    area: area || '',
                    city: city || '',
                    district: district || '',
                    state: state || '',
                    zip: zip || '',
                    country: country || 'India',
                    fullAddress: fullAddress || data.display_name,
                    isStreetAvailable: Boolean(street)
                };
            }
        }
    } catch (err) {
        console.warn('Nominatim reverse geocode error:', err);
    }

    // 2. Secondary Fallback: BigDataCloud Reverse Geocoding
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
            { signal: controller.signal }
        );
        clearTimeout(timeoutId);

        if (res.ok) {
            const data = await res.json();
            const city = (data.city || data.locality || '').trim();
            const district = (data.localityInfo?.administrative?.find(a => a.adminLevel === 6)?.name || '').trim();
            const state = (data.principalSubdivision || '').trim();
            const zip = (data.postcode || '').trim();
            const country = (data.countryName || 'India').trim();

            const adminArea = (data.localityInfo?.administrative?.find(a => a.adminLevel === 8 || a.adminLevel === 7)?.name || '').trim();
            const street = adminArea && adminArea.toLowerCase() !== city.toLowerCase() ? adminArea : '';

            const fullAddress = formatAddress([street, city, district, state, zip, country]);

            return {
                street: street || '',
                houseNumber: '',
                area: adminArea || '',
                city: city || '',
                district: district || '',
                state: state || '',
                zip: zip || '',
                country: country || 'India',
                fullAddress,
                isStreetAvailable: Boolean(street)
            };
        }
    } catch (err) {
        console.warn('BigDataCloud reverse geocode error:', err);
    }

    // No geocoder succeeded, return raw coordinates structure
    return {
        street: '',
        houseNumber: '',
        area: '',
        city: '',
        district: '',
        state: '',
        zip: '',
        country: 'India',
        fullAddress: '',
        isStreetAvailable: false
    };
};

/**
 * Robust GPS Geolocation retrieval
 * Strictly uses hardware GPS (enableHighAccuracy: true)
 * NEVER replaces GPS with distant cellular IP addresses
 */
export const getCurrentLocation = async () => {
    const isNative = window.Capacitor?.isNativePlatform?.() ?? false;

    const buildResult = async (lat, lon, extra = {}) => {
        let addressDetails = null;
        try {
            addressDetails = await reverseGeocode(lat, lon);
        } catch (e) {
            console.warn('Reverse geocoding error:', e);
        }

        return {
            latitude: lat,
            longitude: lon,
            mapsLink: `https://www.google.com/maps?q=${lat},${lon}`,
            success: true,
            ...extra,
            addressDetails: addressDetails || {
                street: '',
                city: '',
                zip: '',
                fullAddress: `${lat.toFixed(6)}, ${lon.toFixed(6)}`
            }
        };
    };

    try {
        if (isNative) {
            const { Geolocation } = await import('@capacitor/geolocation');

            // 1. Permission check
            let check;
            try {
                check = await Geolocation.checkPermissions();
            } catch (pError) {
                check = { location: 'prompt' };
            }

            if (check.location !== 'granted') {
                try {
                    check = await Geolocation.requestPermissions();
                } catch (rError) {
                    console.warn('Native permission request notice:', rError);
                }
            }

            // 2. High Accuracy Hardware GPS Lock with resilient fallbacks
            try {
                console.log('📍 Native: Requesting high-accuracy GPS position...');
                const position = await Geolocation.getCurrentPosition({
                    enableHighAccuracy: true,
                    timeout: 12000,
                    maximumAge: 10000
                });

                const { latitude, longitude } = position.coords;
                console.log('✅ Native: Hardware GPS acquired:', latitude, longitude);
                return await buildResult(latitude, longitude);
            } catch (highAccuracyError) {
                console.warn('📍 Native: High accuracy timed out, checking last known cached position...', highAccuracyError);

                try {
                    const lastKnown = await Geolocation.getLastKnownPosition();
                    if (lastKnown && lastKnown.coords) {
                        const { latitude, longitude } = lastKnown.coords;
                        console.log('✅ Native: Last known position acquired:', latitude, longitude);
                        return await buildResult(latitude, longitude, { isLastKnown: true });
                    }
                } catch (lkErr) {
                    console.warn('Last known position not available:', lkErr);
                }

                // If high accuracy timed out and no last known, try standard (fused/network) location
                try {
                    console.log('📍 Native: Attempting standard resolution position...');
                    const fallbackPos = await Geolocation.getCurrentPosition({
                        enableHighAccuracy: false,
                        timeout: 10000,
                        maximumAge: 60000
                    });
                    if (fallbackPos && fallbackPos.coords) {
                        const { latitude, longitude } = fallbackPos.coords;
                        console.log('✅ Native: Standard GPS acquired:', latitude, longitude);
                        return await buildResult(latitude, longitude, { isFallback: true });
                    }
                } catch (fallbackErr) {
                    console.warn('Native standard resolution fallback also failed:', fallbackErr);
                }

                throw highAccuracyError;
            }
        } else {
            // Browser Web Geolocation API
            if (!navigator.geolocation) {
                return {
                    success: false,
                    code: 'UNSUPPORTED',
                    message: 'Geolocation is not supported by this browser. Please enter your address manually.'
                };
            }

            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(
                    resolve,
                    (err) => {
                        // If high accuracy times out, try standard position before rejecting
                        console.warn('Browser high accuracy failed, attempting standard resolution...', err);
                        navigator.geolocation.getCurrentPosition(
                            resolve,
                            reject,
                            { enableHighAccuracy: false, timeout: 8000, maximumAge: 15000 }
                        );
                    },
                    { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
                );
            });

            const { latitude, longitude } = position.coords;
            console.log('✅ Browser: Real GPS acquired:', latitude, longitude);
            return await buildResult(latitude, longitude);
        }
    } catch (error) {
        console.error('📍 GPS Detection Error:', error);

        let userMessage = 'Unable to detect GPS location. Please enter your address manually.';
        let code = 'UNKNOWN';

        if (error.code === 1 || error.message?.includes('denied') || error.message?.includes('PERMISSION_DENIED')) {
            userMessage = 'Location permission was denied. Please allow location access or type your address manually.';
            code = 'PERMISSION_DENIED';
        } else if (error.code === 2 || error.message?.includes('unavailable')) {
            userMessage = 'GPS position unavailable. Please ensure device location / GPS is turned ON.';
            code = 'POSITION_UNAVAILABLE';
        } else if (error.code === 3 || error.message?.includes('timeout') || error.message?.includes('TIMEOUT')) {
            userMessage = 'GPS signal request timed out. Please try again or type your address manually.';
            code = 'TIMEOUT';
        }

        return {
            success: false,
            code,
            message: userMessage,
            error: error.message
        };
    }
};
