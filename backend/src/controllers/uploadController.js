import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Helper: Stream buffer directly to Cloudinary without memory-heavy base64 stringification
const streamUploadToCloudinary = (fileBuffer, options = {}) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: 'homly_products',
                resource_type: 'image',
                quality: 'auto',
                fetch_format: 'auto',
                ...options
            },
            (error, result) => {
                if (error) {
                    return reject(error);
                }
                resolve(result);
            }
        );

        const readableStream = Readable.from(fileBuffer);
        readableStream.pipe(uploadStream);
    });
};

// @desc    Get Cloudinary Signature for client-side upload
// @route   GET /api/upload/signature
// @access  Private
export const getUploadSignature = (req, res) => {
    try {
        const timestamp = Math.round((new Date()).getTime() / 1000);
        const folder = 'homly_products';

        // Parameters to sign
        const paramsToSign = {
            timestamp: timestamp,
            folder: folder
        };

        const signature = cloudinary.utils.api_sign_request(
            paramsToSign,
            process.env.CLOUDINARY_API_SECRET
        );

        const responseData = {
            timestamp,
            signature,
            cloudName: process.env.CLOUDINARY_CLOUD_NAME,
            apiKey: process.env.CLOUDINARY_API_KEY,
            folder: folder
        };

        res.json(responseData);
    } catch (error) {
        console.error('❌ Cloudinary Signature Error:', error);
        res.status(500).json({ message: 'Could not generate upload signature', error: error.message });
    }
};

// @desc    Upload image to Cloudinary (server-side streaming via Multer memoryStorage)
// @route   POST /api/upload/image
// @access  Private
export const uploadImage = async (req, res) => {
    try {
        if (!req.file || !req.file.buffer) {
            return res.status(400).json({ success: false, message: 'No image file provided or buffer empty' });
        }

        // Validate Cloudinary credentials exist
        if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
            console.error('❌ Cloudinary configuration missing on server');
            return res.status(500).json({ 
                success: false, 
                message: 'Cloudinary storage credentials not properly configured on server' 
            });
        }

        // Re-affirm config in case environment was reloaded
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET
        });

        // Fast streaming upload
        // For PNG files: preserve format & alpha channel (no white background from fetch_format: 'auto')
        const isPng = req.file.mimetype === 'image/png' || (req.file.originalname || '').toLowerCase().endsWith('.png');
        const uploadOptions = isPng
            ? { folder: 'homly_products', resource_type: 'image', format: 'png' }
            : { folder: 'homly_products', resource_type: 'image', quality: 'auto', fetch_format: 'auto' };
        const result = await streamUploadToCloudinary(req.file.buffer, uploadOptions);

        console.log('✅ Image uploaded successfully to Cloudinary:', result.secure_url);

        res.status(200).json({
            success: true,
            url: result.secure_url,
            public_id: result.public_id,
            width: result.width,
            height: result.height,
            format: result.format,
            bytes: result.bytes
        });
    } catch (error) {
        console.error('❌ Cloudinary Stream Upload Error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Image upload failed. Please try again.',
            details: error.http_code ? `Cloudinary error (${error.http_code})` : 'Network/service error'
        });
    }
};
