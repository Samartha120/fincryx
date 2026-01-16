import React, { memo, useMemo } from 'react';
import { Platform, Text, useWindowDimensions, View } from 'react-native';
import { G } from 'react-native-svg';
import { VictoryPie } from 'victory-native';

import type { Account } from '@/src/api/accountsApi';
import type { Transaction } from '@/src/api/transactionsApi';
import { Card } from '@/src/components/ui/Card';
import { formatMoneyMinor } from '@/src/lib/money';

type Props = {
  title?: string;
  currency: string;
  accounts: Account[];
  transactions: Transaction[];
};

type Slice = {
  label: string;
  color: string;
  amountMinor: number;
  percentage: number;
};

function isDebit(tx: Transaction, accountIdSet: Set<string>): boolean {
  const fromAccountId = (tx as any)?.fromAccountId as string | undefined;
  if (!fromAccountId) return tx.type === 'loan_payment';
  return accountIdSet.has(fromAccountId);
}

function categoryFor(tx: Transaction): string {
  switch (tx.type) {
    case 'loan_payment':
      return 'Loan Payment';
    case 'transfer':
      return 'Transfers';
    default:
      return 'Others';
  }
}

export const SpendingPatternChart = memo(function SpendingPatternChart({
  title = 'Spending pattern',
  currency,
  accounts,
  transactions,
}: Props) {
  const { width: windowWidth } = useWindowDimensions();
  // Adjust chart size to be roughly half the available width if we want side-by-side
  const chartSize = 160;

  const safe = useMemo(() => {
    const accountIdSet = new Set(accounts.map((a) => a._id));
    const debitTxs = transactions.filter((t) => t.status === 'completed' && isDebit(t, accountIdSet));

    const totals: Record<string, number> = {};
    for (const tx of debitTxs) {
      const cat = categoryFor(tx);
      totals[cat] = (totals[cat] ?? 0) + (Number.isFinite(tx.amountMinor) ? tx.amountMinor : 0);
    }

    const totalMinor = Object.values(totals).reduce((sum, v) => sum + v, 0);

    const slices: Slice[] = [
      { label: 'Transfers', color: '#EF4444', amountMinor: totals['Transfers'] ?? 0, percentage: 0 },
      { label: 'Loan Payment', color: '#F59E0B', amountMinor: totals['Loan Payment'] ?? 0, percentage: 0 },
      { label: 'Others', color: '#94A3B8', amountMinor: totals['Others'] ?? 0, percentage: 0 },
    ]
      .filter((s) => s.amountMinor > 0)
      .map(s => ({ ...s, percentage: totalMinor > 0 ? (s.amountMinor / totalMinor) * 100 : 0 }))
      .sort((a, b) => b.amountMinor - a.amountMinor);

    return {
      hasData: totalMinor > 0,
      totalMinor,
      slices,
      pieData: slices.map((s) => ({ x: s.label, y: s.amountMinor })),
      colors: slices.map((s) => s.color),
    };
  }, [accounts, transactions]);

  if (!safe.hasData) {
    return (
      <Card className="gap-2 items-center justify-center py-8">
        <Text className="text-label text-text-secondary">No spending data available.</Text>
      </Card>
    );
  }

  const showCharts = Platform.OS === 'web' || Platform.OS === 'ios' || Platform.OS === 'android';

  return (
    <Card>
      <View className="mb-4">
        <Text className="text-label text-text-primary font-semibold">{title}</Text>
        <Text className="text-caption text-text-secondary">Breakdown by category</Text>
      </View>

      <View className="flex-row items-center justify-between">
        {/* Custom Legend / List */}
        <View className="flex-1 gap-3 mr-4">
          {safe.slices.map((slice) => (
            <View key={slice.label} className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <View className="w-3 h-3 rounded-full" style={{ backgroundColor: slice.color }} />
                <Text className="text-body text-text-primary text-xs font-medium">{slice.label}</Text>
              </View>
              <View className="items-end">
                <Text className="text-xs font-bold text-text-primary">{Math.round(slice.percentage)}%</Text>
                <Text className="text-[10px] text-text-secondary leading-tight">{formatMoneyMinor(slice.amountMinor, currency)}</Text>
              </View>
            </View>
          ))}
          <View className="h-[1px] bg-border-light my-1" />
          <View className="flex-row justify-between items-center">
            <Text className="text-xs font-medium text-text-secondary">Total</Text>
            <Text className="text-sm font-bold text-text-primary">{formatMoneyMinor(safe.totalMinor, currency)}</Text>
          </View>
        </View>

        {showCharts ? (
          <View>
            <VictoryPie
              width={chartSize}
              height={chartSize}
              padding={0}
              data={safe.pieData}
              colorScale={safe.colors}
              innerRadius={chartSize / 2 - 16}
              radius={chartSize / 2}
              cornerRadius={4}
              padAngle={2}
              labels={() => null} // No labels on the pie itself, we use the legend
              animate={{ duration: 500 }}
              groupComponent={<G />}
            />
          </View>
        ) : (
          <Text>Chart unavailable</Text>
        )}
      </View>
    </Card>
  );
});
