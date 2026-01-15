"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listAccounts = listAccounts;
exports.transferInternal = transferInternal;
const mongoose_1 = require("mongoose");
const errorMiddleware_1 = require("../../middlewares/errorMiddleware");
const Account_1 = require("../../models/Account");
const Transaction_1 = require("../../models/Transaction");
const refs_1 = require("../../utils/refs");
const pushService_1 = require("../notifications/pushService");
async function listAccounts(userId) {
    const userObjectId = new mongoose_1.Types.ObjectId(userId);
    const accounts = await Account_1.AccountModel.find({ userId: userObjectId })
        .sort({ createdAt: -1 })
        .select('-__v');
    return accounts;
}
async function transferInternal(input) {
    const userObjectId = new mongoose_1.Types.ObjectId(input.userId);
    const fromAccountObjectId = new mongoose_1.Types.ObjectId(input.fromAccountId);
    const session = await (0, mongoose_1.startSession)();
    try {
        const reference = (0, refs_1.generateTransactionReference)();
        await session.withTransaction(async () => {
            const from = await Account_1.AccountModel.findOneAndUpdate({
                _id: fromAccountObjectId,
                userId: userObjectId,
                balanceMinor: { $gte: input.amountMinor },
            }, { $inc: { balanceMinor: -input.amountMinor } }, { new: true, session });
            if (!from) {
                throw new errorMiddleware_1.ApiError(400, 'Insufficient funds or invalid source account');
            }
            const to = await Account_1.AccountModel.findOneAndUpdate({ accountNumber: input.toAccountNumber }, { $inc: { balanceMinor: input.amountMinor } }, { new: true, session });
            if (!to) {
                throw new errorMiddleware_1.ApiError(404, 'Destination account not found');
            }
            if (to.currency !== from.currency) {
                throw new errorMiddleware_1.ApiError(400, 'Currency mismatch');
            }
            await Transaction_1.TransactionModel.create([
                {
                    userId: userObjectId,
                    fromAccountId: from._id,
                    toAccountId: to._id,
                    type: 'transfer',
                    status: 'completed',
                    amountMinor: input.amountMinor,
                    currency: from.currency,
                    reference,
                    note: input.note,
                },
            ], { session });
        });
        await (0, pushService_1.sendUserNotification)(input.userId, {
            title: 'Transfer completed',
            body: `Transfer of ${input.amountMinor} ${from.currency} sent successfully.`,
            includeDailySpend: true,
            data: { type: 'transfer', reference },
        });
        await (0, pushService_1.sendDailySpendNotification)(input.userId, from.currency);
        return { reference };
    }
    finally {
        session.endSession();
    }
}
