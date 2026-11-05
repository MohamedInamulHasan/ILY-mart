import { useState, useRef, useCallback } from 'react';
import api from '../utils/api';
import { compressImage, validateImageFile } from '../utils/imageCompression';

/**
 * Enhanced Hook for Robust Cloudinary Uploads
 * Features:
 * - Client-side image pre-compression (5MB-15MB ➔ 300KB)
 * - Format & size validation
 * - Upload progress percentage (0 - 100%)
 * - Automatic retry with exponential backoff for slow networks / cold starts
 * - Manual retry() method
 * - Preserves last selected file on failure
 */
const useCloudinaryUpload = () => {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);
    const lastFileRef = useRef(null);

    const performUploadWithRetry = async (compressedFile, maxRetries = 2, queryString = '') => {
        let attempt = 0;
        let lastErr = null;

        while (attempt <= maxRetries) {
            try {
                if (attempt > 0) {
                    console.warn(`🔄 Retrying upload (attempt ${attempt + 1}/${maxRetries + 1})...`);
                    // Exponential backoff delay (1.5s, 3s)
                    await new Promise(r => setTimeout(r, attempt * 1500));
                }

                const formData = new FormData();
                formData.append('image', compressedFile);

                // Dedicated 90-second timeout for upload, progress tracking
                const response = await api.post(`/upload/image${queryString}`, formData, {
                    headers: {
                        'Content-Type': undefined
                    },
                    timeout: 90000,
                    onUploadProgress: (progressEvent) => {
                        if (progressEvent.total) {
                            const percent = Math.min(99, Math.round((progressEvent.loaded * 100) / progressEvent.total));
                            setProgress(percent);
                        }
                    }
                });

                if (response && response.url) {
                    setProgress(100);
                    return response.url;
                } else if (response && response.data && response.data.url) {
                    setProgress(100);
                    return response.data.url;
                }

                throw new Error(response?.message || 'Upload completed but image URL was missing.');
            } catch (err) {
                lastErr = err;
                console.error(`Upload attempt ${attempt + 1} failed:`, err.message);
                attempt++;
            }
        }

        throw lastErr || new Error('Upload failed after multiple attempts');
    };

    const uploadImage = useCallback(async (file, options = {}) => {
        if (!file) {
            throw new Error('Please select an image file to upload.');
        }

        const { isCategory = false } = options;

        lastFileRef.current = file;
        setUploading(true);
        setProgress(0);
        setError(null);

        try {
            // 1. Validation
            const validation = validateImageFile(file, 25);
            if (!validation.valid) {
                throw new Error(validation.error);
            }

            setProgress(10); // Compression stage

            // 2. Pre-upload client compression (converts 10MB photo to ~300KB)
            //    Skip compression for category PNG files to preserve transparency
            const isCategoryPng = isCategory && (file.type === 'image/png' || /\.png$/i.test(file.name));
            const compressed = isCategoryPng ? file : await compressImage(file, {
                maxWidth: 1600,
                maxHeight: 1600,
                quality: 0.82
            });

            setProgress(25); // Compression complete, beginning network upload

            // 3. Upload with automatic retry
            // Pass ?category=1 so backend preserves PNG transparency for category images
            const url = await performUploadWithRetry(compressed, 2, isCategory ? '?category=1' : '');

            setUploading(false);
            setProgress(100);
            return url;

        } catch (err) {
            console.error('Final Upload Error:', err);
            const userMessage = err?.response?.data?.message || err?.message || 'Failed to upload image. Please check your internet connection.';
            setError(userMessage);
            setUploading(false);
            setProgress(0);
            throw new Error(userMessage);
        }
    }, []);

    // Manual retry of the last selected file
    const retry = useCallback(async () => {
        if (lastFileRef.current) {
            return await uploadImage(lastFileRef.current);
        }
        throw new Error('No previous file available to retry.');
    }, [uploadImage]);

    return { 
        uploadImage, 
        uploading, 
        progress, 
        error, 
        retry,
        lastFile: lastFileRef.current,
        clearError: () => setError(null) 
    };
};

export default useCloudinaryUpload;
