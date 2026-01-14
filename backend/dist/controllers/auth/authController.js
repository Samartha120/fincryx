"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.loginHandler = loginHandler;
exports.verifyOtp = verifyOtp;
exports.refresh = refresh;
exports.logoutHandler = logoutHandler;
const errorMiddleware_1 = require("../../middlewares/errorMiddleware");
const authService_1 = require("../../services/auth/authService");
async function register(req, res) {
    const result = await (0, authService_1.registerCustomer)(req.body);
    res.status(201).json({
        userId: result.userId,
        otp: result.otp,
        otpExpiresAt: result.otpExpiresAt.toISOString(),
    });
}
async function loginHandler(req, res) {
    const result = await (0, authService_1.login)(req.body);
    if (result.requiresOtp) {
        res.status(200).json({ requiresOtp: true, otp: result.otp, otpExpiresAt: result.otpExpiresAt.toISOString() });
        return;
    }
    res.status(200).json({ requiresOtp: false, accessToken: result.accessToken, refreshToken: result.refreshToken });
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
