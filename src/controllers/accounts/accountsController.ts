import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';

import { ApiError } from '../../middlewares/errorMiddleware';
import { listAccounts, transferInternal } from '../../services/accounts/accountsService';

export async function getAccounts(req: ExpressRequest, res: ExpressResponse): Promise<void> {
  const userId = req.auth?.userId;
  if (!userId) throw new ApiError(401, 'Unauthorized');

  const accounts = await listAccounts(userId);
  res.json({ items: accounts });
}

export async function postTransfer(req: ExpressRequest, res: ExpressResponse): Promise<void> {
  const userId = req.auth?.userId;
  if (!userId) throw new ApiError(401, 'Unauthorized');

  const result = await transferInternal({ userId, ...req.body });
  res.status(201).json(result);
}
