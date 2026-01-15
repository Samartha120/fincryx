"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPushToken = exports.getMe = void 0;
const errorMiddleware_1 = require("../../middlewares/errorMiddleware");
const User_1 = require("../../models/User");
async function getMe(req, res) {
    const userId = req.auth?.userId;
    if (!userId)
        throw new errorMiddleware_1.ApiError(401, 'Unauthorized');
    const user = await User_1.UserModel.findById(userId).select('_id fullName email role isOtpVerified');
    if (!user)
        throw new errorMiddleware_1.ApiError(404, 'User not found');
    res.json({
        id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isOtpVerified: user.isOtpVerified,
    });
}
exports.getMe = getMe;

async function registerPushToken(req, res) {
    const userId = req.auth?.userId;
    if (!userId)
        throw new errorMiddleware_1.ApiError(401, 'Unauthorized');

    const token = req.body?.token;
    if (typeof token !== 'string' || token.length === 0) {
        throw new errorMiddleware_1.ApiError(400, 'Invalid token');
    }

    await User_1.UserModel.updateOne({ _id: userId }, { $addToSet: { pushTokens: token } });
    res.status(204).send();
}
exports.registerPushToken = registerPushToken;
