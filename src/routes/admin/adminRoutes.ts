import { Router } from 'express';

import { getAllTransactions, getStats } from '../../controllers/admin/adminAnalyticsController';
import { listUsers } from '../../controllers/admin/adminUsersController';
import { requireAuth } from '../../middlewares/authMiddleware';
import { requireRole } from '../../middlewares/roleMiddleware';

export const adminRouter = Router();

adminRouter.get('/users', requireAuth, requireRole('admin'), listUsers);

adminRouter.get('/stats', requireAuth, requireRole('admin'), getStats);
adminRouter.get('/transactions', requireAuth, requireRole('admin'), getAllTransactions);
