"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsRouter = void 0;
const express_1 = require("express");
const analyticsController_1 = require("../../controllers/analytics/analyticsController");
const authMiddleware_1 = require("../../middlewares/authMiddleware");
exports.analyticsRouter = (0, express_1.Router)();
exports.analyticsRouter.get('/transactions', authMiddleware_1.requireAuth, analyticsController_1.getTransactionAnalytics);
exports.analyticsRouter.get('/loans', authMiddleware_1.requireAuth, analyticsController_1.getLoanAnalytics);
