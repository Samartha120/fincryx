"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const env_1 = require("./config/env");
const errorMiddleware_1 = require("./middlewares/errorMiddleware");
const accountsRoutes_1 = require("./routes/accounts/accountsRoutes");
const adminRoutes_1 = require("./routes/admin/adminRoutes");
const authRoutes_1 = require("./routes/auth/authRoutes");
const userRoutes_1 = require("./routes/user/userRoutes");
const loansRoutes_1 = require("./routes/loans/loansRoutes");
const transactionsRoutes_1 = require("./routes/transactions/transactionsRoutes");
function createApp() {
    const app = (0, express_1.default)();
    const env = (0, env_1.getEnv)();
    app.disable('x-powered-by');

    // Render (and most managed platforms) run behind a reverse proxy.
    // express-rate-limit throws if it sees X-Forwarded-For while trust proxy is false.
    const trustProxyEnv = (process.env.TRUST_PROXY || '').toLowerCase();
    const shouldTrustProxy = trustProxyEnv === '1' ||
        trustProxyEnv === 'true' ||
        trustProxyEnv === 'yes' ||
        env.NODE_ENV === 'production' ||
        Boolean(process.env.RENDER) ||
        Boolean(process.env.RENDER_EXTERNAL_URL);
    if (shouldTrustProxy) {
        app.set('trust proxy', 1);
        if (process.env.NODE_ENV !== 'test') {
            console.log('[config] trust proxy enabled');
        }
    }

    app.use((0, helmet_1.default)());
    app.use((0, cors_1.default)({
        origin: (origin, callback) => {
            // Requests from native apps / curl often have no Origin header.
            if (!origin)
                return callback(null, true);
            const allowed = (env.CORS_ORIGIN || '')
                .split(',')
                .map((o) => o.trim())
                .filter(Boolean);
            if (allowed.length === 0)
                return callback(null, true);
            if (allowed.includes(origin))
                return callback(null, true);
            return callback(new Error('Not allowed by CORS'));
        },
        credentials: true,
    }));
    app.use(express_1.default.json({ limit: '1mb' }));
    app.use((0, cookie_parser_1.default)());
    app.use((0, morgan_1.default)('dev'));
    const authLimiter = (0, express_rate_limit_1.default)({
        windowMs: 15 * 60 * 1000,
        max: 100,
        standardHeaders: true,
        legacyHeaders: false,
    });
    app.get(['/health', '/api/health'], (_req, res) => {
        res.json({ ok: true, name: 'Finoryx API' });
    });
    app.use(['/auth', '/api/auth'], authLimiter, authRoutes_1.authRouter);
    app.use(['/user', '/api/user'], userRoutes_1.userRouter);
    app.use(['/admin', '/api/admin'], adminRoutes_1.adminRouter);
    app.use(['/accounts', '/api/accounts'], accountsRoutes_1.accountsRouter);
    app.use(['/loans', '/api/loans'], loansRoutes_1.loansRouter);
    app.use(['/transactions', '/api/transactions'], transactionsRoutes_1.transactionsRouter);
    app.use(errorMiddleware_1.notFoundHandler);
    app.use(errorMiddleware_1.errorHandler);
    return app;
}
