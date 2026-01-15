import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useColorScheme } from 'nativewind';
import React from 'react';
import { Text, View } from 'react-native';

import { CardContainer } from '@/src/components/ui/CardContainer';
import { cn } from '@/src/lib/cn';

type Tone = 'default' | 'success' | 'warning' | 'danger';

type Props = {
  label: string;
  value: string;
  hint?: string;
  icon?: React.ComponentProps<typeof FontAwesome>['name'];
  tone?: Tone;
  className?: string;
};

export function StatCard({ label, value, hint, icon, tone = 'default', className }: Props) {
  const { colorScheme } = useColorScheme();
  const primaryIcon = colorScheme === 'dark' ? '#6D8CFF' : '#1E40AF';

  const toneClass =
    tone === 'success'
      ? 'bg-success/10 border-success/20'
      : tone === 'warning'
        ? 'bg-warning/10 border-warning/20'
        : tone === 'danger'
          ? 'bg-error/10 border-error/20'
          : 'bg-surface border-border-light';

  const iconWrap =
    tone === 'success'
      ? 'bg-success/15'
      : tone === 'warning'
        ? 'bg-warning/15'
        : tone === 'danger'
          ? 'bg-error/15'
          : 'bg-primary/10';

  return (
    <CardContainer className={cn('p-md', toneClass, className)}>
      <View className="flex-row items-center justify-between">
        <View className="gap-1">
          <Text className="text-caption text-text-secondary">{label}</Text>
          <Text className="text-heading text-text-primary">{value}</Text>
          {hint ? <Text className="text-caption text-text-muted">{hint}</Text> : null}
        </View>

        {icon ? (
          <View className={cn('h-10 w-10 items-center justify-center rounded-full', iconWrap)}>
            <FontAwesome name={icon} size={18} color={primaryIcon} />
          </View>
        ) : null}
      </View>
    </CardContainer>
  );
}
