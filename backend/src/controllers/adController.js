import Ad from '../models/Ad.js';
import { getIO } from '../socket.js';
import { deleteFromCloudinary } from '../utils/cloudinaryHelper.js';

// @desc    Get all ads
// @route   GET /api/ads
// @access  Public
export const getAds = async (req, res, next) => {
    try {
        const ads = await Ad.find({ isActive: true }).lean()
            .select('-image') // Exclude heavy image data
            .sort({ order: 1, createdAt: -1 });

        res.status(200).json({
            success: true,
            count: ads.length,
            data: ads
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single ad
// @route   GET /api/ads/:id
// @access  Public
export const getAd = async (req, res, next) => {
    try {
        const ad = await Ad.findById(req.params.id).lean();

        if (!ad) {
            res.status(404);
            throw new Error('Ad not found');
        }

        res.status(200).json({
            success: true,
            data: ad
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new ad
// @route   POST /api/ads
// @access  Private/Admin
export const createAd = async (req, res, next) => {
    try {
        console.log('📝 Creating new ad with data:', req.body);
        const ad = await Ad.create(req.body);
        console.log('✅ Ad created successfully:', ad);

        getIO().emit('ads:updated');

        res.status(201).json({
            success: true,
            data: ad
        });
    } catch (error) {
        console.error('❌ Error creating ad:', error);
        next(error);
    }
};

// @desc    Update ad
// @route   PUT /api/ads/:id
// @access  Private/Admin
export const updateAd = async (req, res, next) => {
    try {
        const ad = await Ad.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!ad) {
            res.status(404);
            throw new Error('Ad not found');
        }

        getIO().emit('ads:updated');

        res.status(200).json({
            success: true,
            data: ad
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete ad
// @route   DELETE /api/ads/:id
// @access  Private/Admin
export const deleteAd = async (req, res, next) => {
    try {
        const ad = await Ad.findById(req.params.id).lean();

        if (!ad) {
            res.status(404);
            throw new Error('Ad not found');
        }

        if (ad.imageUrl) await deleteFromCloudinary(ad.imageUrl);
        if (ad.image) await deleteFromCloudinary(ad.image);

        await Ad.findByIdAndDelete(req.params.id);

        getIO().emit('ads:updated');

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        next(error);
    }
};
// @desc    Get ad image
// @route   GET /api/ads/:id/image
// @access  Public
export const getAdImage = async (req, res, next) => {
    try {
        const ad = await Ad.findById(req.params.id).lean().select('image');

        if (!ad || !ad.image) {
            return res.status(404).send('Image not found');
        }

        if (ad.image.startsWith('data:image')) {
            const matches = ad.image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            if (matches.length !== 3) {
                return res.status(404).send('Invalid image data');
            }
            const type = matches[1];
            const buffer = Buffer.from(matches[2], 'base64');

            res.writeHead(200, {
                'Content-Type': type,
                'Content-Length': buffer.length
            });
            res.end(buffer);
        } else {
            res.redirect(ad.image);
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Update ads order
// @route   PUT /api/ads/reorder
// @access  Private/Admin
export const updateAdsOrder = async (req, res, next) => {
    try {
        const { orderedIds } = req.body;

        if (!orderedIds || !Array.isArray(orderedIds)) {
            res.status(400);
            throw new Error('Please provide an array of ordered IDs');
        }

        const bulkOps = orderedIds.map((id, index) => ({
            updateOne: {
                filter: { _id: id },
                update: { order: index }
            }
        }));

        await Ad.bulkWrite(bulkOps);

        getIO().emit('ads:updated');

        res.status(200).json({
            success: true,
            message: 'Ads reordered successfully'
        });
    } catch (error) {
        next(error);
    }
};
