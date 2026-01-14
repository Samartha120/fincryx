"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.loginHandler = loginHandler;
exports.requestOtpHandler = requestOtpHandler;
exports.verifyOtp = verifyOtp;
exports.requestPasswordResetHandler = requestPasswordResetHandler;
exports.confirmPasswordResetHandler = confirmPasswordResetHandler;
exports.refresh = refresh;
exports.logoutHandler = logoutHandler;
const errorMiddleware_1 = require("../../middlewares/errorMiddleware");
const authService_1 = require("../../services/auth/authService");
async function register(req, res) {
    const result = await (0, authService_1.registerCustomer)(req.body);
    const exposeOtp = process.env.NODE_ENV !== 'production';
    res.status(201).json({
        userId: result.userId,
        otp: exposeOtp ? result.otp : undefined,
        otpExpiresAt: result.otpExpiresAt.toISOString(),
    });
}
async function loginHandler(req, res) {
    const result = await (0, authService_1.login)(req.body);
    if (result.requiresOtp) {
        const exposeOtp = process.env.NODE_ENV !== 'production';
        res.status(200).json({
            requiresOtp: true,
            otp: exposeOtp ? result.otp : undefined,
            otpExpiresAt: result.otpExpiresAt.toISOString(),
        });
        return;
    }
    res.status(200).json({ requiresOtp: false, accessToken: result.accessToken, refreshToken: result.refreshToken });
}

async function requestOtpHandler(req, res) {
    const result = await (0, authService_1.requestOtp)(req.body);
    const exposeOtp = process.env.NODE_ENV !== 'production';
    res.status(200).json({
        otp: exposeOtp ? result.otp : undefined,
        otpExpiresAt: result.otpExpiresAt.toISOString(),
    });
}

async function requestPasswordResetHandler(req, res) {
    const result = await (0, authService_1.requestPasswordReset)(req.body);
    const exposeOtp = process.env.NODE_ENV !== 'production';
    res.status(200).json({
        otp: exposeOtp ? result.otp : undefined,
        otpExpiresAt: result.otpExpiresAt.toISOString(),
    });
}

async function confirmPasswordResetHandler(req, res) {
    await (0, authService_1.confirmPasswordReset)(req.body);
    res.status(204).send();
}
async function verifyOtp(req, res) {
    const tokens = await (0, authService_1.verifyOtpAndIssueTokens)(req.body);
    res.status(200).json(tokens);
}
async function refresh(req, res) {
    const token = req.body?.refreshToken || req.cookies?.refreshToken;
    if (!token)
        throw new errorMiddleware_1.ApiError(400, 'Missing refreshToken');
    const result = await (0, authService_1.refreshAccessToken)(token);
    res.status(200).json(result);
}
async function logoutHandler(req, res) {
    const token = req.body?.refreshToken || req.cookies?.refreshToken;
    if (!token)
        throw new errorMiddleware_1.ApiError(400, 'Missing refreshToken');
    await (0, authService_1.logout)(token);
    res.status(204).send();
}
