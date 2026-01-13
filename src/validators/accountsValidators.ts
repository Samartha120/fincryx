import { z } from 'zod';

import { moneyMinorSchema } from '../utils/money';

export const transferBodySchema = z.object({
  fromAccountId: z.string().min(1),
  toAccountNumber: z.string().min(6).max(32),
  amountMinor: moneyMinorSchema,
  note: z.string().max(140).optional(),
});
