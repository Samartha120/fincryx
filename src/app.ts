import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';

import { getEnv } from './config/env';
import { notFoundHandler, errorHandler } from './middlewares/errorMiddleware';
import { accountsRouter } from './routes/accounts/accountsRoutes';
import { adminRouter } from './routes/admin/adminRoutes';
import { authRouter } from './routes/auth/authRoutes';
import { loansRouter } from './routes/loans/loansRoutes';
import { transactionsRouter } from './routes/transactions/transactionsRoutes';

export function createApp() {
  const app = express();
  const env = getEnv();

  app.disable('x-powered-by');

  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => {
        // Requests from native apps / curl often have no Origin header.
        if (!origin) return callback(null, true);

        const allowed = (env.CORS_ORIGIN || '')
          .split(',')
          .map((o) => o.trim())
          .filter(Boolean);

        if (allowed.length === 0) return callback(null, true);
        if (allowed.includes(origin)) return callback(null, true);

        return callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use(morgan('dev'));

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.get(['/health', '/api/health'], (_req, res) => {
    res.json({ ok: true, name: 'Finoryx API' });
  });

  app.use(['/auth', '/api/auth'], authLimiter, authRouter);
  app.use(['/admin', '/api/admin'], adminRouter);
  app.use(['/accounts', '/api/accounts'], accountsRouter);
  app.use(['/loans', '/api/loans'], loansRouter);
  app.use(['/transactions', '/api/transactions'], transactionsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
