import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a product title'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Please add a product description']
    },
    price: {
        type: Number,
        required: [true, 'Please add a product price'],
        min: 0
    },
    category: {
        type: String,
        required: [true, 'Please add a product category'],
        trim: true
    },
    subcategory: {
        type: [String],
        default: []
    },
    image: {
        type: String,
        default: 'https://placehold.co/400x400/e2e8f0/64748b?text=Product',
        trim: true
    },
    images: [{
        type: String
    }],
    stock: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    unit: {
        type: String,
        default: ''
    },
    mention: {
        type: String,
        default: ''
    },
    featured: {
        type: Boolean,
        default: false
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    isGold: {
        type: Boolean,
        default: false
    },
    storeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        required: false // Optional for now, or true if every product MUST belong to a store
    },
    order: {
        type: Number,
        default: 0
    },
    salesCount: {
        type: Number,
        default: 0
    },
    openingTime: {
        type: String,
        default: '00:00'
    },
    closingTime: {
        type: String,
        default: '23:59'
    },
    useTimeLimit: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Add indexes for performance and to avoid sort memory limit errors
productSchema.index({ createdAt: -1 });
productSchema.index({ storeId: 1 });
productSchema.index({ category: 1 });
productSchema.index({ isAvailable: 1, order: 1, createdAt: -1 });
productSchema.index({ isAvailable: 1, category: 1, order: 1, createdAt: -1 });
productSchema.index({ isAvailable: 1, storeId: 1, order: 1, createdAt: -1 });
productSchema.index({ title: 'text', description: 'text' });

const Product = mongoose.model('Product', productSchema);

export default Product;
