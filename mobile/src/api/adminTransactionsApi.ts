import { http } from '@/src/lib/http';

export type AdminTransaction = {
  _id: string;
  userId: string;
  fromAccountId?: string;
  toAccountId?: string;
  type: string;
  status: string;
  amountMinor: number;
  currency: string;
  reference: string;
  note?: string;
  createdAt: string;
};

export async function getAdminTransactions(params?: { page?: number; limit?: number }) {
  const res = await http.get('/admin/transactions', { params });
  return res.data as { page: number; limit: number; total: number; items: AdminTransaction[] };
}
