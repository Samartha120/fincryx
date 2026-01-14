"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminStats = getAdminStats;
exports.listAllTransactions = listAllTransactions;
const Account_1 = require("../../models/Account");
const Loan_1 = require("../../models/Loan");
const Transaction_1 = require("../../models/Transaction");
const User_1 = require("../../models/User");
async function getAdminStats() {
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [totalUsers, customers, admins, otpVerified, totalAccounts, accountsAgg, totalLoans, pendingLoans, approvedLoans, rejectedLoans, totalTx, last24hAgg,] = await Promise.all([
        User_1.UserModel.countDocuments(),
        User_1.UserModel.countDocuments({ role: 'customer' }),
        User_1.UserModel.countDocuments({ role: 'admin' }),
        User_1.UserModel.countDocuments({ isOtpVerified: true }),
        Account_1.AccountModel.countDocuments(),
        Account_1.AccountModel.aggregate([
            { $group: { _id: null, totalBalanceMinor: { $sum: '$balanceMinor' } } },
        ]),
        Loan_1.LoanModel.countDocuments(),
        Loan_1.LoanModel.countDocuments({ status: 'pending' }),
        Loan_1.LoanModel.countDocuments({ status: 'approved' }),
        Loan_1.LoanModel.countDocuments({ status: 'rejected' }),
        Transaction_1.TransactionModel.countDocuments(),
        Transaction_1.TransactionModel.aggregate([
            { $match: { createdAt: { $gte: since24h } } },
            {
                $group: {
                    _id: null,
                    last24hCount: { $sum: 1 },
                    last24hVolumeMinor: { $sum: '$amountMinor' },
                },
            },
        ]),
    ]);
    const totalBalanceMinor = accountsAgg[0]?.totalBalanceMinor ?? 0;
    const last24hCount = last24hAgg[0]?.last24hCount ?? 0;
    const last24hVolumeMinor = last24hAgg[0]?.last24hVolumeMinor ?? 0;
    return {
        users: { total: totalUsers, customers, admins, otpVerified },
        accounts: { total: totalAccounts, totalBalanceMinor },
        loans: { total: totalLoans, pending: pendingLoans, approved: approvedLoans, rejected: rejectedLoans },
        transactions: { total: totalTx, last24hCount, last24hVolumeMinor },
    };
}
async function listAllTransactions(input) {
    const page = input.page;
    const limit = input.limit;
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
        Transaction_1.TransactionModel.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select('-__v'),
        Transaction_1.TransactionModel.countDocuments(),
    ]);
    return { page, limit, total, items };
}
