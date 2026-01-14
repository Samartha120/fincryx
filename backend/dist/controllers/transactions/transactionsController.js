"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTransactions = getTransactions;
const errorMiddleware_1 = require("../../middlewares/errorMiddleware");
const transactionsService_1 = require("../../services/transactions/transactionsService");
const pagination_1 = require("../../utils/pagination");
async function getTransactions(req, res) {
    const userId = req.auth?.userId;
    if (!userId)
        throw new errorMiddleware_1.ApiError(401, 'Unauthorized');
    const { page, limit } = (0, pagination_1.parsePagination)(req.query);
    const result = await (0, transactionsService_1.listTransactions)({ userId, page, limit });
    res.json(result);
}
