import News from '../models/News.js';

// @desc    Get all news
// @route   GET /api/news
// @access  Public
export const getAllNews = async (req, res, next) => {
    try {
        const { category, featured } = req.query;
        let query = {};

        if (category) {
            query.category = category;
        }

        if (featured) {
            query.featured = featured === 'true';
        }

        const news = await News.find(query).lean().sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: news.length,
            data: news
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single news
// @route   GET /api/news/:id
// @access  Public
export const getNews = async (req, res, next) => {
    try {
        const news = await News.findById(req.params.id).lean();

        if (!news) {
            res.status(404);
            throw new Error('News not found');
        }

        // Increment views
        news.views += 1;
        await news.save();

        res.status(200).json({
            success: true,
            data: news
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new news
// @route   POST /api/news
// @access  Private/Admin
export const createNews = async (req, res, next) => {
    try {
        const news = await News.create(req.body);

        res.status(201).json({
            success: true,
            data: news
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update news
// @route   PUT /api/news/:id
// @access  Private/Admin
export const updateNews = async (req, res, next) => {
    try {
        // Prevent overwriting existing image with empty string
        const updateData = { ...req.body };
        if (!updateData.image) {
            delete updateData.image;
        }

        const news = await News.findByIdAndUpdate(
            req.params.id,
            updateData,
            {
                new: true,
                runValidators: true
            }
        );

        if (!news) {
            res.status(404);
            throw new Error('News not found');
        }

        res.status(200).json({
            success: true,
            data: news
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete news
// @route   DELETE /api/news/:id
// @access  Private/Admin
export const deleteNews = async (req, res, next) => {
    try {
        const news = await News.findByIdAndDelete(req.params.id);

        if (!news) {
            res.status(404);
            throw new Error('News not found');
        }

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        next(error);
    }
};
