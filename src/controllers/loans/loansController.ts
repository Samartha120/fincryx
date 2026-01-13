import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';

import { ApiError } from '../../middlewares/errorMiddleware';
import { decideLoanAdmin, getCustomerLoan, listCustomerLoans, listPendingLoansAdmin, applyLoan } from '../../services/loans/loansService';

export async function postApplyLoan(req: ExpressRequest, res: ExpressResponse): Promise<void> {
  const userId = req.auth?.userId;
  if (!userId) throw new ApiError(401, 'Unauthorized');

  const result = await applyLoan({ userId, ...req.body });
  res.status(201).json({
    loan: result.loan,
    emi: result.emi,
  });
}

export async function getLoans(req: ExpressRequest, res: ExpressResponse): Promise<void> {
  const userId = req.auth?.userId;
  if (!userId) throw new ApiError(401, 'Unauthorized');

  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;

  const result = await listCustomerLoans({ userId, page, limit, status });
  res.json(result);
}

export async function getLoanById(req: ExpressRequest, res: ExpressResponse): Promise<void> {
  const userId = req.auth?.userId;
  if (!userId) throw new ApiError(401, 'Unauthorized');

  const loanIdRaw = (req.params as Record<string, unknown>).loanId;
  const loanId = Array.isArray(loanIdRaw) ? String(loanIdRaw[0]) : String(loanIdRaw);
  const result = await getCustomerLoan({ userId, loanId });
  res.json(result);
}

export async function adminGetLoans(req: ExpressRequest, res: ExpressResponse): Promise<void> {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;

  const result = await listPendingLoansAdmin({ page, limit, status });
  res.json(result);
}

export async function adminDecideLoan(req: ExpressRequest, res: ExpressResponse): Promise<void> {
  const adminUserId = req.auth?.userId;
  if (!adminUserId) throw new ApiError(401, 'Unauthorized');

  const loanIdRaw = (req.params as Record<string, unknown>).loanId;
  const loanId = Array.isArray(loanIdRaw) ? String(loanIdRaw[0]) : String(loanIdRaw);

  const result = await decideLoanAdmin({
    adminUserId,
    loanId,
    decision: req.body.decision,
    decisionNote: req.body.decisionNote,
  });

  res.json(result);
}
