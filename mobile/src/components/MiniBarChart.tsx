import React, { memo, useMemo } from 'react';
import { Text, View } from 'react-native';

import { Card } from '@/src/components/ui/Card';

export type MiniBarChartItem = {
  label: string;
  value: number;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export const MiniBarChart = memo(function MiniBarChart(props: { title: string; items: MiniBarChartItem[] }) {
  const max = useMemo(() => props.items.reduce((m, i) => Math.max(m, i.value), 0), [props.items]);

  if (props.items.length === 0) {
    return (
      <Card className="gap-2">
        <Text className="text-label text-text-primary font-semibold">{props.title}</Text>
        <Text className="text-body text-text-secondary">No data yet</Text>
      </Card>
    );
  }

  return (
    <Card className="gap-3">
      <Text className="text-label text-text-primary font-semibold">{props.title}</Text>

      <View className="h-20 flex-row items-end gap-2">
        {props.items.map((it) => {
          const ratio = max > 0 ? it.value / max : 0;
          const height = clamp(Math.round(ratio * 70) + 6, 6, 76);

          return (
            <View key={it.label} className="items-center" style={{ width: 44 }}>
              <View style={{ height }} className="w-5 rounded-lg bg-primary" />
              <Text className="text-caption text-text-muted mt-2" numberOfLines={1}>
                {it.label}
              </Text>
            </View>
          );
        })}
      </View>
    </Card>
  );
});
