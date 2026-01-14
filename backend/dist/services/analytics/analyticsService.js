"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildLoanAnalytics = exports.buildTransactionAnalytics = void 0;
const mongoose_1 = require("mongoose");
const errorMiddleware_1 = require("../../middlewares/errorMiddleware");
const Account_1 = require("../../models/Account");
const Loan_1 = require("../../models/Loan");
const Transaction_1 = require("../../models/Transaction");

function ensureUserId(userId) {
  if (!userId) {
    throw new errorMiddleware_1.ApiError(401, 'Unauthorized');
  }
  return userId;
}

function addMonths(date, delta) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + delta);
  return d;
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function fmtMonthLabel(date) {
  return date.toLocaleString('en-US', { month: 'short' });
}

function fmtDayLabel(date) {
  return date.toLocaleString('en-US', { month: 'short', day: '2-digit' });
}

function toMajor(amountMinor) {
  const safe = Number.isFinite(amountMinor) ? amountMinor : 0;
  // Keep values chart-friendly and comparable to UX expectations.
  return Math.round(safe / 100);
}

async function buildTransactionAnalytics({ userId, range, points }) {
  const uid = ensureUserId(userId);
  const rangeMode = range === 'daily' ? 'daily' : 'monthly';

  const now = new Date();
  const pointCount = points ?? (rangeMode === 'daily' ? 14 : 6);

  let buckets = [];
  let fromDate;

  if (rangeMode === 'daily') {
    const start = startOfDay(new Date(now));
    fromDate = addMonths(start, 0);
    fromDate.setDate(fromDate.getDate() - (pointCount - 1));

    for (let i = 0; i < pointCount; i += 1) {
      const d = new Date(fromDate);
      d.setDate(d.getDate() + i);
      buckets.push({
        key: d.toISOString().slice(0, 10),
        label: fmtDayLabel(d),
        credit: 0,
        debit: 0,
      });
    }
  } else {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    fromDate = addMonths(start, -(pointCount - 1));

    for (let i = 0; i < pointCount; i += 1) {
      const d = addMonths(fromDate, i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      buckets.push({ key, label: fmtMonthLabel(d), credit: 0, debit: 0 });
    }
  }

  const bucketByKey = new Map(buckets.map((b) => [b.key, b]));

  const userAccountIds = await Account_1.AccountModel.find({ userId: new mongoose_1.Types.ObjectId(uid) })
    .select({ _id: 1 })
    .lean();

  const accountIdSet = new Set(userAccountIds.map((a) => String(a._id)));

  const txs = await Transaction_1.TransactionModel.find({
    userId: new mongoose_1.Types.ObjectId(uid),
    status: 'completed',
    createdAt: { $gte: fromDate },
  })
    .select({ amountMinor: 1, fromAccountId: 1, toAccountId: 1, createdAt: 1 })
    .lean();

  for (const tx of txs) {
    const createdAt = tx.createdAt ? new Date(tx.createdAt) : null;
    if (!createdAt) continue;

    const key =
      rangeMode === 'daily'
        ? createdAt.toISOString().slice(0, 10)
        : `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`;

    const bucket = bucketByKey.get(key);
    if (!bucket) continue;

    const amountMajor = toMajor(tx.amountMinor);

    const fromId = tx.fromAccountId ? String(tx.fromAccountId) : null;
    const toId = tx.toAccountId ? String(tx.toAccountId) : null;

    if (fromId && accountIdSet.has(fromId)) bucket.debit += amountMajor;
    if (toId && accountIdSet.has(toId)) bucket.credit += amountMajor;
  }

  return {
    labels: buckets.map((b) => b.label),
    credit: buckets.map((b) => b.credit),
    debit: buckets.map((b) => b.debit),
  };
}
exports.buildTransactionAnalytics = buildTransactionAnalytics;

async function buildLoanAnalytics({ userId }) {
  const uid = ensureUserId(userId);

  const approvedLoans = await Loan_1.LoanModel.find({
    userId: new mongoose_1.Types.ObjectId(uid),
    status: 'approved',
  })
    .select({ principalMinor: 1 })
    .lean();

  const totalLoanMinor = approvedLoans.reduce((sum, l) => sum + (Number.isFinite(l.principalMinor) ? l.principalMinor : 0), 0);

  const loanPayments = await Transaction_1.TransactionModel.find({
    userId: new mongoose_1.Types.ObjectId(uid),
    status: 'completed',
    type: 'loan_payment',
  })
    .select({ amountMinor: 1 })
    .lean();

  const paidMinor = loanPayments.reduce((sum, t) => sum + (Number.isFinite(t.amountMinor) ? t.amountMinor : 0), 0);

  const totalLoan = toMajor(totalLoanMinor);
  const paid = Math.min(totalLoan, toMajor(paidMinor));
  const pending = Math.max(0, totalLoan - paid);

  return { totalLoan, paid, pending };
}
exports.buildLoanAnalytics = buildLoanAnalytics;
