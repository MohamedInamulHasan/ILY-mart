import { Browser } from '@capacitor/browser';

/**
 * Opens a URL in the system's external browser or native app.
 * Works for both web and native platforms via Capacitor Browser plugin.
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

    try {
        // Native Capacitor (Android & iOS): Browser.open reliably launches system Chrome Custom Tabs
        // which automatically forwards maps.app.goo.gl / google maps links into the native Google Maps app!
        if (window.Capacitor && window.Capacitor.isNativePlatform()) {
            await Browser.open({ url: finalUrl });
            return;
        }

        // Web / PWA browser environment:
        // Use a dynamic <a> element click to avoid popup blocker interruptions
        const link = document.createElement('a');
        link.href = finalUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error('Error opening external link:', error);
        window.location.href = finalUrl;
    }
};
