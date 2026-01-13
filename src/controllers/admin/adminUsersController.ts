import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';

import { UserModel } from '../../models/User';
import { parsePagination } from '../../utils/pagination';

export async function listUsers(req: ExpressRequest, res: ExpressResponse): Promise<void> {
  const { page, limit } = parsePagination(req.query);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    UserModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit).select('-passwordHash -otpCodeHash'),
    UserModel.countDocuments(),
  ]);

  res.json({
    page,
    limit,
    total,
    items,
  });
}
