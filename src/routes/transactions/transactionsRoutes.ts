import { Router } from 'express';

import { getTransactions } from '../../controllers/transactions/transactionsController';
import { requireAuth } from '../../middlewares/authMiddleware';

export const transactionsRouter = Router();

transactionsRouter.get('/', requireAuth, getTransactions);
