import { Types, startSession } from 'mongoose';

import { ApiError } from '../../middlewares/errorMiddleware';
import { AccountModel } from '../../models/Account';
import { LoanModel } from '../../models/Loan';
import { TransactionModel } from '../../models/Transaction';
import { computeEmiSchedule } from '../../utils/loans/emi';
import { generateTransactionReference } from '../../utils/refs';

export async function applyLoan(input: {
  userId: string;
  accountId: string;
  principalMinor: number;
  currency?: string;
  annualInterestBps: number;
  termMonths: number;
}) {
  const userObjectId = new Types.ObjectId(input.userId);
  const accountObjectId = new Types.ObjectId(input.accountId);

  const account = await AccountModel.findOne({ _id: accountObjectId, userId: userObjectId });
  if (!account) throw new ApiError(404, 'Account not found');

  const loan = await LoanModel.create({
    userId: userObjectId,
    accountId: account._id,
    principalMinor: input.principalMinor,
    currency: account.currency,
    annualInterestBps: input.annualInterestBps,
    termMonths: input.termMonths,
    status: 'pending',
  });

  const emi = computeEmiSchedule({
    principalMinor: loan.principalMinor,
    annualInterestBps: loan.annualInterestBps,
    termMonths: loan.termMonths,
  });

  return {
    loan,
    emi,
  };
}

export async function listCustomerLoans(input: { userId: string; page: number; limit: number; status?: string }) {
  const userObjectId = new Types.ObjectId(input.userId);
  const skip = (input.page - 1) * input.limit;

  const filter: Record<string, unknown> = { userId: userObjectId };
  if (input.status) filter.status = input.status;

  const [items, total] = await Promise.all([
    LoanModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(input.limit).select('-__v'),
    LoanModel.countDocuments(filter),
  ]);

  return { page: input.page, limit: input.limit, total, items };
}

export async function getCustomerLoan(input: { userId: string; loanId: string }) {
  const userObjectId = new Types.ObjectId(input.userId);
  const loanObjectId = new Types.ObjectId(input.loanId);

  const loan = await LoanModel.findOne({ _id: loanObjectId, userId: userObjectId }).select('-__v');
  if (!loan) throw new ApiError(404, 'Loan not found');

  const emi = computeEmiSchedule({
    principalMinor: loan.principalMinor,
    annualInterestBps: loan.annualInterestBps,
    termMonths: loan.termMonths,
  });

  return { loan, emi };
}

export async function listPendingLoansAdmin(input: { page: number; limit: number; status?: string }) {
  const skip = (input.page - 1) * input.limit;

  const filter: Record<string, unknown> = {};
  if (input.status) filter.status = input.status;

  const [items, total] = await Promise.all([
    LoanModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(input.limit).select('-__v'),
    LoanModel.countDocuments(filter),
  ]);

  return { page: input.page, limit: input.limit, total, items };
}

export async function decideLoanAdmin(input: {
  adminUserId: string;
  loanId: string;
  decision: 'approved' | 'rejected';
  decisionNote?: string;
}) {
  const loanObjectId = new Types.ObjectId(input.loanId);
  const adminObjectId = new Types.ObjectId(input.adminUserId);

  const session = await startSession();

  try {
    const result = await session.withTransaction(async () => {
      const loan = await LoanModel.findById(loanObjectId).session(session);
      if (!loan) throw new ApiError(404, 'Loan not found');
      if (loan.status !== 'pending') throw new ApiError(400, 'Loan already decided');

      loan.status = input.decision;
      loan.decisionNote = input.decisionNote;
      loan.decidedByUserId = adminObjectId;
      loan.decidedAt = new Date();
      await loan.save({ session });

      if (input.decision === 'approved') {
        const account = await AccountModel.findById(loan.accountId).session(session);
        if (!account) throw new ApiError(404, 'Account not found');

        await AccountModel.updateOne(
          { _id: account._id },
          { $inc: { balanceMinor: loan.principalMinor } },
          { session },
        );

        const reference = generateTransactionReference();
        await TransactionModel.create(
          [
            {
              userId: loan.userId,
              toAccountId: account._id,
              type: 'loan_disbursement',
              status: 'completed',
              amountMinor: loan.principalMinor,
              currency: loan.currency,
              reference,
              note: `Loan approved${input.decisionNote ? `: ${input.decisionNote}` : ''}`,
            },
          ],
          { session },
        );

        return { loan, reference };
      }

      return { loan };
    });

    return result;
  } finally {
    session.endSession();
  }
}
