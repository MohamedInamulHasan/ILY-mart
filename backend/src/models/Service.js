import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a service name'],
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    image: {
        type: String,
        default: ''
    },
    address: {
        type: String,
        default: ''
    },
    mobile: {
        type: String,
        default: ''
    },
    category: {
        type: String,
        default: 'General',
        trim: true
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
        default: 'daily'
    },
    openingTime: {
        type: String,
        default: '09:00'
    },
    closingTime: {
        type: String,
        default: '21:00'
    },
    order: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

const Service = mongoose.model('Service', serviceSchema);

export default Service;
