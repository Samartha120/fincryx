import React, { memo, useMemo, useState } from 'react';
import { Platform, Text, useWindowDimensions, View } from 'react-native';
import { Defs, LinearGradient, Line, Stop, G } from 'react-native-svg';
import { VictoryArea, VictoryAxis, VictoryChart, VictoryGroup, VictoryLabel } from 'victory-native';

import type { TransactionAnalytics } from '@/src/api/analyticsApi';
import { Card } from '@/src/components/ui/Card';
import { cn } from '@/src/lib/cn';

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
      <View className="h-4 w-40 rounded bg-border-light animate-pulse" />
      <View className="h-56 w-full rounded-lg bg-gray-100 dark:bg-neutral-800 animate-pulse" />
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
  const chartWidth = Math.max(320, windowWidth - 48); // Full width minus padding
  const [activePoint, setActivePoint] = useState<{ label: string; credit: number; debit: number } | null>(null);

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
      points,
      labels,
    };
  }, [data]);

  const tickValues = useMemo(() => {
    if (safe.labels.length <= 8) return safe.labels;
    // Show reduced ticks for dense data
    const interval = Math.ceil(safe.labels.length / 6);
    return safe.labels.filter((_, idx) => idx % interval === 0);
  }, [safe.labels]);

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
      <Card className="gap-2 items-center justify-center py-12">
        <Text className="text-label text-text-secondary">No transaction history available.</Text>
      </Card>
    );
  }

  const showCharts = Platform.OS === 'web' || Platform.OS === 'ios' || Platform.OS === 'android';

  const maxVal = Math.max(
    ...safe.creditSeries.map((d) => d.y),
    ...safe.debitSeries.map((d) => d.y),
    100
  );

  return (
    <Card className="overflow-visible pb-2">
      {/* Dynamic Header */}
      <View className="mb-4">
        {activePoint ? (
          <View>
            <Text className="text-xs font-medium text-text-secondary uppercase tracking-wider">
              {activePoint.label}
            </Text>
            <View className="flex-row items-center gap-4 mt-1">
              <View className="flex-row items-center gap-1.5">
                <View className="w-2 h-2 rounded-full bg-emerald-500" />
                <Text className="text-lg font-bold text-text-primary">
                  +{formatCompact(activePoint.credit)}
                </Text>
              </View>
              <View className="flex-row items-center gap-1.5">
                <View className="w-2 h-2 rounded-full bg-rose-500" />
                <Text className="text-lg font-bold text-text-primary">
                  -{formatCompact(activePoint.debit)}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View>
            <Text className="text-lg font-bold text-text-primary">{title}</Text>
            <View className="flex-row items-center gap-3 mt-1">
              <View className="flex-row items-center gap-1.5">
                <View className="w-2 h-2 rounded-full bg-emerald-500" />
                <Text className="text-xs text-text-secondary">Income</Text>
              </View>
              <View className="flex-row items-center gap-1.5">
                <View className="w-2 h-2 rounded-full bg-rose-500" />
                <Text className="text-xs text-text-secondary">Expense</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {showCharts ? (
        <View className="-ml-3 relative" onTouchStart={() => setActivePoint(null)}>
          <VictoryChart
            width={chartWidth}
            height={220}
            padding={{ top: 10, bottom: 40, left: 50, right: 20 }}
            groupComponent={<G />}
          >
            <Defs>
              <LinearGradient id="gradientCredit" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor="#10B981" stopOpacity={0.4} />
                <Stop offset="100%" stopColor="#10B981" stopOpacity={0} />
              </LinearGradient>
              <LinearGradient id="gradientDebit" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor="#EF4444" stopOpacity={0.4} />
                <Stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
              </LinearGradient>
            </Defs>

            <VictoryAxis
              tickValues={tickValues}
              style={{
                axis: { stroke: 'transparent' }, // Hide axis line
                tickLabels: { fill: '#9CA3AF', fontSize: 10 },
                grid: { stroke: 'transparent' },
              }}
              axisComponent={<Line />}
              gridComponent={<Line />}
              tickLabelComponent={<VictoryLabel />}
              groupComponent={<G />}
            />

            <VictoryAxis
              dependentAxis
              tickFormat={(t) => formatCompact(Number(t))}
              style={{
                axis: { stroke: 'transparent' },
                tickLabels: { fill: '#9CA3AF', fontSize: 10, padding: 5 },
                grid: { stroke: '#E5E7EB', strokeDasharray: '4, 4' }, // Keep grid lines, should be safe
              }}
              axisComponent={<Line />}
              gridComponent={<Line />}
              tickLabelComponent={<VictoryLabel />}
              groupComponent={<G />}
            />

            <VictoryGroup style={{ data: { strokeWidth: 2 } }}>
              <VictoryArea
                data={safe.creditSeries}
                interpolation="monotoneX"
                animate={{ duration: 500, onLoad: { duration: 500 } }}
                style={{
                  data: { fill: 'url(#gradientCredit)', stroke: '#10B981' },
                }}
                events={[{
                  target: "data",
                  eventHandlers: {
                    onPressIn: (_evt, targetProps) => {
                      const { datum } = targetProps;
                      if (datum) {
                        const original = safe.points.find(p => p.label === datum.x);
                        if (original) setActivePoint(original);
                      }
                      return [];
                    },
                  }
                }]}
              />
              <VictoryArea
                data={safe.debitSeries}
                interpolation="monotoneX"
                animate={{ duration: 500, onLoad: { duration: 500 } }}
                style={{
                  data: { fill: 'url(#gradientDebit)', stroke: '#EF4444' },
                }}
                events={[{
                  target: "data",
                  eventHandlers: {
                    onPressIn: (_evt, targetProps) => {
                      const { datum } = targetProps;
                      if (datum) {
                        const original = safe.points.find(p => p.label === datum.x);
                        if (original) setActivePoint(original);
                      }
                      return [];
                    },
                  }
                }]}
              />
            </VictoryGroup>

            {/* Optional: Add a highlight line for active point if needed, but Voronoi handles touch area well */}
          </VictoryChart>
        </View>
      ) : (
        <Text>Chart unavailable</Text>
      )}
    </Card>
  );
});
