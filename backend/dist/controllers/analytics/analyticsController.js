"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLoanAnalytics = exports.getTransactionAnalytics = void 0;
const analyticsService_1 = require("../../services/analytics/analyticsService");

async function getTransactionAnalytics(req, res, next) {
  try {
    const userId = req.auth?.userId;
    const range = (req.query?.range || 'monthly').toString();
    const pointsRaw = req.query?.points;
    const parsedPoints = pointsRaw ? Number(pointsRaw) : NaN;
    const points = Number.isFinite(parsedPoints) ? Math.max(1, Math.min(24, parsedPoints)) : undefined;

    const data = await (0, analyticsService_1.buildTransactionAnalytics)({ userId, range, points });
    res.json(data);
  } catch (e) {
    next(e);
  }
}
exports.getTransactionAnalytics = getTransactionAnalytics;

async function getLoanAnalytics(req, res, next) {
  try {
    const userId = req.auth?.userId;
    const data = await (0, analyticsService_1.buildLoanAnalytics)({ userId });
    res.json(data);
  } catch (e) {
    next(e);
  }
}
exports.getLoanAnalytics = getLoanAnalytics;
