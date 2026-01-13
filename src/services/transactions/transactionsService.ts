import { Types } from 'mongoose';

import { TransactionModel } from '../../models/Transaction';

export async function listTransactions(input: { userId: string; page: number; limit: number }) {
  const userObjectId = new Types.ObjectId(input.userId);
  const skip = (input.page - 1) * input.limit;

  const [items, total] = await Promise.all([
    TransactionModel.find({ userId: userObjectId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(input.limit)
      .select('-__v'),
    TransactionModel.countDocuments({ userId: userObjectId }),
  ]);

  return { page: input.page, limit: input.limit, total, items };
}
