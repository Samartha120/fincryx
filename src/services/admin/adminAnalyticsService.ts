import { AccountModel } from '../../models/Account';
import { LoanModel } from '../../models/Loan';
import { TransactionModel } from '../../models/Transaction';
import { UserModel } from '../../models/User';

export type AdminStats = {
  users: {
    total: number;
    customers: number;
    admins: number;
    otpVerified: number;
  };
  accounts: {
    total: number;
    totalBalanceMinor: number;
  };
  loans: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  transactions: {
    total: number;
    last24hCount: number;
    last24hVolumeMinor: number;
  };
};

export async function getAdminStats(): Promise<AdminStats> {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    customers,
    admins,
    otpVerified,
    totalAccounts,
    accountsAgg,
    totalLoans,
    pendingLoans,
    approvedLoans,
    rejectedLoans,
    totalTx,
    last24hAgg,
  ] = await Promise.all([
    UserModel.countDocuments(),
    UserModel.countDocuments({ role: 'customer' }),
    UserModel.countDocuments({ role: 'admin' }),
    UserModel.countDocuments({ isOtpVerified: true }),

    AccountModel.countDocuments(),
    AccountModel.aggregate<{ totalBalanceMinor: number }>([
      { $group: { _id: null, totalBalanceMinor: { $sum: '$balanceMinor' } } },
    ]),

    LoanModel.countDocuments(),
    LoanModel.countDocuments({ status: 'pending' }),
    LoanModel.countDocuments({ status: 'approved' }),
    LoanModel.countDocuments({ status: 'rejected' }),

    TransactionModel.countDocuments(),
    TransactionModel.aggregate<{ last24hCount: number; last24hVolumeMinor: number }>([
      { $match: { createdAt: { $gte: since24h } } },
      {
        $group: {
          _id: null,
          last24hCount: { $sum: 1 },
          last24hVolumeMinor: { $sum: '$amountMinor' },
        },
      },
    ]),
  ]);

  const totalBalanceMinor = accountsAgg[0]?.totalBalanceMinor ?? 0;
  const last24hCount = last24hAgg[0]?.last24hCount ?? 0;
  const last24hVolumeMinor = last24hAgg[0]?.last24hVolumeMinor ?? 0;

  return {
    users: { total: totalUsers, customers, admins, otpVerified },
    accounts: { total: totalAccounts, totalBalanceMinor },
    loans: { total: totalLoans, pending: pendingLoans, approved: approvedLoans, rejected: rejectedLoans },
    transactions: { total: totalTx, last24hCount, last24hVolumeMinor },
  };
}

export async function listAllTransactions(input: { page: number; limit: number }) {
  const page = input.page;
  const limit = input.limit;
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    TransactionModel.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-__v'),
    TransactionModel.countDocuments(),
  ]);

  return { page, limit, total, items };
}
