"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStats = getStats;
exports.getAllTransactions = getAllTransactions;
const adminAnalyticsService_1 = require("../../services/admin/adminAnalyticsService");
const pagination_1 = require("../../utils/pagination");
async function getStats(_req, res) {
    const stats = await (0, adminAnalyticsService_1.getAdminStats)();
    res.json(stats);
}
async function getAllTransactions(req, res) {
    const { page, limit } = (0, pagination_1.parsePagination)(req.query);
    const result = await (0, adminAnalyticsService_1.listAllTransactions)({ page, limit });
    res.json(result);
}
