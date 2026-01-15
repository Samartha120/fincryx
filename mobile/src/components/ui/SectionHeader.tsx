import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { cn } from '@/src/lib/cn';

type Props = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onActionPress?: () => void;
  className?: string;
};

export function SectionHeader({ title, subtitle, actionLabel, onActionPress, className }: Props) {
  return (
    <View className={cn('gap-1', className)}>
      <View className="flex-row items-center justify-between">
        <Text className="text-heading text-text-primary">{title}</Text>
        {actionLabel && onActionPress ? (
          <Pressable onPress={onActionPress} accessibilityRole="button">
            <Text className="text-label text-primary font-semibold">{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
      {subtitle ? <Text className="text-body text-text-secondary">{subtitle}</Text> : null}
    </View>
  );
}
