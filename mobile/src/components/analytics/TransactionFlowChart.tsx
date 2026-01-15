import React, { memo, useMemo } from 'react';
import { Platform, Text, useWindowDimensions, View } from 'react-native';
import { VictoryAxis, VictoryBar, VictoryChart, VictoryGroup, VictoryLegend } from 'victory-native';

import type { TransactionAnalytics } from '@/src/api/analyticsApi';
import { Card } from '@/src/components/ui/Card';

type Props = {
  title?: string;
  data: TransactionAnalytics | null;
  loading?: boolean;
  error?: string | null;
};

function formatCompact(value: number): string {
  if (!Number.isFinite(value)) return '0';
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return String(Math.round(value));
}

function Skeleton() {
  return (
    <Card className="gap-3">
      <View className="h-4 w-40 rounded bg-border-light" />
      <View className="h-44 w-full rounded bg-border-light" />
      <View className="h-3 w-56 rounded bg-border-light" />
    </Card>
  );
}

export const TransactionFlowChart = memo(function TransactionFlowChart({
  title = 'Transaction flow',
  data,
  loading,
  error,
}: Props) {
  const { width: windowWidth } = useWindowDimensions();
  const chartWidth = Math.max(320, Math.floor(windowWidth - 24 * 2));

  const safe = useMemo(() => {
    const labels = data?.labels ?? [];
    const credit = data?.credit ?? [];
    const debit = data?.debit ?? [];

    const points = labels.map((label, index) => ({
      label,
      credit: Number.isFinite(credit[index]) ? credit[index] : 0,
      debit: Number.isFinite(debit[index]) ? debit[index] : 0,
    }));

    return {
      hasData: labels.length > 0,
      creditSeries: points.map((p) => ({ x: p.label, y: p.credit })),
      debitSeries: points.map((p) => ({ x: p.label, y: p.debit })),
      labels,
    };
  }, [data]);

  const tickValues = useMemo(() => {
    if (safe.labels.length <= 8) return safe.labels;
    // Show every other tick label for dense charts.
    return safe.labels.filter((_, idx) => idx % 2 === 0);
  }, [safe.labels]);

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
        <Text className="text-body text-text-secondary">No transaction analytics yet.</Text>
      </Card>
    );
  }

  const showCharts = Platform.OS === 'web';

  return (
    <Card className="gap-2">
      <Text className="text-label text-text-primary font-semibold">{title}</Text>
      <Text className="text-caption text-text-secondary">Credit (green) vs Debit (red)</Text>

      {showCharts ? (
        <View className="-ml-2">
          <VictoryChart
            width={chartWidth}
            height={240}
            domainPadding={{ x: 18, y: 16 }}
            padding={{ top: 30, bottom: 44, left: 56, right: 16 }}
          >
            <VictoryLegend
              x={56}
              y={0}
              orientation="horizontal"
              gutter={18}
              style={{ labels: { fill: '#111827', fontSize: 11 } }}
              data={[
                { name: 'Credit', symbol: { fill: '#22c55e' } },
                { name: 'Debit', symbol: { fill: '#ef4444' } },
              ]}
            />

            <VictoryAxis
              tickValues={tickValues}
              style={{
                axis: { stroke: '#E5E7EB' },
                tickLabels: { fill: '#6B7280', fontSize: 10 },
                grid: { stroke: 'transparent' },
              }}
            />

            <VictoryAxis
              dependentAxis
              tickFormat={(t) => formatCompact(Number(t))}
              style={{
                axis: { stroke: '#E5E7EB' },
                tickLabels: { fill: '#6B7280', fontSize: 10 },
                grid: { stroke: '#E5E7EB' },
              }}
            />

            <VictoryGroup offset={12}>
              <VictoryBar
                data={safe.creditSeries}
                style={{
                  data: { fill: '#22c55e' },
                }}
                cornerRadius={{ topLeft: 3, topRight: 3 }}
                barWidth={8}
              />
              <VictoryBar
                data={safe.debitSeries}
                style={{
                  data: { fill: '#ef4444' },
                }}
                cornerRadius={{ topLeft: 3, topRight: 3 }}
                barWidth={8}
              />
            </VictoryGroup>
          </VictoryChart>
        </View>
      ) : (
        <Text className="text-caption text-text-secondary mt-2">
          Chart unavailable on this device.
        </Text>
      )}

      <Text className="text-caption text-text-secondary">{safe.labels.length > 12 ? 'Tip: rotate to see more.' : ' '}</Text>
    </Card>
  );
});
