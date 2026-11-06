import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a category name'],
        trim: true,
        unique: true
    },
    name_ta: {
        type: String,
        trim: true,
        default: ''
    },
    description: {
        type: String,
        default: ''
    },
    icon: {
        type: String,
        default: ''
    },
    image: {
        type: String,
        default: ''
    },
    subcategories: {
        type: [String],
        default: []
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isPreview: {
        type: Boolean,
        default: false
    },
    mode: {
        type: String,
        enum: ['normal', 'preview'],
        default: 'normal'
    },
    order: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

categorySchema.index({ isActive: 1, order: 1 });

const Category = mongoose.model('Category', categorySchema);

export default Category;
