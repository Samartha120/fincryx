"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateQuery = exports.validateBody = void 0;
const errorMiddleware_1 = require("./errorMiddleware");
function validateBody(schema) {
    return (req, _res, next) => {
        const candidate = (req.body ?? {});
        const parsed = schema.safeParse(candidate);
        if (!parsed.success) {
            next(new errorMiddleware_1.ApiError(400, 'Validation error', parsed.error.flatten()));
            return;
        }
        req.body = parsed.data;
        next();
    };
}
exports.validateBody = validateBody;
function validateQuery(schema) {
    return (req, _res, next) => {
        const candidate = (req.query ?? {});
        const parsed = schema.safeParse(candidate);
        if (!parsed.success) {
            next(new errorMiddleware_1.ApiError(400, 'Validation error', parsed.error.flatten()));
            return;
        }
        req.query = parsed.data;
        next();
    };
}
exports.validateQuery = validateQuery;
