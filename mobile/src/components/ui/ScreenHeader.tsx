import { useColorScheme } from 'nativewind';
import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { cn } from '@/src/lib/cn';

type Props = {
  title: string;
  subtitle?: string;
  loading?: boolean;
  className?: string;
};

export function ScreenHeader({ title, subtitle, loading, className }: Props) {
  const { colorScheme } = useColorScheme();
  const spinnerColor = colorScheme === 'dark' ? '#6D8CFF' : '#1E40AF';

  return (
    <View className={cn('gap-1', className)}>
      <View className="flex-row items-center justify-between">
        <Text className="text-title text-text-primary">{title}</Text>
        {loading ? <ActivityIndicator color={spinnerColor} /> : null}
      </View>
      {subtitle ? <Text className="text-body text-text-secondary">{subtitle}</Text> : null}
    </View>
  );
}
