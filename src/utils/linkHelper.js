import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { openExternalUrlNative, isNativeAndroid } from './floatingOverlay';

/**
 * Opens a URL in the system's external browser or native app.
 * Works for both web and native platforms via Capacitor Browser plugin & Android Native Intent.
 * Seamlessly resolves Google Maps short links (maps.app.goo.gl, goo.gl).
 * @param {string} url - The URL or query to open.
 */
export const openExternalLink = async (url) => {
    if (!url) return;
    
    let finalUrl = String(url).trim();
    
    // Normalize url: ensure protocol exists
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://') && !finalUrl.startsWith('geo:')) {
        if (finalUrl.includes('goo.gl') || finalUrl.includes('maps.app') || finalUrl.includes('google.com')) {
            finalUrl = `https://${finalUrl.replace(/^https?:\/\//, '')}`;
        } else {
            finalUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(finalUrl)}`;
        }
    }
    
    // If short maps link, unshorten to direct coordinates so it never times out
    if (finalUrl.includes('goo.gl') || finalUrl.includes('maps.app')) {
        try {
            const res = await fetch(`https://homly-backend-aash.onrender.com/api/stores/resolve-map-link?url=${encodeURIComponent(finalUrl)}`);
            const data = await res.json();
            if (data?.resolvedUrl && !data.resolvedUrl.includes('maps.app.goo.gl') && !data.resolvedUrl.includes('goo.gl')) {
                finalUrl = data.resolvedUrl;
            }
        } catch (e) {
            console.warn('Could not unshorten map link:', e);
        }
    }

    // 1. Native Android: Launch native Intent.ACTION_VIEW (opens Google Maps app directly)
    if (isNativeAndroid()) {
        try {
            const ok = await openExternalUrlNative(finalUrl);
            if (ok) return;
        } catch (nativeErr) {
            console.warn('Native openExternalUrl failed, falling back:', nativeErr);
        }
    }

    // 2. Capacitor on iOS / Other native:
    if (Capacitor.isNativePlatform()) {
        try {
            await Browser.open({ url: finalUrl });
            return;
        } catch (bErr) {
            console.warn('Browser.open failed:', bErr);
        }
        return; // NEVER navigate the main WebView to external maps!
    }

    // 3. Web / PWA browser environment:
    try {
        window.open(finalUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
        console.error('Error opening external link in web browser:', error);
    }
};
