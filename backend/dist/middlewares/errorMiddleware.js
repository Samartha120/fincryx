"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiError = void 0;
exports.notFoundHandler = notFoundHandler;
exports.errorHandler = errorHandler;
class ApiError extends Error {
    statusCode;
    details;
    constructor(statusCode, message, details) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
    }
}
exports.ApiError = ApiError;
function notFoundHandler(req, res) {
    res.status(404).json({ message: `Route not found: ${req.method} ${req.path}` });
}
function errorHandler(err, req, res, _next) {
    const isProduction = process.env.NODE_ENV === 'production';
    const isTest = process.env.NODE_ENV === 'test';
    if (!isTest) {
        if (err instanceof Error) {
            console.error('[error]', req.method, req.path, err.message, err.stack);
        }
        else {
            console.error('[error]', req.method, req.path, String(err));
        }
    }
    if (err instanceof ApiError) {
        res.status(err.statusCode).json({ message: err.message, details: err.details });
        return;
    }
    const message = isProduction ? 'Internal Server Error' : err instanceof Error ? err.message : 'Internal Server Error';
    res.status(500).json({ message });
}
