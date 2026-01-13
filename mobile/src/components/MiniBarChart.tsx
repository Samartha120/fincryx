import React, { memo, useMemo } from 'react';
import { Text, View } from 'react-native';

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
      <View style={{ padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#eee' }}>
        <Text style={{ fontWeight: '700' }}>{props.title}</Text>
        <Text style={{ color: '#666', marginTop: 6 }}>No data yet</Text>
      </View>
    );
  }

  return (
    <View style={{ padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#eee', gap: 10 }}>
      <Text style={{ fontWeight: '700' }}>{props.title}</Text>

      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 80 }}>
        {props.items.map((it) => {
          const ratio = max > 0 ? it.value / max : 0;
          const height = clamp(Math.round(ratio * 70) + 6, 6, 76);

          return (
            <View key={it.label} style={{ alignItems: 'center', width: 40 }}>
              <View style={{ height, width: 18, borderRadius: 6, backgroundColor: '#111' }} />
              <Text style={{ fontSize: 11, color: '#666', marginTop: 6 }} numberOfLines={1}>
                {it.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
});
