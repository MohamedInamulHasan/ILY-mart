/**
 * Cloudinary On-the-Fly Image Optimization Utility
 * 
 * Automatically enhances Cloudinary image URLs with:
 * - f_auto (delivers modern AVIF/WebP based on browser support)
 * - q_auto (intelligent quality compression without perceptible degradation)
 * - responsive widths (prevents downloading 4K full-res images for 150px cards)
 * - intelligent cropping (c_limit / c_fill / g_auto)
 */

export const PRODUCT_PLACEHOLDER = 'https://atlas-content-cdn.pixelbin.io/ast/feed_v2/static_assets/common/vegetable_placeholder.png';

/**
 * Generates an optimized Cloudinary URL
 * @param {string} url - Original image URL
 * @param {Object} options - Transformation options { width, height, quality, format, crop, gravity }
 * @returns {string} - Optimized URL or original URL
 */
export const getOptimizedImageUrl = (url, options = {}) => {
    if (!url || typeof url !== 'string') {
        return PRODUCT_PLACEHOLDER;
    }

    // Don't modify data URIs, blob URLs, or non-Cloudinary assets
    if (!url.includes('cloudinary.com') || !url.includes('/upload/')) {
        return url;
    }

    const {
        width,
        height,
        quality = 'auto',
        format = 'auto',
        crop = width && height ? 'fill' : 'limit',
        gravity = 'auto'
    } = options;

    const parts = url.split('/upload/');
    if (parts.length !== 2) return url;

    const base = parts[0] + '/upload/';
    let rest = parts[1];

    // Check if the URL already has transformation flags
    if (/^[a-z]_[a-z0-9]+/.test(rest)) {
        // Transformations already present
        return url;
    }

    const transforms = [`f_${format}`, `q_${quality}`];
    if (width) transforms.push(`w_${Math.round(width)}`);
    if (height) transforms.push(`h_${Math.round(height)}`);
    if (crop) transforms.push(`c_${crop}`);
    if (crop === 'fill' && gravity) transforms.push(`g_${gravity}`);

    return `${base}${transforms.join(',')}/${rest}`;
};

/**
 * Thumbnail for catalog & small product cards (width: 320px)
 */
export const getThumbnailUrl = (url, size = 320) => {
    return getOptimizedImageUrl(url, {
        width: size,
        height: size,
        crop: 'fill',
        gravity: 'auto'
    });
};

/**
 * Medium-sized image for product details or banners (width: 720px)
 */
export const getMediumImageUrl = (url, width = 720) => {
    return getOptimizedImageUrl(url, {
        width,
        crop: 'limit'
    });
};

/**
 * Hero Banner image (width: 1080px)
 */
export const getHeroImageUrl = (url, width = 1080) => {
    return getOptimizedImageUrl(url, {
        width,
        crop: 'limit'
    });
};
