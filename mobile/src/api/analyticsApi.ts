import { z } from 'zod';

import { http } from '@/src/lib/http';

const TransactionAnalyticsSchema = z.object({
  labels: z.array(z.string()),
  credit: z.array(z.coerce.number()),
  debit: z.array(z.coerce.number()),
});

export type TransactionAnalytics = z.infer<typeof TransactionAnalyticsSchema>;

const LoanAnalyticsSchema = z.object({
  totalLoan: z.coerce.number(),
  paid: z.coerce.number(),
  pending: z.coerce.number(),
});

export type LoanAnalytics = z.infer<typeof LoanAnalyticsSchema>;

async function getWithFallback<T>(paths: string[]): Promise<T> {
  let lastError: unknown;

  for (const path of paths) {
    try {
      const res = await http.get(path);
      return res.data as T;
    } catch (e) {
      lastError = e;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Analytics endpoint not available');
}

export async function getTransactionAnalytics(): Promise<TransactionAnalytics> {
  const data = await getWithFallback<unknown>(['/api/analytics/transactions', '/analytics/transactions']);
  return TransactionAnalyticsSchema.parse(data);
}

export async function getTransactionAnalyticsWithParams(params?: {
  range?: 'daily' | 'monthly';
  points?: number;
}): Promise<TransactionAnalytics> {
  const query = {
    range: params?.range,
    points: params?.points,
  };

  try {
    const res = await http.get('/api/analytics/transactions', { params: query });
    return TransactionAnalyticsSchema.parse(res.data);
  } catch {
    const res = await http.get('/analytics/transactions', { params: query });
    return TransactionAnalyticsSchema.parse(res.data);
  }
}

export async function getLoanAnalytics(): Promise<LoanAnalytics> {
  const data = await getWithFallback<unknown>(['/api/analytics/loans', '/analytics/loans']);
  return LoanAnalyticsSchema.parse(data);
}
