/**
 * Client-Side Image Compression & Pre-Processing
 * Resizes high-resolution phone camera images and compresses them
 * before network upload, dramatically cutting upload times and preventing timeouts.
 */

export const validateImageFile = (file, maxSizeMB = 25) => {
    if (!file) return { valid: false, error: 'No file selected' };

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    const validExtensions = /\.(jpg|jpeg|png|webp)$/i;

    const hasValidMime = file.type ? validTypes.includes(file.type.toLowerCase()) : false;
    const hasValidExt = file.name ? validExtensions.test(file.name) : false;

    if (!hasValidMime && !hasValidExt) {
        return { valid: false, error: 'Please select a valid image format (JPEG, PNG, or WebP).' };
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
        return { valid: false, error: `Image is too large (maximum ${maxSizeMB}MB allowed).` };
    }

    return { valid: true };
};

export const validateImageSize = (file, maxSizeMB = 25) => {
    if (!file) return false;
    return file.size <= maxSizeMB * 1024 * 1024;
};

/**
 * Compress and resize an image file using browser Canvas API
 * @param {File} file - Original file from input
 * @param {Object} options - Configuration { maxWidth, maxHeight, quality, maxSizeBytes }
 * @returns {Promise<File>} - Compressed File object
 */
export const compressImage = async (file, options = {}) => {
    const {
        maxWidth = 1600,
        maxHeight = 1600,
        quality = 0.82,
        maxSizeBytes = 1024 * 1024 // 1MB target ceiling
    } = options;

    // If file is already small (e.g. < 200KB), return as is
    if (file.size <= 200 * 1024) {
        return file;
    }

    return new Promise((resolve) => {
        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => {
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                // Calculate aspect-ratio-preserving dimensions
                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d', { alpha: false });
                // Fill with white background in case of transparent PNG converted to JPEG
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);

                // Try converting to blob
                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            // Fallback to original file if toBlob fails
                            return resolve(file);
                        }

                        // Create clean File object with original name and .jpg extension
                        const cleanName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
                        const compressedFile = new File([blob], cleanName, {
                            type: 'image/jpeg',
                            lastModified: Date.now()
                        });

                        console.log(`🖼️ Image compressed: ${(file.size / 1024).toFixed(0)}KB ➔ ${(compressedFile.size / 1024).toFixed(0)}KB (${width}x${height})`);
                        resolve(compressedFile);
                    },
                    'image/jpeg',
                    quality
                );
            };

            img.onerror = () => {
                // If decoding fails, return original file
                resolve(file);
            };

            img.src = e.target.result;
        };

        reader.onerror = () => resolve(file);
        reader.readAsDataURL(file);
    });
};
