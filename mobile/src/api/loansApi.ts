import { http } from '@/src/lib/http';

export type LoanStatus = 'pending' | 'approved' | 'rejected';

export type Loan = {
  _id: string;
  userId: string;
  accountId: string;
  principalMinor: number;
  annualInterestBps: number;
  termMonths: number;
  status: LoanStatus;
  decisionNote?: string;
  createdAt: string;
  updatedAt: string;
};

export async function getLoans(params?: { page?: number; limit?: number; status?: LoanStatus }) {
  const res = await http.get('/loans', { params });
  return res.data as { page: number; limit: number; total: number; items: Loan[] };
}

export async function applyLoan(payload: {
  accountId: string;
  principalMinor: number;
  annualInterestBps: number;
  termMonths: number;
}) {
  const res = await http.post('/loans', payload);
  return res.data as { loan: Loan; emi: { monthlyEmiMinor: number; totalPayableMinor: number; totalInterestMinor: number } };
}
