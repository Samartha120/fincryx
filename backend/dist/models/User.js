"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const mongoose_1 = require("mongoose");
const userSchema = new mongoose_1.Schema({
    role: {
        type: String,
        enum: ['customer', 'admin'],
        required: true,
        default: 'customer',
        index: true,
    },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
    phone: { type: String, required: false, trim: true },
    passwordHash: { type: String, required: true },
    isOtpVerified: { type: Boolean, required: true, default: false, index: true },
    otpCodeHash: { type: String, required: false },
    otpExpiresAt: { type: Date, required: false, index: true },
    passwordResetCodeHash: { type: String, required: false },
    passwordResetExpiresAt: { type: Date, required: false, index: true },
    pushTokens: { type: [String], required: false, default: [] },
}, { timestamps: true });
userSchema.index({ createdAt: -1 });
exports.UserModel = (0, mongoose_1.model)('User', userSchema);
