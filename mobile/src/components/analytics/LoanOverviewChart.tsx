import React, { memo, useMemo } from 'react';
import { View, Text } from 'react-native';

import type { LoanAnalytics } from '@/src/api/analyticsApi';
import { Card } from '@/src/components/ui/Card';
import { cn } from '@/src/lib/cn';

type Props = {
  title?: string;
  currency?: string;
  data: LoanAnalytics | null;
  loading?: boolean;
  error?: string | null;
};

function formatCurrency(amount: number, currency: string): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(safe);
  } catch {
    return `${currency} ${Math.round(safe)}`;
  }
}

function Skeleton() {
  return (
    <Card className="gap-3">
      <View className="h-4 w-36 rounded bg-border-light animate-pulse" />
      <View className="h-20 w-full rounded bg-gray-100 dark:bg-neutral-800 animate-pulse" />
    </Card>
  );
}

export const LoanOverviewChart = memo(function LoanOverviewChart({
  title = 'Loan overview',
  currency = 'INR',
  data,
  loading,
  error,
}: Props) {
  const safe = useMemo(() => {
    const totalLoan = data?.totalLoan ?? 0;
    const paid = Math.max(0, data?.paid ?? 0);
    const pending = Math.max(0, data?.pending ?? 0);

    const total = Math.max(0, totalLoan || paid + pending);
    const paidPct = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;

    return {
      hasData: total > 0,
      total,
      paid,
      pending,
      paidPct,
    };
  }, [data]);

  if (loading) return <Skeleton />;

  if (error) {
    return (
      <Card className="gap-2 border-error/20 bg-error/5">
        <Text className="text-label text-error font-semibold">{title}</Text>
        <Text className="text-caption text-error">{error}</Text>
      </Card>
    );
  }

  if (!safe.hasData) {
    return (
      <Card className="gap-2 items-center justify-center py-6">
        <Text className="text-label text-text-secondary">No active loans.</Text>
      </Card>
    );
  }

  return (
    <Card>
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-label text-text-primary font-semibold">{title}</Text>
        <View className="px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/30">
          <Text className="text-xs font-bold text-blue-600 dark:text-blue-400">{safe.paidPct}% Paid</Text>
        </View>
      </View>

      <Text className="text-2xl font-bold text-text-primary mb-1">
        {formatCurrency(safe.total, currency)}
      </Text>
      <Text className="text-caption text-text-secondary mb-4">Total Borrowed Amount</Text>

      {/* Progress Bar */}
      <View className="h-4 w-full bg-gray-100 dark:bg-neutral-800 rounded-full overflow-hidden flex-row">
        <View
          style={{ width: `${safe.paidPct}%` }}
          className="h-full bg-blue-500 rounded-l-full"
        />
        {/* Remaining part is empty/bg color */}
      </View>

      <View className="flex-row justify-between mt-3">
        <View>
          <Text className="text-xs text-text-secondary mb-0.5">Paid Amount</Text>
          <Text className="text-sm font-semibold text-blue-600 dark:text-blue-400">{formatCurrency(safe.paid, currency)}</Text>
        </View>
        <View className="items-end">
          <Text className="text-xs text-text-secondary mb-0.5">Remaining</Text>
          <Text className="text-sm font-semibold text-amber-500">{formatCurrency(safe.pending, currency)}</Text>
        </View>
      </View>
    </Card>
  );
});
