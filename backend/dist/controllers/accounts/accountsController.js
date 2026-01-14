"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAccounts = getAccounts;
exports.postTransfer = postTransfer;
const errorMiddleware_1 = require("../../middlewares/errorMiddleware");
const accountsService_1 = require("../../services/accounts/accountsService");
async function getAccounts(req, res) {
    const userId = req.auth?.userId;
    if (!userId)
        throw new errorMiddleware_1.ApiError(401, 'Unauthorized');
    const accounts = await (0, accountsService_1.listAccounts)(userId);
    res.json({ items: accounts });
}
async function postTransfer(req, res) {
    const userId = req.auth?.userId;
    if (!userId)
        throw new errorMiddleware_1.ApiError(401, 'Unauthorized');
    const result = await (0, accountsService_1.transferInternal)({ userId, ...req.body });
    res.status(201).json(result);
}
