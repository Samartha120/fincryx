"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = requireRole;
const errorMiddleware_1 = require("./errorMiddleware");
function requireRole(...roles) {
    return (req, _res, next) => {
        const role = req.auth?.role;
        if (!role) {
            next(new errorMiddleware_1.ApiError(401, 'Unauthorized'));
            return;
        }
        if (!roles.includes(role)) {
            next(new errorMiddleware_1.ApiError(403, 'Forbidden'));
            return;
        }
        next();
    };
}
