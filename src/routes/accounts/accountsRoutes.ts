import { Router } from 'express';

import { getAccounts, postTransfer } from '../../controllers/accounts/accountsController';
import { requireAuth } from '../../middlewares/authMiddleware';
import { validateBody } from '../../middlewares/validate';
import { transferBodySchema } from '../../validators/accountsValidators';

export const accountsRouter = Router();

accountsRouter.get('/', requireAuth, getAccounts);
accountsRouter.post('/transfer', requireAuth, validateBody(transferBodySchema), postTransfer);
