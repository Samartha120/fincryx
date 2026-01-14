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
function errorHandler(err, _req, res, _next) {
    if (err instanceof ApiError) {
        res.status(err.statusCode).json({ message: err.message, details: err.details });
        return;
    }
    const isProduction = process.env.NODE_ENV === 'production';
    const message = isProduction ? 'Internal Server Error' : err instanceof Error ? err.message : 'Internal Server Error';
    res.status(500).json({ message });
}
