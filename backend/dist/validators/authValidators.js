"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logoutBodySchema = exports.refreshBodySchema = exports.passwordResetConfirmBodySchema = exports.passwordResetRequestBodySchema = exports.otpVerifyBodySchema = exports.otpRequestBodySchema = exports.loginBodySchema = exports.registerBodySchema = void 0;
const zod_1 = require("zod");
exports.registerBodySchema = zod_1.z.object({
    fullName: zod_1.z.string().min(2).max(100),
    email: zod_1.z.string().email().max(255),
    phone: zod_1.z.string().min(6).max(20).optional(),
    password: zod_1.z.string().min(8).max(72),
});
exports.loginBodySchema = zod_1.z.object({
    email: zod_1.z.string().email().max(255),
    password: zod_1.z.string().min(1).max(72),
});
exports.otpVerifyBodySchema = zod_1.z.object({
    email: zod_1.z.string().email().max(255),
    otp: zod_1.z.string().regex(/^\d{6}$/),
});
exports.otpRequestBodySchema = zod_1.z.object({
    email: zod_1.z.string().email().max(255),
});

exports.passwordResetRequestBodySchema = zod_1.z.object({
    email: zod_1.z.string().email().max(255),
});

exports.passwordResetConfirmBodySchema = zod_1.z.object({
    email: zod_1.z.string().email().max(255),
    otp: zod_1.z.string().regex(/^\d{6}$/),
    newPassword: zod_1.z.string().min(8).max(72),
});
exports.refreshBodySchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(10).optional(),
});
exports.logoutBodySchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(10).optional(),
});
