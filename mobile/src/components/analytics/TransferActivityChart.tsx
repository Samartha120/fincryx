import React, { memo, useMemo } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';

import { Card } from '@/src/components/ui/Card';
import type { Transaction } from '@/src/api/transactionsApi';

type Props = {
  transactions: Transaction[];
  loading?: boolean;
};

export const TransferActivityChart = memo(function TransferActivityChart({ transactions, loading }: Props) {
  const { width: windowWidth } = useWindowDimensions();
  const chartWidth = Math.max(320, windowWidth - 48);

  const data = useMemo(() => {
    const relevant = transactions.filter((t) => t.type === 'transfer' && t.status === 'completed');

    const grouped: Record<string, { sent: number; received: number }> = {};

    for (const t of relevant) {
      const date = new Date(t.createdAt);
      const key = `${date.getMonth() + 1}/${date.getDate()}`;

      if (!grouped[key]) grouped[key] = { sent: 0, received: 0 };

      if (t.amountMinor < 0) {
        grouped[key].sent += Math.abs(t.amountMinor);
      } else {
        grouped[key].received += t.amountMinor;
      }
    }

    const chartData = Object.keys(grouped)
      .sort()
      .slice(-7)
      .map((key) => ({
        x: key,
        sent: grouped[key].sent,
        received: grouped[key].received,
      }));

    return chartData.length > 0 ? chartData : [{ x: 'No Data', sent: 0, received: 0 }];
  }, [transactions]);

  const hasData = data.length > 1 || data[0].x !== 'No Data';

  if (loading) {
    return (
      <Card className="gap-3">
        <View className="h-4 w-40 rounded bg-border-light animate-pulse" />
        <View className="h-48 w-full rounded-lg bg-gray-100 dark:bg-neutral-800 animate-pulse" />
      </Card>
    );
  }

  const maxValue = data.reduce((max, d) => Math.max(max, d.sent, d.received), 0);
  const safeMax = maxValue > 0 ? maxValue : 1;

  return (
    <Card>
      <View className="flex-row justify-end items-center mb-4">
        <View className="flex-row gap-4">
          <View className="flex-row items-center gap-2">
            <View className="w-3 h-3 rounded-full bg-blue-500 shadow-sm" />
            <Text className="text-xs font-medium text-text-primary">Sent</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <View className="w-3 h-3 rounded-full bg-purple-500 shadow-sm" />
            <Text className="text-xs font-medium text-text-primary">Received</Text>
          </View>
        </View>
      </View>

      {hasData ? (
        <View style={{ width: chartWidth }} className="mt-2">
          <View className="flex-row items-end justify-between h-40">
            {data.map((d) => {
              const sentHeight = (d.sent / safeMax) * 120;
              const receivedHeight = (d.received / safeMax) * 120;

              return (
                <View key={d.x} className="items-center flex-1">
                  <View className="flex-row items-end justify-center w-full gap-1 mb-2">
                    <View style={{ height: sentHeight }} className="w-2 rounded-full bg-blue-500" />
                    <View style={{ height: receivedHeight }} className="w-2 rounded-full bg-purple-500" />
                  </View>
                  <Text className="text-[10px] text-text-secondary" numberOfLines={1}>
                    {d.x}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      ) : (
        <View className="py-8 items-center justify-center gap-2">
          <Text className="text-3xl text-text-tertiary">⇆</Text>
          <Text className="text-text-secondary font-medium">No recent transfer activity</Text>
        </View>
      )}
    </Card>
  );
});
