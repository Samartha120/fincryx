import { http } from '@/src/lib/http';

export type Transaction = {
  _id: string;
  userId?: string;
  fromAccountId?: string;
  toAccountId?: string;
  type: string;
  status: string;
  amountMinor: number;
  currency: string;
  reference: string;
  note?: string;
  createdAt: string;
  updatedAt?: string;
};

export async function getTransactions(params?: { page?: number; limit?: number }) {
  const res = await http.get('/transactions', { params });
  return res.data as { page: number; limit: number; total: number; items: Transaction[] };
}
