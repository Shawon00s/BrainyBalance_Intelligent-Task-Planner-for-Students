import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minLength: 6
    },
    role: {
        type: String,
        enum: ['student', 'admin'],
        default: 'student'
    },
    lastLogin: {
        type: Date,
        default: Date.now
    },
    // Email verification fields
    isVerified: {
        type: Boolean,
        default: false
    },
    otpHash: {
        type: String
    },
    otpExpires: {
        type: Date
    },
    otpAttempts: {
        type: Number,
        default: 0
    },
    otpResendCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

const User = mongoose.model('User', userSchema);
export default User;