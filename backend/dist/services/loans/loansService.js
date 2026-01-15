"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyLoan = applyLoan;
exports.listCustomerLoans = listCustomerLoans;
exports.getCustomerLoan = getCustomerLoan;
exports.listPendingLoansAdmin = listPendingLoansAdmin;
exports.decideLoanAdmin = decideLoanAdmin;
const mongoose_1 = require("mongoose");
const errorMiddleware_1 = require("../../middlewares/errorMiddleware");
const Account_1 = require("../../models/Account");
const Loan_1 = require("../../models/Loan");
const Transaction_1 = require("../../models/Transaction");
const emi_1 = require("../../utils/loans/emi");
const refs_1 = require("../../utils/refs");
const pushService_1 = require("../notifications/pushService");
async function applyLoan(input) {
    const userObjectId = new mongoose_1.Types.ObjectId(input.userId);
    const accountObjectId = new mongoose_1.Types.ObjectId(input.accountId);
    const account = await Account_1.AccountModel.findOne({ _id: accountObjectId, userId: userObjectId });
    if (!account)
        throw new errorMiddleware_1.ApiError(404, 'Account not found');
    const loan = await Loan_1.LoanModel.create({
        userId: userObjectId,
        accountId: account._id,
        principalMinor: input.principalMinor,
        currency: account.currency,
        annualInterestBps: input.annualInterestBps,
        termMonths: input.termMonths,
        status: 'pending',
    });
    const emi = (0, emi_1.computeEmiSchedule)({
        principalMinor: loan.principalMinor,
        annualInterestBps: loan.annualInterestBps,
        termMonths: loan.termMonths,
    });
    await (0, pushService_1.sendUserNotification)(input.userId, {
        title: 'Loan application submitted',
        body: `Your loan request for ${loan.principalMinor} ${loan.currency} is pending review.`,
        data: { type: 'loan', status: 'pending', loanId: loan._id.toString() },
    });
    return {
        loan,
        emi,
    };
}
async function listCustomerLoans(input) {
    const userObjectId = new mongoose_1.Types.ObjectId(input.userId);
    const skip = (input.page - 1) * input.limit;
    const filter = { userId: userObjectId };
    if (input.status)
        filter.status = input.status;
    const [items, total] = await Promise.all([
        Loan_1.LoanModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(input.limit).select('-__v'),
        Loan_1.LoanModel.countDocuments(filter),
    ]);
    return { page: input.page, limit: input.limit, total, items };
}
async function getCustomerLoan(input) {
    const userObjectId = new mongoose_1.Types.ObjectId(input.userId);
    const loanObjectId = new mongoose_1.Types.ObjectId(input.loanId);
    const loan = await Loan_1.LoanModel.findOne({ _id: loanObjectId, userId: userObjectId }).select('-__v');
    if (!loan)
        throw new errorMiddleware_1.ApiError(404, 'Loan not found');
    const emi = (0, emi_1.computeEmiSchedule)({
        principalMinor: loan.principalMinor,
        annualInterestBps: loan.annualInterestBps,
        termMonths: loan.termMonths,
    });
    return { loan, emi };
}
async function listPendingLoansAdmin(input) {
    const skip = (input.page - 1) * input.limit;
    const filter = {};
    if (input.status)
        filter.status = input.status;
    const [items, total] = await Promise.all([
        Loan_1.LoanModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(input.limit).select('-__v'),
        Loan_1.LoanModel.countDocuments(filter),
    ]);
    return { page: input.page, limit: input.limit, total, items };
}
async function decideLoanAdmin(input) {
    const loanObjectId = new mongoose_1.Types.ObjectId(input.loanId);
    const adminObjectId = new mongoose_1.Types.ObjectId(input.adminUserId);
    const session = await (0, mongoose_1.startSession)();
    try {
        const result = await session.withTransaction(async () => {
            const loan = await Loan_1.LoanModel.findById(loanObjectId).session(session);
            if (!loan)
                throw new errorMiddleware_1.ApiError(404, 'Loan not found');
            if (loan.status !== 'pending')
                throw new errorMiddleware_1.ApiError(400, 'Loan already decided');
            loan.status = input.decision;
            loan.decisionNote = input.decisionNote;
            loan.decidedByUserId = adminObjectId;
            loan.decidedAt = new Date();
            await loan.save({ session });
            if (input.decision === 'approved') {
                const account = await Account_1.AccountModel.findById(loan.accountId).session(session);
                if (!account)
                    throw new errorMiddleware_1.ApiError(404, 'Account not found');
                await Account_1.AccountModel.updateOne({ _id: account._id }, { $inc: { balanceMinor: loan.principalMinor } }, { session });
                const reference = (0, refs_1.generateTransactionReference)();
                await Transaction_1.TransactionModel.create([
                    {
                        userId: loan.userId,
                        toAccountId: account._id,
                        type: 'loan_disbursement',
                        status: 'completed',
                        amountMinor: loan.principalMinor,
                        currency: loan.currency,
                        reference,
                        note: `Loan approved${input.decisionNote ? `: ${input.decisionNote}` : ''}`,
                    },
                ], { session });
                await (0, pushService_1.sendUserNotification)(loan.userId.toString(), {
                    title: 'Loan approved',
                    body: `Your loan of ${loan.principalMinor} ${loan.currency} was approved and disbursed.`,
                    data: { type: 'loan', status: 'approved', loanId: loan._id.toString(), reference },
                });
                return { loan, reference };
            }
            await (0, pushService_1.sendUserNotification)(loan.userId.toString(), {
                title: 'Loan update',
                body: `Your loan request was ${input.decision}.`,
                data: { type: 'loan', status: input.decision, loanId: loan._id.toString() },
            });
            return { loan };
        });
        return result;
    }
    finally {
        session.endSession();
    }
}
