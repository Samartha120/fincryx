import { useColorScheme } from 'nativewind';
import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

import { cn } from '@/src/lib/cn';

type Props = {
  title: string;
  subtitle?: string;
  loading?: boolean;
  className?: string;
  onBack?: () => void;
  rightElement?: React.ReactNode;
};

export function ScreenHeader({ title, subtitle, loading, className, onBack, rightElement }: Props) {
  const { colorScheme } = useColorScheme();
  const spinnerColor = colorScheme === 'dark' ? '#6D8CFF' : '#1E40AF';
  const textColor = colorScheme === 'dark' ? '#EAF0FF' : '#111827';

  return (
    <View className={cn('gap-1', className)}>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          {onBack && (
            <Pressable onPress={onBack} hitSlop={10}>
              <FontAwesome name="arrow-left" size={20} color={textColor} />
            </Pressable>
          )}
          <Text className="text-title text-text-primary">{title}</Text>
        </View>
        <View className="flex-row items-center gap-3">
          {loading ? <ActivityIndicator color={spinnerColor} /> : null}
          {rightElement}
        </View>
      </View>
      {subtitle ? <Text className="text-body text-text-secondary">{subtitle}</Text> : null}
    </View>
  );
}
