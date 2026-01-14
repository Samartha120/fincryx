"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.issueMockOtp = issueMockOtp;
exports.verifyMockOtp = verifyMockOtp;
const errorMiddleware_1 = require("../../middlewares/errorMiddleware");
const User_1 = require("../../models/User");
const password_1 = require("../../utils/password");
const MOCK_OTP = '123456';
async function issueMockOtp(email) {
    const user = await User_1.UserModel.findOne({ email: email.toLowerCase() });
    if (!user)
        throw new errorMiddleware_1.ApiError(404, 'User not found');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    const otpCodeHash = await (0, password_1.hashPassword)(MOCK_OTP);
    user.otpCodeHash = otpCodeHash;
    user.otpExpiresAt = expiresAt;
    await user.save();
    const exposeOtp = process.env.NODE_ENV !== 'production';
    return { otp: exposeOtp ? MOCK_OTP : '******', expiresAt };
}
async function verifyMockOtp(email, otp) {
    const user = await User_1.UserModel.findOne({ email: email.toLowerCase() });
    if (!user)
        throw new errorMiddleware_1.ApiError(404, 'User not found');
    if (!user.otpCodeHash || !user.otpExpiresAt)
        throw new errorMiddleware_1.ApiError(400, 'OTP not issued');
    if (user.otpExpiresAt.getTime() < Date.now())
        throw new errorMiddleware_1.ApiError(400, 'OTP expired');
    const ok = await (0, password_1.verifyPassword)(otp, user.otpCodeHash);
    if (!ok)
        throw new errorMiddleware_1.ApiError(400, 'Invalid OTP');
    user.isOtpVerified = true;
    user.otpCodeHash = undefined;
    user.otpExpiresAt = undefined;
    await user.save();
}
