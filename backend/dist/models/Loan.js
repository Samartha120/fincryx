"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoanModel = void 0;
const mongoose_1 = require("mongoose");
const loanSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    accountId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Account', required: true, index: true },
    principalMinor: { type: Number, required: true, min: 1 },
    currency: { type: String, required: true, default: 'INR' },
    annualInterestBps: { type: Number, required: true, min: 0, max: 100000 },
    termMonths: { type: Number, required: true, min: 1, max: 600 },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], required: true, default: 'pending', index: true },
    decisionNote: { type: String, required: false, trim: true },
    decidedByUserId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: false, index: true },
    decidedAt: { type: Date, required: false },
}, { timestamps: true });
loanSchema.index({ status: 1, createdAt: -1 });
loanSchema.index({ userId: 1, createdAt: -1 });
exports.LoanModel = (0, mongoose_1.model)('Loan', loanSchema);
