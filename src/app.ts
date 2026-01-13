import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';

import { notFoundHandler, errorHandler } from './middlewares/errorMiddleware';
import { accountsRouter } from './routes/accounts/accountsRoutes';
import { adminRouter } from './routes/admin/adminRoutes';
import { authRouter } from './routes/auth/authRoutes';
import { loansRouter } from './routes/loans/loansRoutes';
import { transactionsRouter } from './routes/transactions/transactionsRoutes';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');

  app.use(helmet());
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:19006',
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

  app.get('/health', (_req, res) => {
    res.json({ ok: true, name: 'Finoryx API' });
  });

  app.use('/auth', authLimiter, authRouter);
  app.use('/admin', adminRouter);
  app.use('/accounts', accountsRouter);
  app.use('/loans', loansRouter);
  app.use('/transactions', transactionsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
