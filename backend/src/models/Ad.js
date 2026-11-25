import mongoose from 'mongoose';

const adSchema = new mongoose.Schema({
    title: {
        type: String,
        trim: true
    },
    storeName: {
        type: String,
        trim: true
    },
    storeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        required: false
    },
    price: {
        type: Number
    },
    offerTitle: {
        type: String,
        trim: true
    },
    buttonText: {
        type: String,
        trim: true,
        default: ''
    },
    image: {
        type: String,
        required: [true, 'Please add an image']
    },
    link: {
        type: String,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    order: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

export default mongoose.model('Ad', adSchema);
