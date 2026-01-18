import React, { memo, useMemo, useState } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';

import type { TransactionAnalytics } from '@/src/api/analyticsApi';
import { Card } from '@/src/components/ui/Card';

type Props = {
  title?: string;
  data: TransactionAnalytics | null;
  loading?: boolean;
  error?: string | null;
};

export const TransactionFlowChart = memo(function TransactionFlowChart({
  title = 'Transaction flow',
  data,
  loading,
  error,
}: Props) {
  const { width: windowWidth } = useWindowDimensions();
  const chartWidth = Math.max(320, windowWidth - 48);
  const [chartWidthPx, setChartWidthPx] = useState(0);
  const chartHeight = 160;

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
      points,
      labels,
    };
  }, [data]);

  const maxVal =
    safe.points.reduce((max, p) => Math.max(max, p.credit, p.debit), 0) || 1;

  const lineLayout = useMemo(() => {
    if (!safe.hasData || chartWidthPx <= 0) {
      return null;
    }

    const pointsCount = safe.points.length;
    // Increase padding to prevent clipping at edges
    const horizontalPadding = 16;
    const usableWidth = chartWidthPx - horizontalPadding * 2;
    const verticalPadding = 24; // More vertical space for dots
    const usableHeight = chartHeight - verticalPadding * 2;
    const step = pointsCount > 1 ? usableWidth / (pointsCount - 1) : 0;

    const makeSeriesPoints = (key: 'credit' | 'debit') =>
      safe.points.map((p, index) => {
        const value = p[key];
        const ratio = value / maxVal;
        const x =
          pointsCount === 1
            ? horizontalPadding + usableWidth / 2
            : horizontalPadding + index * step;
        const y = verticalPadding + usableHeight - ratio * usableHeight;
        return { x, y, label: p.label, value };
      });

    return {
      incomePoints: makeSeriesPoints('credit'),
      expensePoints: makeSeriesPoints('debit'),
    };
  }, [safe, chartWidthPx, chartHeight, maxVal]);

  if (loading) {
    return (
      <Card className="gap-3">
        <View className="h-4 w-40 rounded bg-border-light animate-pulse" />
        <View className="h-56 w-full rounded-lg bg-gray-100 dark:bg-neutral-800 animate-pulse" />
      </Card>
    );
  }

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
        <Text className="text-4xl mb-3">📊</Text>
        <Text className="text-label text-text-secondary">No transaction history available.</Text>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden pb-4">
      <View className="mb-4 flex-row justify-between items-start">
        <View>
          <Text className="text-lg font-bold text-text-primary">{title}</Text>
        </View>
        <View className="flex-row items-center gap-4">
          {/* Income Legend & Trend */}
          <View className="items-end">
            <View className="flex-row items-center gap-2">
              <View className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
              <Text className="text-xs font-medium text-text-secondary">Income</Text>
            </View>
            {safe.hasData && safe.points.length >= 2 && (
              <Text className="text-[10px] font-bold text-emerald-600 mt-0.5">
                {(() => {
                  const curr = safe.points[safe.points.length - 1].credit;
                  const prev = safe.points[safe.points.length - 2].credit;
                  if (prev === 0) return curr > 0 ? '▲ 100%' : '0%';
                  const pct = ((curr - prev) / prev) * 100;
                  return `${pct > 0 ? '▲' : '▼'} ${Math.abs(Math.round(pct))}%`;
                })()}
              </Text>
            )}
          </View>

          {/* Expense Legend & Trend */}
          <View className="items-end">
            <View className="flex-row items-center gap-2">
              <View className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm" />
              <Text className="text-xs font-medium text-text-secondary">Expense</Text>
            </View>
            {safe.hasData && safe.points.length >= 2 && (
              <Text className="text-[10px] font-bold text-rose-600 mt-0.5">
                {(() => {
                  const curr = safe.points[safe.points.length - 1].debit;
                  const prev = safe.points[safe.points.length - 2].debit;
                  if (prev === 0) return curr > 0 ? '▲ 100%' : '0%';
                  const pct = ((curr - prev) / prev) * 100;
                  return `${pct > 0 ? '▲' : '▼'} ${Math.abs(Math.round(pct))}%`;
                })()}
              </Text>
            )}
          </View>
        </View>
      </View>

      <View className="mt-2 w-full">
        <View
          style={{ height: chartHeight }}
          className="w-full"
          onLayout={(event) => {
            const width = event.nativeEvent.layout.width;
            if (width > 0 && width !== chartWidthPx) {
              setChartWidthPx(width);
            }
          }}
        >
          <View className="absolute left-0 right-0 bottom-4 h-[1px] bg-border-light" />

          {lineLayout && (
            <>
              {lineLayout.incomePoints.map((point, index) => {
                const next = lineLayout.incomePoints[index + 1];
                if (!next) {
                  return (
                    <View
                      key={`income-point-${point.label}-${index}`}
                      style={{
                        position: 'absolute',
                        left: point.x - 3,
                        top: point.y - 3,
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: '#10B981',
                      }}
                    />
                  );
                }

                const dx = next.x - point.x;
                const dy = next.y - point.y;
                const length = Math.sqrt(dx * dx + dy * dy) || 0;
                const angleRad = Math.atan2(dy, dx);
                const angleDeg = (angleRad * 180) / Math.PI;

                return (
                  <View key={`income-segment-${point.label}-${index}`}>
                    <View
                      style={{
                        position: 'absolute',
                        left: point.x,
                        top: point.y,
                        width: length,
                        height: 2,
                        backgroundColor: '#10B981',
                        transform: [{ rotateZ: `${angleDeg}deg` }],
                      }}
                    />
                    <View
                      style={{
                        position: 'absolute',
                        left: point.x - 3,
                        top: point.y - 3,
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: '#10B981',
                      }}
                    />
                  </View>
                );
              })}

              {lineLayout.expensePoints.map((point, index) => {
                const next = lineLayout.expensePoints[index + 1];
                if (!next) {
                  return (
                    <View
                      key={`expense-point-${point.label}-${index}`}
                      style={{
                        position: 'absolute',
                        left: point.x - 3,
                        top: point.y - 3,
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: '#FB7185',
                      }}
                    />
                  );
                }

                const dx = next.x - point.x;
                const dy = next.y - point.y;
                const length = Math.sqrt(dx * dx + dy * dy) || 0;
                const angleRad = Math.atan2(dy, dx);
                const angleDeg = (angleRad * 180) / Math.PI;

                return (
                  <View key={`expense-segment-${point.label}-${index}`}>
                    <View
                      style={{
                        position: 'absolute',
                        left: point.x,
                        top: point.y,
                        width: length,
                        height: 2,
                        backgroundColor: '#FB7185',
                        transform: [{ rotateZ: `${angleDeg}deg` }],
                      }}
                    />
                    <View
                      style={{
                        position: 'absolute',
                        left: point.x - 3,
                        top: point.y - 3,
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: '#FB7185',
                      }}
                    />
                  </View>
                );
              })}
            </>
          )}
        </View>

        <View className="flex-row justify-between mt-2">
          {safe.points.map((p) => (
            <Text
              key={p.label}
              className="text-[10px] text-text-secondary flex-1 text-center"
              numberOfLines={1}
            >
              {p.label}
            </Text>
          ))}
        </View>
      </View>
    </Card>
  );
});
