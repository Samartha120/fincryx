"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRouter = void 0;
const express_1 = require("express");
const userController_1 = require("../../controllers/user/userController");
const authMiddleware_1 = require("../../middlewares/authMiddleware");
exports.userRouter = (0, express_1.Router)();

// Profile
exports.userRouter.get('/me', authMiddleware_1.requireAuth, userController_1.getMe);
exports.userRouter.post('/push-token', authMiddleware_1.requireAuth, userController_1.registerPushToken);
