import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';

import { ApiError } from '../../middlewares/errorMiddleware';
import { listTransactions } from '../../services/transactions/transactionsService';
import { parsePagination } from '../../utils/pagination';

export async function getTransactions(req: ExpressRequest, res: ExpressResponse): Promise<void> {
  const userId = req.auth?.userId;
  if (!userId) throw new ApiError(401, 'Unauthorized');

  const { page, limit } = parsePagination(req.query);

  const result = await listTransactions({ userId, page, limit });
  res.json(result);
}
