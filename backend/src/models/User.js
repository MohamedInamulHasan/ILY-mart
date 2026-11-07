import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
        trim: true // Names should be trimmed
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email']
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6,
        select: false
    },
    role: {
        type: [String],
        enum: ['customer', 'admin', 'store_admin', 'service_admin', 'delivery_boy'],
        default: ['customer']
    },
    deliveryId: {
        type: String,
        trim: true,
        default: ''
    },
    deliverySettings: {
        workTimings: {
            start: { type: String, default: '09:00' },
            end: { type: String, default: '21:00' }
        },
        deliveryId: {
        type: String,
        trim: true,
        default: ''
    },
    displayPassword: {
        type: String,
        default: ''
    },
    displayPassword: {
        type: String,
        default: ''
    },
    telegramChatId: String,
        isActive: { type: Boolean, default: true }
    },
    storeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store'
    },
    serviceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service'
    },
    mobile: {
        type: String
    },
    address: {
        street: String,
        city: String,
        state: String,
        zip: String,
        zip: String,
        country: { type: String, default: 'India' },
        location: String // Maps link or coordinates
    },
    savedProducts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    coins: {
        type: Number,
        default: 0
    },
    hasReceivedSignupBonus: {
        type: Boolean,
        default: false
    },
    isFastMode: {
        type: Boolean,
        default: false
    },
    location: {
        type: String,
        default: ''
    },
    avatar: {
        type: String,
        default: ''
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password token
userSchema.methods.getResetPasswordToken = function () {
    // Generate token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set to resetPasswordToken field
    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    // Set expire (10 minutes)
    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    return resetToken;
};

userSchema.index({ mobile: 1 });
userSchema.index({ role: 1 });

const User = mongoose.model('User', userSchema);

export default User;
