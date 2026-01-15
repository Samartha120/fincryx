"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOtpEmail = sendOtpEmail;
exports.sendPasswordResetEmail = sendPasswordResetEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));

function hasSmtpConfig() {
    return !!(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function withTimeout(promise, timeoutMs, label) {
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
    });
    // Ensure the original promise is observed even if the timeout wins.
    promise.catch(() => { });
    return Promise.race([promise, timeoutPromise]);
}

async function sendOtpEmail(params) {
    const { to, code, expiresMinutes } = params;

    // In dev / when SMTP isn't configured, log the OTP instead of failing.
    if (!hasSmtpConfig()) {
        console.log(`[OTP] SMTP not configured. OTP for ${to}: ${code} (expires in ${expiresMinutes} minutes)`);
        return;
    }

    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.SMTP_FROM || user;
    const appName = process.env.APP_NAME || 'Finoryx';

    const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || port === 465;

    const transporter = nodemailer_1.default.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
        connectionTimeout: 6000,
        greetingTimeout: 6000,
        socketTimeout: 8000,
    });

    const subject = `${appName} verification code`;
    const text = `Your ${appName} verification code is ${code}. It expires in ${expiresMinutes} minutes.`;

    // Simple, robust HTML that renders well in most clients
    const html = `
<div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
  <h2 style="margin: 0 0 12px;">${appName} verification</h2>
  <p style="margin: 0 0 12px;">Use this code to verify your account:</p>
  <div style="font-size: 28px; letter-spacing: 6px; font-weight: 700; padding: 14px 16px; display: inline-block; background: #F3F4F6; border-radius: 10px;">
    ${code}
  </div>
  <p style="margin: 12px 0 0; color: #6B7280;">This code expires in ${expiresMinutes} minutes.</p>
  <p style="margin: 12px 0 0; color: #6B7280;">If you didn’t request this, you can ignore this email.</p>
</div>`;

    try {
        await withTimeout(transporter.sendMail({
            from,
            to,
            subject,
            text,
            html,
        }), 9000, 'sendOtpEmail');
    }
    catch (err) {
        // Fail open: OTP issuance must not hang the API.
        console.warn(`[OTP] Failed to send email to ${to}.`, err instanceof Error ? err.message : err);
        console.log(`[OTP] Code for ${to}: ${code} (expires in ${expiresMinutes} minutes)`);
    }
}

async function sendPasswordResetEmail(params) {
    const { to, code, expiresMinutes } = params;

    // In dev / when SMTP isn't configured, log the OTP instead of failing.
    if (!hasSmtpConfig()) {
        console.log(`[RESET] SMTP not configured. Password reset code for ${to}: ${code} (expires in ${expiresMinutes} minutes)`);
        return;
    }

    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.SMTP_FROM || user;
    const appName = process.env.APP_NAME || 'Finoryx';

    const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || port === 465;

    const transporter = nodemailer_1.default.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
        connectionTimeout: 6000,
        greetingTimeout: 6000,
        socketTimeout: 8000,
    });

    const subject = `${appName} password reset code`;
    const text = `Your ${appName} password reset code is ${code}. It expires in ${expiresMinutes} minutes.`;

    const html = `
<div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
  <h2 style="margin: 0 0 12px;">Reset your ${appName} password</h2>
  <p style="margin: 0 0 12px;">Use this code to reset your password:</p>
  <div style="font-size: 28px; letter-spacing: 6px; font-weight: 700; padding: 14px 16px; display: inline-block; background: #F3F4F6; border-radius: 10px;">
    ${code}
  </div>
  <p style="margin: 12px 0 0; color: #6B7280;">This code expires in ${expiresMinutes} minutes.</p>
  <p style="margin: 12px 0 0; color: #6B7280;">If you didn’t request this, you can ignore this email.</p>
</div>`;

    try {
        await withTimeout(transporter.sendMail({
            from,
            to,
            subject,
            text,
            html,
        }), 9000, 'sendPasswordResetEmail');
    }
    catch (err) {
        // Fail open: reset code issuance must not hang the API.
        console.warn(`[RESET] Failed to send email to ${to}.`, err instanceof Error ? err.message : err);
        console.log(`[RESET] Code for ${to}: ${code} (expires in ${expiresMinutes} minutes)`);
    }
}
