"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountModel = void 0;
const mongoose_1 = require("mongoose");
const accountSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    accountNumber: { type: String, required: true, unique: true, index: true },
    type: { type: String, enum: ['checking', 'savings'], required: true, default: 'checking' },
    currency: { type: String, required: true, default: 'INR' },
    balanceMinor: { type: Number, required: true, default: 0, min: 0 },
}, { timestamps: true });
accountSchema.index({ userId: 1, createdAt: -1 });
exports.AccountModel = (0, mongoose_1.model)('Account', accountSchema);
