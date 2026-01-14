"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCustomer = registerCustomer;
exports.login = login;
exports.verifyOtpAndIssueTokens = verifyOtpAndIssueTokens;
exports.refreshAccessToken = refreshAccessToken;
exports.logout = logout;
const mongoose_1 = require("mongoose");
const errorMiddleware_1 = require("../../middlewares/errorMiddleware");
const Account_1 = require("../../models/Account");
const RefreshToken_1 = require("../../models/RefreshToken");
const User_1 = require("../../models/User");
const crypto_1 = require("../../utils/crypto");
const password_1 = require("../../utils/password");
const refs_1 = require("../../utils/refs");
const jwtService_1 = require("./jwtService");
const otpService_1 = require("./otpService");
async function registerCustomer(input) {
    const email = input.email.toLowerCase();
    const existing = await User_1.UserModel.findOne({ email });
    if (existing)
        throw new errorMiddleware_1.ApiError(409, 'Email already registered');
    const passwordHash = await (0, password_1.hashPassword)(input.password);
    const user = await User_1.UserModel.create({
        role: 'customer',
        fullName: input.fullName,
        email,
        phone: input.phone,
        passwordHash,
        isOtpVerified: false,
    });
    await Account_1.AccountModel.create({
        userId: user._id,
        accountNumber: (0, refs_1.generateAccountNumber)(),
        type: 'checking',
        currency: 'INR',
        balanceMinor: 0,
    });
    const otpIssued = await (0, otpService_1.issueMockOtp)(email);
    return { userId: user._id.toString(), otp: otpIssued.otp, otpExpiresAt: otpIssued.expiresAt };
}
async function login(input) {
    const email = input.email.toLowerCase();
    const user = await User_1.UserModel.findOne({ email });
    if (!user)
        throw new errorMiddleware_1.ApiError(401, 'Invalid credentials');
    const ok = await (0, password_1.verifyPassword)(input.password, user.passwordHash);
    if (!ok)
        throw new errorMiddleware_1.ApiError(401, 'Invalid credentials');
    if (!user.isOtpVerified) {
        const otpIssued = await (0, otpService_1.issueMockOtp)(email);
        return { requiresOtp: true, otp: otpIssued.otp, otpExpiresAt: otpIssued.expiresAt };
    }
    const accessToken = (0, jwtService_1.signAccessToken)(user._id.toString(), user.role);
    const { token: refreshToken } = (0, jwtService_1.signRefreshToken)(user._id.toString(), user.role);
    await RefreshToken_1.RefreshTokenModel.create({
        userId: user._id,
        tokenHash: (0, crypto_1.sha256Base64Url)(refreshToken),
        expiresAt: (0, jwtService_1.refreshTokenExpiryDate)(),
    });
    return { requiresOtp: false, accessToken, refreshToken };
}
async function verifyOtpAndIssueTokens(input) {
    const email = input.email.toLowerCase();
    await (0, otpService_1.verifyMockOtp)(email, input.otp);
    const user = await User_1.UserModel.findOne({ email });
    if (!user)
        throw new errorMiddleware_1.ApiError(404, 'User not found');
    const accessToken = (0, jwtService_1.signAccessToken)(user._id.toString(), user.role);
    const { token: refreshToken } = (0, jwtService_1.signRefreshToken)(user._id.toString(), user.role);
    await RefreshToken_1.RefreshTokenModel.create({
        userId: user._id,
        tokenHash: (0, crypto_1.sha256Base64Url)(refreshToken),
        expiresAt: (0, jwtService_1.refreshTokenExpiryDate)(),
    });
    return { accessToken, refreshToken };
}
async function refreshAccessToken(refreshToken) {
    let payload;
    try {
        payload = (0, jwtService_1.verifyRefreshToken)(refreshToken);
    }
    catch {
        throw new errorMiddleware_1.ApiError(401, 'Invalid refresh token');
    }
    const tokenHash = (0, crypto_1.sha256Base64Url)(refreshToken);
    const userObjectId = new mongoose_1.Types.ObjectId(payload.sub);
    const stored = await RefreshToken_1.RefreshTokenModel.findOne({
        userId: userObjectId,
        tokenHash,
        revokedAt: { $exists: false },
    });
    if (!stored)
        throw new errorMiddleware_1.ApiError(401, 'Refresh token revoked');
    if (stored.expiresAt.getTime() < Date.now())
        throw new errorMiddleware_1.ApiError(401, 'Refresh token expired');
    const accessToken = (0, jwtService_1.signAccessToken)(payload.sub, payload.role);
    return { accessToken };
}
async function logout(refreshToken) {
    const tokenHash = (0, crypto_1.sha256Base64Url)(refreshToken);
    await RefreshToken_1.RefreshTokenModel.updateOne({ tokenHash, revokedAt: { $exists: false } }, { $set: { revokedAt: new Date() } });
}
