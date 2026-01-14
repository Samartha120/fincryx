"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.issueOtp = issueOtp;
exports.issueOtpIfUserExists = issueOtpIfUserExists;
exports.verifyOtp = verifyOtp;
exports.issuePasswordResetOtpIfUserExists = issuePasswordResetOtpIfUserExists;
exports.verifyPasswordResetOtp = verifyPasswordResetOtp;
const errorMiddleware_1 = require("../../middlewares/errorMiddleware");
const User_1 = require("../../models/User");
const emailService_1 = require("../email/emailService");
const password_1 = require("../../utils/password");
const crypto = require("crypto");
const OTP_LENGTH = 6;
const OTP_EXPIRES_MINUTES = 10;

function generateOtpCode() {
    const n = crypto.randomInt(0, 10 ** OTP_LENGTH);
    return String(n).padStart(OTP_LENGTH, '0');
}

async function issueOtp(email) {
    const normalizedEmail = email.toLowerCase();
    const user = await User_1.UserModel.findOne({ email: normalizedEmail });
    if (!user)
        throw new errorMiddleware_1.ApiError(404, 'User not found');

    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000);
    const otpCodeHash = await (0, password_1.hashPassword)(code);

    user.otpCodeHash = otpCodeHash;
    user.otpExpiresAt = expiresAt;
    await user.save();

    await (0, emailService_1.sendOtpEmail)({
        to: normalizedEmail,
        code,
        expiresMinutes: OTP_EXPIRES_MINUTES,
    });

    const exposeOtp = process.env.NODE_ENV !== 'production';
    return { otp: exposeOtp ? code : '******', expiresAt };
}

// Avoid user enumeration: if user doesn't exist, behave like success.
async function issueOtpIfUserExists(email) {
    const normalizedEmail = email.toLowerCase();
    const user = await User_1.UserModel.findOne({ email: normalizedEmail });
    if (!user)
        return { otp: '******', expiresAt: new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000) };
    if (user.isOtpVerified)
        return { otp: '******', expiresAt: new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000) };
    return issueOtp(normalizedEmail);
}

async function verifyOtp(email, otp) {
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

async function issuePasswordResetOtpIfUserExists(email) {
    const normalizedEmail = email.toLowerCase();
    const user = await User_1.UserModel.findOne({ email: normalizedEmail });
    // Avoid user enumeration
    if (!user)
        return { otp: '******', expiresAt: new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000) };

    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000);
    const codeHash = await (0, password_1.hashPassword)(code);

    user.passwordResetCodeHash = codeHash;
    user.passwordResetExpiresAt = expiresAt;
    await user.save();

    await (0, emailService_1.sendPasswordResetEmail)({
        to: normalizedEmail,
        code,
        expiresMinutes: OTP_EXPIRES_MINUTES,
    });

    const exposeOtp = process.env.NODE_ENV !== 'production';
    return { otp: exposeOtp ? code : '******', expiresAt };
}

async function verifyPasswordResetOtp(email, otp) {
    const user = await User_1.UserModel.findOne({ email: email.toLowerCase() });
    if (!user)
        throw new errorMiddleware_1.ApiError(404, 'User not found');
    if (!user.passwordResetCodeHash || !user.passwordResetExpiresAt)
        throw new errorMiddleware_1.ApiError(400, 'Reset code not issued');
    if (user.passwordResetExpiresAt.getTime() < Date.now())
        throw new errorMiddleware_1.ApiError(400, 'Reset code expired');
    const ok = await (0, password_1.verifyPassword)(otp, user.passwordResetCodeHash);
    if (!ok)
        throw new errorMiddleware_1.ApiError(400, 'Invalid reset code');
    return user;
}
