"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = getMe;
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
