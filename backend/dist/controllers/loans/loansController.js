"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postApplyLoan = postApplyLoan;
exports.getLoans = getLoans;
exports.getLoanById = getLoanById;
exports.adminGetLoans = adminGetLoans;
exports.adminDecideLoan = adminDecideLoan;
const errorMiddleware_1 = require("../../middlewares/errorMiddleware");
const loansService_1 = require("../../services/loans/loansService");
async function postApplyLoan(req, res) {
    const userId = req.auth?.userId;
    if (!userId)
        throw new errorMiddleware_1.ApiError(401, 'Unauthorized');
    const result = await (0, loansService_1.applyLoan)({ userId, ...req.body });
    res.status(201).json({
        loan: result.loan,
        emi: result.emi,
    });
}
async function getLoans(req, res) {
    const userId = req.auth?.userId;
    if (!userId)
        throw new errorMiddleware_1.ApiError(401, 'Unauthorized');
    const { page, limit, status } = req.query;
    const result = await (0, loansService_1.listCustomerLoans)({ userId, page, limit, status });
    res.json(result);
}
async function getLoanById(req, res) {
    const userId = req.auth?.userId;
    if (!userId)
        throw new errorMiddleware_1.ApiError(401, 'Unauthorized');
    const loanIdRaw = req.params.loanId;
    const loanId = Array.isArray(loanIdRaw) ? String(loanIdRaw[0]) : String(loanIdRaw);
    const result = await (0, loansService_1.getCustomerLoan)({ userId, loanId });
    res.json(result);
}
async function adminGetLoans(req, res) {
    const { page, limit, status } = req.query;
    const result = await (0, loansService_1.listPendingLoansAdmin)({ page, limit, status });
    res.json(result);
}
async function adminDecideLoan(req, res) {
    const adminUserId = req.auth?.userId;
    if (!adminUserId)
        throw new errorMiddleware_1.ApiError(401, 'Unauthorized');
    const loanIdRaw = req.params.loanId;
    const loanId = Array.isArray(loanIdRaw) ? String(loanIdRaw[0]) : String(loanIdRaw);
    const result = await (0, loansService_1.decideLoanAdmin)({
        adminUserId,
        loanId,
        decision: req.body.decision,
        decisionNote: req.body.decisionNote,
    });
    res.json(result);
}
