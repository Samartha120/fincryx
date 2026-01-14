"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signAccessToken = signAccessToken;
exports.signRefreshToken = signRefreshToken;
exports.verifyRefreshToken = verifyRefreshToken;
exports.refreshTokenExpiryDate = refreshTokenExpiryDate;
const crypto_1 = __importDefault(require("crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function signAccessToken(userId, role) {
    const secret = process.env.JWT_ACCESS_SECRET;
    const expiresIn = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
    if (!secret)
        throw new Error('JWT_ACCESS_SECRET missing');
    const claims = { sub: userId, role, typ: 'access' };
    return jsonwebtoken_1.default.sign(claims, secret, { expiresIn: expiresIn });
}
function signRefreshToken(userId, role) {
    const secret = process.env.JWT_REFRESH_SECRET;
    const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
    if (!secret)
        throw new Error('JWT_REFRESH_SECRET missing');
    const jti = crypto_1.default.randomUUID();
    const claims = { sub: userId, role, typ: 'refresh', jti };
    const token = jsonwebtoken_1.default.sign(claims, secret, { expiresIn: expiresIn });
    return { token, jti };
}
function verifyRefreshToken(token) {
    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret)
        throw new Error('JWT_REFRESH_SECRET missing');
    const payload = jsonwebtoken_1.default.verify(token, secret);
    if (payload.typ !== 'refresh' || !payload.jti) {
        throw new Error('Invalid refresh token');
    }
    return payload;
}
function refreshTokenExpiryDate() {
    const raw = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
    const match = raw.match(/^(\d+)([smhd])$/i);
    if (!match) {
        // fallback: 7 days
        return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }
    const value = Number(match[1]);
    const unit = match[2].toLowerCase();
    const multipliers = {
        s: 1000,
        m: 60 * 1000,
        h: 60 * 60 * 1000,
        d: 24 * 60 * 60 * 1000,
    };
    return new Date(Date.now() + value * multipliers[unit]);
}
