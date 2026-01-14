"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionModel = void 0;
const mongoose_1 = require("mongoose");
const transactionSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    fromAccountId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Account', required: false, index: true },
    toAccountId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Account', required: false, index: true },
    type: {
        type: String,
        enum: ['transfer', 'loan_disbursement', 'loan_payment'],
        required: true,
        default: 'transfer',
        index: true,
    },
    status: { type: String, enum: ['pending', 'completed', 'failed'], required: true, default: 'completed' },
    amountMinor: { type: Number, required: true, min: 1 },
    currency: { type: String, required: true, default: 'INR' },
    reference: { type: String, required: true, index: true },
    note: { type: String, required: false, trim: true },
}, { timestamps: true });
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ fromAccountId: 1, createdAt: -1 });
transactionSchema.index({ toAccountId: 1, createdAt: -1 });
exports.TransactionModel = (0, mongoose_1.model)('Transaction', transactionSchema);
