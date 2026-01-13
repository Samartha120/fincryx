import { http } from '@/src/lib/http';

export type Account = {
  _id: string;
  accountNumber: string;
  type: 'checking' | 'savings';
  currency: string;
  balanceMinor: number;
  createdAt: string;
  updatedAt: string;
};

export async function getAccounts() {
  const res = await http.get('/accounts');
  return res.data as { items: Account[] };
}

export async function transfer(payload: {
  fromAccountId: string;
  toAccountNumber: string;
  amountMinor: number;
  note?: string;
}) {
  const res = await http.post('/accounts/transfer', payload);
  return res.data as { reference: string };
}
