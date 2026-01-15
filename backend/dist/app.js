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
const analyticsRoutes_1 = require("./routes/analytics/analyticsRoutes");
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
    app.get('/', (_req, res) => {
        res
            .status(200)
            .send('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Finoryx API</title><style>body{margin:0;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,system-ui,sans-serif;background:#0f172a;color:#f9fafb;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px}main{max-width:720px;width:100%;background:rgba(15,23,42,0.88);border-radius:16px;border:1px solid rgba(148,163,184,0.35);box-shadow:0 24px 80px rgba(15,23,42,0.7);padding:28px 24px}h1{font-size:24px;margin:0 0 8px;color:#e5e7eb}p{margin:4px 0;color:#9ca3af;font-size:14px}code{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:13px;background:#020617;border-radius:6px;padding:2px 6px}section{margin-top:16px;padding-top:12px;border-top:1px solid rgba(55,65,81,0.7)}.pill{display:inline-flex;align-items:center;border-radius:9999px;border:1px solid rgba(148,163,184,0.5);padding:2px 10px;font-size:11px;color:#e5e7eb;margin-right:6px}.pill span{width:7px;height:7px;border-radius:9999px;margin-right:6px;background:#22c55e}.links{margin-top:10px;display:flex;flex-wrap:wrap;gap:8px}.link{font-size:12px;color:#bfdbfe;text-decoration:none;border-bottom:1px dashed rgba(191,219,254,0.5)}.link:hover{color:#eff6ff;border-bottom-style:solid}</style></head><body><main><div class="pill"><span></span>API Online</div><h1>Finoryx backend API</h1><p>This service powers the Finoryx application. It is intended to be used by a web or mobile client.</p><section><p>Health check:</p><p><code>GET /health</code> or <code>GET /api/health</code></p></section><section><p>Auth &amp; user:</p><p><code>POST /api/auth/register</code>, <code>POST /api/auth/login</code>, <code>GET /api/user/me</code></p></section><section><p>Accounts, loans, transactions &amp; analytics are available under the <code>/api/</code> prefix.</p><p class="links"><a class="link" href="/api/health">Try health check</a></p></section></main></body></html>');
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
    app.use(['/analytics', '/api/analytics'], analyticsRoutes_1.analyticsRouter);
    app.use(errorMiddleware_1.notFoundHandler);
    app.use(errorMiddleware_1.errorHandler);
    return app;
}
