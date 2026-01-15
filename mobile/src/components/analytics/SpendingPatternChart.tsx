import React, { memo, useMemo } from 'react';
import { Platform, Text, useWindowDimensions, View } from 'react-native';
import { VictoryLegend, VictoryPie } from 'victory-native';

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
};

function isDebit(tx: Transaction, accountIdSet: Set<string>): boolean {
  // We rely on backend returning these fields; keep optional to avoid crashes.
  const fromAccountId = (tx as any)?.fromAccountId as string | undefined;
  if (!fromAccountId) return tx.type === 'loan_payment';
  return accountIdSet.has(fromAccountId);
}

function categoryFor(tx: Transaction): string {
  switch (tx.type) {
    case 'loan_payment':
      return 'Loan payment';
    case 'transfer':
      return 'Transfers';
    default:
      return 'Other';
  }
}

export const SpendingPatternChart = memo(function SpendingPatternChart({
  title = 'Spending pattern',
  currency,
  accounts,
  transactions,
}: Props) {
  const { width: windowWidth } = useWindowDimensions();
  const chartWidth = Math.max(320, Math.floor(windowWidth - 24 * 2));

  const safe = useMemo(() => {
    const accountIdSet = new Set(accounts.map((a) => a._id));

    const debitTxs = transactions.filter((t) => t.status === 'completed' && isDebit(t, accountIdSet));

    const totals: Record<string, number> = {};
    for (const tx of debitTxs) {
      const cat = categoryFor(tx);
      totals[cat] = (totals[cat] ?? 0) + (Number.isFinite(tx.amountMinor) ? tx.amountMinor : 0);
    }

    const slices: Slice[] = [
      { label: 'Transfers', color: '#ef4444', amountMinor: totals['Transfers'] ?? 0 },
      { label: 'Loan payment', color: '#f59e0b', amountMinor: totals['Loan payment'] ?? 0 },
      { label: 'Other', color: '#94a3b8', amountMinor: totals['Other'] ?? 0 },
    ].filter((s) => s.amountMinor > 0);

    const totalMinor = slices.reduce((sum, s) => sum + s.amountMinor, 0);

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
      <Card className="gap-2">
        <Text className="text-label text-text-primary font-semibold">{title}</Text>
        <Text className="text-body text-text-secondary">No spending data yet.</Text>
      </Card>
    );
  }

  const showCharts = Platform.OS === 'web';

  return (
    <Card className="gap-2">
      <Text className="text-label text-text-primary font-semibold">{title}</Text>
      <Text className="text-caption text-text-secondary">Based on completed debit transactions</Text>

      <View className="mt-1 flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-caption text-text-secondary">Total spend</Text>
          <Text className="text-heading text-text-primary">{formatMoneyMinor(safe.totalMinor, currency)}</Text>
        </View>

        {showCharts ? (
          <View className="items-end">
            <VictoryLegend
              width={chartWidth / 2}
              orientation="vertical"
              gutter={10}
              style={{ labels: { fill: '#111827', fontSize: 11 } }}
              data={safe.slices.map((s) => ({ name: s.label, symbol: { fill: s.color } }))}
            />
          </View>
        ) : null}
      </View>

      {showCharts ? (
        <View className="-ml-2 mt-2">
          <VictoryPie
            width={chartWidth}
            height={220}
            data={safe.pieData}
            colorScale={safe.colors}
            innerRadius={52}
            padAngle={2}
            labels={({ datum }) => {
              const y = Number(datum.y) || 0;
              const pct = safe.totalMinor > 0 ? Math.round((y / safe.totalMinor) * 100) : 0;
              return pct > 0 ? `${pct}%` : '';
            }}
            style={{
              labels: { fill: '#111827', fontSize: 11 },
            }}
          />
        </View>
      ) : (
        <Text className="text-caption text-text-secondary mt-2">
          Chart unavailable on this device.
        </Text>
      )}
    </Card>
  );
});
