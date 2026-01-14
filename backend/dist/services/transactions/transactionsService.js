"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listTransactions = listTransactions;
const mongoose_1 = require("mongoose");
const Transaction_1 = require("../../models/Transaction");
async function listTransactions(input) {
    const userObjectId = new mongoose_1.Types.ObjectId(input.userId);
    const skip = (input.page - 1) * input.limit;
    const [items, total] = await Promise.all([
        Transaction_1.TransactionModel.find({ userId: userObjectId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(input.limit)
            .select('-__v'),
        Transaction_1.TransactionModel.countDocuments({ userId: userObjectId }),
    ]);
    return { page: input.page, limit: input.limit, total, items };
}
