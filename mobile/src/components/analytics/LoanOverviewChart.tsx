import React, { memo, useMemo } from 'react';
import { Platform, Text, useWindowDimensions, View } from 'react-native';
import { VictoryLegend, VictoryPie } from 'victory-native';

import type { LoanAnalytics } from '@/src/api/analyticsApi';
import { Card } from '@/src/components/ui/Card';

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
      <View className="h-4 w-36 rounded bg-border-light" />
      <View className="h-44 w-full rounded bg-border-light" />
      <View className="h-3 w-44 rounded bg-border-light" />
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
  const { width: windowWidth } = useWindowDimensions();
  const chartWidth = Math.max(320, Math.floor(windowWidth - 24 * 2));

  const safe = useMemo(() => {
    const totalLoan = data?.totalLoan ?? 0;
    const paid = Math.max(0, data?.paid ?? 0);
    const pending = Math.max(0, data?.pending ?? 0);

    const total = Math.max(0, totalLoan || paid + pending);

    return {
      hasData: total > 0 && (paid > 0 || pending > 0),
      total,
      paid,
      pending,
      series: [
        { x: 'Paid', y: paid },
        { x: 'Pending', y: pending },
      ],
    };
  }, [data]);

  if (loading) return <Skeleton />;

  if (error) {
    return (
      <Card className="gap-2 border-error/20 bg-error/10">
        <Text className="text-label text-text-primary font-semibold">{title}</Text>
        <Text className="text-caption text-error">{error}</Text>
        <Text className="text-caption text-text-secondary">Pull to refresh to retry.</Text>
      </Card>
    );
  }

  if (!safe.hasData) {
    return (
      <Card className="gap-2">
        <Text className="text-label text-text-primary font-semibold">{title}</Text>
        <Text className="text-body text-text-secondary">No loan analytics yet.</Text>
      </Card>
    );
  }

  const showCharts = Platform.OS === 'web';

  return (
    <Card className="gap-2">
      <Text className="text-label text-text-primary font-semibold">{title}</Text>
      <Text className="text-caption text-text-secondary">Paid (blue) vs Pending (orange)</Text>

      <View className="mt-1 flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-caption text-text-secondary">Total loan</Text>
          <Text className="text-heading text-text-primary">{formatCurrency(safe.total, currency)}</Text>

          <View className="mt-3 gap-1">
            <Text className="text-caption text-text-secondary">
              Paid: <Text className="text-text-primary">{formatCurrency(safe.paid, currency)}</Text>
            </Text>
            <Text className="text-caption text-text-secondary">
              Pending: <Text className="text-text-primary">{formatCurrency(safe.pending, currency)}</Text>
            </Text>
          </View>
        </View>

        {showCharts ? (
          <View className="items-end">
            <VictoryLegend
              width={chartWidth / 2}
              orientation="vertical"
              gutter={10}
              style={{ labels: { fill: '#111827', fontSize: 11 } }}
              data={[
                { name: 'Paid', symbol: { fill: '#3b82f6' } },
                { name: 'Pending', symbol: { fill: '#f59e0b' } },
              ]}
            />
          </View>
        ) : null}
      </View>

      {showCharts ? (
        <View className="-ml-2 mt-2">
          <VictoryPie
            width={chartWidth}
            height={220}
            data={safe.series}
            colorScale={['#3b82f6', '#f59e0b']}
            innerRadius={52}
            padAngle={2}
            labels={({ datum }) => `${datum.x}: ${Math.round(Number(datum.y) || 0)}`}
            style={{
              labels: { fill: '#111827', fontSize: 10 },
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
