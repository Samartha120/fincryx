import { z } from 'zod';

import { moneyMinorSchema } from '../../utils/money';

export const applyLoanBodySchema = z.object({
  accountId: z.string().min(1),
  principalMinor: moneyMinorSchema,
  annualInterestBps: z.coerce.number().int().min(0).max(100000),
  termMonths: z.coerce.number().int().min(1).max(600),
});

export const listLoansQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
});

export const adminDecisionBodySchema = z.object({
  decision: z.enum(['approved', 'rejected']),
  decisionNote: z.string().max(200).optional(),
});
