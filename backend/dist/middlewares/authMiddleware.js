"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const errorMiddleware_1 = require("./errorMiddleware");
function requireAuth(req, _res, next) {
    const header = req.header('authorization') || '';
    const match = header.match(/^Bearer\s+(.+)$/i);
    if (!match) {
        next(new errorMiddleware_1.ApiError(401, 'Missing Authorization header'));
        return;
    }
    const token = match[1];
    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret) {
        next(new errorMiddleware_1.ApiError(500, 'Server misconfigured'));
        return;
    }
    try {
        const payload = jsonwebtoken_1.default.verify(token, secret);
        if (payload.typ !== 'access') {
            next(new errorMiddleware_1.ApiError(401, 'Invalid token type'));
            return;
        }
        req.auth = { userId: payload.sub, role: payload.role };
        next();
    }
    catch {
        next(new errorMiddleware_1.ApiError(401, 'Invalid or expired token'));
    }
}
