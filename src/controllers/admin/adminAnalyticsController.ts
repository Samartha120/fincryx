import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';

import { getAdminStats, listAllTransactions } from '../../services/admin/adminAnalyticsService';
import { parsePagination } from '../../utils/pagination';

export async function getStats(_req: ExpressRequest, res: ExpressResponse): Promise<void> {
  const stats = await getAdminStats();
  res.json(stats);
}

export async function getAllTransactions(req: ExpressRequest, res: ExpressResponse): Promise<void> {
  const { page, limit } = parsePagination(req.query);

  const result = await listAllTransactions({ page, limit });
  res.json(result);
}
