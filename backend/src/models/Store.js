import mongoose from 'mongoose';

const storeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a store name'],
        trim: true
    },
    type: {
        type: [String], // Changed from String to [String] for multi-category support
        required: [true, 'Please add at least one store type'],
        trim: true
    },
    address: {
        type: String,
        required: [true, 'Please add a store address']
    },
    city: {
        type: String,
        default: 'Local'
    },
    timing: {
        type: String,
        default: '9:00 AM - 9:00 PM'
    },
    openingTime: {
        type: String,
        default: '09:00' // 24-hour format HH:MM
    },
    closingTime: {
        type: String,
        default: '21:00' // 24-hour format HH:MM
    },
    mobile: {
        type: String,
        required: [true, 'Please add a mobile number']
    },
    image: {
        type: String,
        required: [true, 'Please add a store image']
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isManuallyClosed: {
        type: Boolean,
        default: false
    },
    timingType: {
        type: String,
        enum: ['daily', 'permanent'],
        default: 'permanent'
    },
    order: {
        type: Number,
        default: 0
    },
    location: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

const Store = mongoose.model('Store', storeSchema);

export default Store;
