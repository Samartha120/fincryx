"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionsRouter = void 0;
const express_1 = require("express");
const transactionsController_1 = require("../../controllers/transactions/transactionsController");
const authMiddleware_1 = require("../../middlewares/authMiddleware");
exports.transactionsRouter = (0, express_1.Router)();
exports.transactionsRouter.get('/', authMiddleware_1.requireAuth, transactionsController_1.getTransactions);
