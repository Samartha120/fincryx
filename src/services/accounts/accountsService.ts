import { Types, startSession } from 'mongoose';

import { ApiError } from '../../middlewares/errorMiddleware';
import { AccountModel } from '../../models/Account';
import { TransactionModel } from '../../models/Transaction';
import { generateTransactionReference } from '../../utils/refs';

export async function listAccounts(userId: string) {
  const userObjectId = new Types.ObjectId(userId);

  const accounts = await AccountModel.find({ userId: userObjectId })
    .sort({ createdAt: -1 })
    .select('-__v');

  return accounts;
}

export async function transferInternal(input: {
  userId: string;
  fromAccountId: string;
  toAccountNumber: string;
  amountMinor: number;
  note?: string;
}): Promise<{ reference: string }> {
  const userObjectId = new Types.ObjectId(input.userId);
  const fromAccountObjectId = new Types.ObjectId(input.fromAccountId);

  const session = await startSession();

  try {
    const reference = generateTransactionReference();

    await session.withTransaction(async () => {
      const from = await AccountModel.findOneAndUpdate(
        {
          _id: fromAccountObjectId,
          userId: userObjectId,
          balanceMinor: { $gte: input.amountMinor },
        },
        { $inc: { balanceMinor: -input.amountMinor } },
        { new: true, session },
      );

      if (!from) {
        throw new ApiError(400, 'Insufficient funds or invalid source account');
      }

      const to = await AccountModel.findOneAndUpdate(
        { accountNumber: input.toAccountNumber },
        { $inc: { balanceMinor: input.amountMinor } },
        { new: true, session },
      );

      if (!to) {
        throw new ApiError(404, 'Destination account not found');
      }

      if (to.currency !== from.currency) {
        throw new ApiError(400, 'Currency mismatch');
      }

      await TransactionModel.create(
        [
          {
            userId: userObjectId,
            fromAccountId: from._id,
            toAccountId: to._id,
            type: 'transfer',
            status: 'completed',
            amountMinor: input.amountMinor,
            currency: from.currency,
            reference,
            note: input.note,
          },
        ],
        { session },
      );
    });

    return { reference };
  } finally {
    session.endSession();
  }
}
