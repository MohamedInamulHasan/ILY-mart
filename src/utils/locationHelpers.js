// Helper function to check if location services are enabled
export const checkLocationPermission = async () => {
    const isNative = window.Capacitor?.isNativePlatform?.() ?? false;

    if (isNative) {
        try {
            // Dynamic import for Capacitor Geolocation
            const { Geolocation } = await import('@capacitor/geolocation');

            // Check permission status
            const permission = await Geolocation.checkPermissions();

            return {
                isEnabled: permission.location === 'granted' || permission.location === 'prompt',
                status: permission.location,
                isNative: true
            };
        } catch (error) {
            console.error('Error checking location permission:', error);
            return {
                isEnabled: false,
                status: 'error',
                error: error.message,
                isNative: true
            };
        }
    } else {
        // Browser environment - check if geolocation is available
        if (!navigator.geolocation) {
            return {
                isEnabled: false,
                status: 'unsupported',
                isNative: false
            };
        }

        // For browsers, we can't check if location is enabled without requesting it
        // So we return true and let the actual request handle errors
        return {
            isEnabled: true,
            status: 'available',
            isNative: false
        };
    }
};

export const reverseGeocode = async (latitude, longitude) => {
    // 1. Try Nominatim OpenStreetMap (Zepto-style road/building/area parsing)
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4500);
        const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            {
                headers: { 
                    'User-Agent': 'ILAYANGUDI-APP/1.5',
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
                const building = (addr.house_number || addr.building || addr.flats || addr.office || '').trim();
                const road = (addr.road || addr.street || addr.pedestrian || addr.footway || addr.path || addr.highway || addr.lane || '').trim();
                const roadPart = [building, road].filter(Boolean).join(' ').trim();

                const areaPart = (addr.neighbourhood || addr.suburb || addr.residential || addr.quarter || addr.subdivision || addr.colony || addr.sector || addr.hamlet || addr.village || '').trim();
                const city = (addr.town || addr.city || addr.municipality || addr.city_district || addr.county || '').trim();
                const zip = (addr.postcode || '').trim();

                // Zepto style: combine house/road + area (never duplicate city into street)
                const streetParts = [];
                if (roadPart) streetParts.push(roadPart);
                if (areaPart && areaPart.toLowerCase() !== city.toLowerCase() && !roadPart.toLowerCase().includes(areaPart.toLowerCase())) {
                    streetParts.push(areaPart);
                }
                let street = streetParts.join(', ').trim();

                // Fallback: If no road or area, extract first segment from display_name if distinct from city
                if (!street && data.display_name) {
                    const firstSeg = data.display_name.split(',')[0]?.trim();
                    if (firstSeg && firstSeg.toLowerCase() !== city.toLowerCase()) {
                        street = firstSeg;
                    }
                }

                // Strict sanity check: Street can NEVER be identical to city
                if (street.toLowerCase() === city.toLowerCase()) {
                    street = '';
                }

                return {
                    street,
                    city,
                    zip,
                    fullAddress: data.display_name || [street, city].filter(Boolean).join(', ')
                };
            }
        }
    } catch (err) {
        console.warn('Nominatim reverse geocode error:', err);
    }

    // 2. Fallback to BigDataCloud (Administrative level: locality & city)
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
            { signal: controller.signal }
        );
        clearTimeout(timeoutId);
        if (res.ok) {
            const data = await res.json();
            const city = data.city || data.locality || data.principalSubdivision || '';
            const zip = data.postcode || '';
            // BigDataCloud free tier only provides city/state, never fake it as a street
            return {
                street: '',
                city,
                zip,
                fullAddress: [city, data.principalSubdivision].filter(Boolean).join(', ')
            };
        }
    } catch (err) {
        console.warn('BigDataCloud reverse geocode error:', err);
    }

    return null;
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
            return {
                granted: false,
                status: 'error',
                error: error.message
            };
        }
    }

    return {
        granted: true,
        status: 'browser'
    };
};

/**
 * Robust helper to get current GPS location
 * Handles permissions and platform differences
 */
export const getCurrentLocation = async () => {
    const isNative = window.Capacitor?.isNativePlatform?.() ?? false;
    
        const buildResult = async (lat, lon, extra = {}) => {
        let addressDetails = null;
        try {
            // Race reverseGeocode with a 4.5s timeout for complete Nominatim resolution
            const geocodePromise = reverseGeocode(lat, lon);
            const timeoutPromise = new Promise(resolve => setTimeout(() => resolve(null), 4500));
            addressDetails = await Promise.race([geocodePromise, timeoutPromise]);
        } catch (e) {
            console.warn('Failed to reverse geocode in getCurrentLocation', e);
        }

        // If reverse geocoding didn't get details but an initialCity was provided by IP
        if (!addressDetails && extra.initialCity) {
            addressDetails = {
                street: '', // NEVER fake city as street
                city: extra.initialCity,
                zip: extra.initialZip || '',
                fullAddress: extra.initialCity
            };
        }

        return {
            latitude: lat,
            longitude: lon,
            mapsLink: `https://www.google.com/maps/place/${lat}+${lon}/@${lat},${lon},17z`,
            success: true,
            addressDetails,
            ...extra
        };
    };

    try {
        if (isNative) {
            const { Geolocation } = await import('@capacitor/geolocation');
            
            // 1. Check permissions (with resilience for manifest sync issues)
            let check;
            try {
                check = await Geolocation.checkPermissions();
            } catch (pError) {
                console.warn('📍 Permission check failed (likely manifest sync), proceeding anyway...', pError);
                check = { location: 'prompt' }; // Fallback to prompt
            }
            
            if (check.location !== 'granted') {
                // 2. Request if not granted
                try {
                    check = await Geolocation.requestPermissions();
                } catch (rError) {
                    console.warn('📍 Permission request failed, attempting direct access...', rError);
                    // If request fails, we still try to get position (OS might prompt)
                }
            }
            
            // 3. Try getting position with high accuracy first
            try {
                console.log('📍 Native: Attempting high accuracy getCurrentPosition...');
                const position = await Geolocation.getCurrentPosition({
                    enableHighAccuracy: true,
                    timeout: 8000, // 8 seconds timeout
                    maximumAge: 30000
                });
                
                const { latitude, longitude } = position.coords;
                console.log('✅ Native: High accuracy location obtained:', latitude, longitude);
                return await buildResult(latitude, longitude);
            } catch (highAccuracyError) {
                console.warn('📍 Native: High accuracy failed, trying last known position...', highAccuracyError);
                
                // Fallback A: Get last known cached position (instant and highly reliable on mobile)
                try {
                    const lastKnown = await Geolocation.getLastKnownPosition();
                    if (lastKnown && lastKnown.coords) {
                        const { latitude, longitude } = lastKnown.coords;
                        console.log('✅ Native: Last known location obtained:', latitude, longitude);
                        return await buildResult(latitude, longitude, { isLastKnown: true });
                    }
                } catch (lkError) {
                    console.warn('📍 Native: Last known location retrieval failed:', lkError);
                }

                // Fallback B: Try low accuracy location (uses network/cell tower instead of GPS hardware)
                try {
                    console.log('📍 Native: Attempting low accuracy getCurrentPosition...');
                    const position = await Geolocation.getCurrentPosition({
                        enableHighAccuracy: false,
                        timeout: 10000, 
                        maximumAge: 30000 // Allow 30 seconds old location
                    });
                    
                    const { latitude, longitude } = position.coords;
                    console.log('✅ Native: Low accuracy location obtained:', latitude, longitude);
                    return await buildResult(latitude, longitude);
                } catch (lowAccuracyError) {
                    console.error('📍 Native: Low accuracy failed as well:', lowAccuracyError);
                    throw lowAccuracyError; // Escalate to IP fallback
                }
            }
        } else {
            // Browser Environment with strict 3.5s failsafe
            if (!navigator.geolocation) {
                throw new Error('UNSUPPORTED');
            }
            
            const getBrowserPosition = () => new Promise((resolve, reject) => {
                let settled = false;
                const done = (fn, val) => {
                    if (!settled) {
                        settled = true;
                        fn(val);
                    }
                };

                navigator.geolocation.getCurrentPosition(
                    pos => done(resolve, pos),
                    err => {
                        console.warn('📡 Browser: High accuracy failed, trying low accuracy...', err);
                        navigator.geolocation.getCurrentPosition(
                            pos => done(resolve, pos),
                            e => done(reject, e),
                            { enableHighAccuracy: false, timeout: 5000, maximumAge: 30000 }
                        );
                    },
                    { enableHighAccuracy: true, timeout: 7000, maximumAge: 30000 }
                );
            });

            // Hard 8.5s timeout so real GPS has time to lock onto satellites
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('GPS_TIMEOUT')), 8500)
            );

            const position = await Promise.race([getBrowserPosition(), timeoutPromise]);
            const { latitude, longitude } = position.coords;
            console.log('✅ Browser: Geolocation obtained:', latitude, longitude);
            return await buildResult(latitude, longitude);
        }
    } catch (error) {
        console.warn('📍 Hardware GPS not available or timed out, trying fast IP location...', error);
        
        // --- FAST FALLBACK: IP-based Geolocation ---
        const ipProviders = [
            { url: 'https://ipwho.is', latKey: 'latitude', lonKey: 'longitude', cityKey: 'city', zipKey: 'postal' },
            { url: 'https://freeipapi.com/api/json', latKey: 'latitude', lonKey: 'longitude', cityKey: 'cityName', zipKey: 'zipCode' }
        ];

        for (const provider of ipProviders) {
            try {
                console.log(`📡 Attempting IP-based fallback: ${provider.url}`);
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 2000);
                
                const response = await fetch(provider.url, { signal: controller.signal });
                clearTimeout(timeoutId);
                
                const data = await response.json();
                const lat = data[provider.latKey];
                const lon = data[provider.lonKey];

                if (lat && lon) {
                    console.log(`✅ IP-based geolocation successful using ${provider.url}:`, lat, lon);
                    return await buildResult(lat, lon, { isIPFallback: true, addressDetails: null });
                }
            } catch (ipError) {
                console.warn(`❌ IP Fallback failed for ${provider.url}:`, ipError.message);
            }
        }

        let message = 'Unable to get location';
        let code = 'UNKNOWN';
        const rawError = error.message || 'No specific error message';
        
        // Check for OS-level blocking
        const isOSBlocked = rawError.toLowerCase().includes('denied by the system') || 
                           rawError.toLowerCase().includes('origin does not have permission');
 
        if (error.message === 'PERMISSION_DENIED' || error.code === 1) {
            message = isOSBlocked 
                ? 'Location is blocked by phone settings. Please enable location for this app.' 
                : 'Please allow location permission in your browser settings.';
            code = 'PERMISSION_DENIED';
        } else if (error.code === 2 || rawError.toLowerCase().includes('not detected') || rawError.toLowerCase().includes('unavailable')) {
            message = 'Location not detected. Please ensure your GPS/Wi-Fi is on and try again.';
            code = 'POSITION_UNAVAILABLE';
        } else if (error.code === 3 || rawError.toLowerCase().includes('timeout')) {
            message = 'Location request timed out. Please try again in an open area.';
            code = 'TIMEOUT';
        } else if (error.message === 'UNSUPPORTED') {
            message = 'Geolocation is not supported by your browser';
            code = 'UNSUPPORTED';
        }
        
        // Append diagnostic info if it's still "Unable to get location"
        const finalMessage = message === 'Unable to get location' 
            ? `Unable to get location (System Error: ${rawError})` 
            : message;
 
        return { success: false, message: finalMessage, code, error: rawError };
    }
};
