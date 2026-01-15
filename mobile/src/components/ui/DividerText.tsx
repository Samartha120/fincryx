import { cn } from '@/src/lib/cn';
import React from 'react';
import { Text, View } from 'react-native';

type DividerTextProps = {
  text: string;
  className?: string;
};

/**
 * DividerText - Horizontal divider with text
 * Common pattern in auth screens (e.g., "or continue with")
 */
export function DividerText({ text, className }: DividerTextProps) {
  return (
    <View className={cn('flex-row items-center gap-3', className)}>
      <View className="flex-1 h-px bg-border" />
      <Text className="text-caption text-text-muted">{text}</Text>
      <View className="flex-1 h-px bg-border" />
    </View>
  );
}
