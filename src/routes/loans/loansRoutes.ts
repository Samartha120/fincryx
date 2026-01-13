import { Router } from 'express';

import {
  adminDecideLoan,
  adminGetLoans,
  getLoanById,
  getLoans,
  postApplyLoan,
} from '../../controllers/loans/loansController';
import { requireAuth } from '../../middlewares/authMiddleware';
import { requireRole } from '../../middlewares/roleMiddleware';
import { validateBody } from '../../middlewares/validate';
import { applyLoanBodySchema, adminDecisionBodySchema } from '../../validators/loans/loansValidators';

export const loansRouter = Router();

// Admin
loansRouter.get('/admin/all', requireAuth, requireRole('admin'), adminGetLoans);
loansRouter.post('/admin/:loanId/decision', requireAuth, requireRole('admin'), validateBody(adminDecisionBodySchema), adminDecideLoan);

// Customer
loansRouter.post('/', requireAuth, validateBody(applyLoanBodySchema), postApplyLoan);
loansRouter.get('/', requireAuth, getLoans);
loansRouter.get('/:loanId', requireAuth, getLoanById);
