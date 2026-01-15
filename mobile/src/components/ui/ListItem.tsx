import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useColorScheme } from 'nativewind';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { cn } from '@/src/lib/cn';

type Props = {
  title: string;
  subtitle?: string;
  rightTitle?: string;
  rightSubtitle?: string;
  icon?: React.ComponentProps<typeof FontAwesome>['name'];
  tone?: 'default' | 'success' | 'warning' | 'danger';
  onPress?: () => void;
  className?: string;
};

export function ListItem({
  title,
  subtitle,
  rightTitle,
  rightSubtitle,
  icon,
  tone = 'default',
  onPress,
  className,
}: Props) {
  const { colorScheme } = useColorScheme();
  const primaryIcon = colorScheme === 'dark' ? '#6D8CFF' : '#1E40AF';

  const Wrapper = onPress ? Pressable : View;

  const iconBg =
    tone === 'success'
      ? 'bg-success/10 border-success/20'
      : tone === 'warning'
        ? 'bg-warning/10 border-warning/20'
      : tone === 'danger'
        ? 'bg-error/10 border-error/20'
        : 'bg-primary/10 border-primary/20';

  const iconColor =
    tone === 'danger' ? '#DC2626' : tone === 'success' ? '#059669' : tone === 'warning' ? '#D97706' : primaryIcon;

  return (
    <Wrapper
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      className={cn(
        'flex-row items-center justify-between rounded-input border border-border bg-surface px-4 py-3',
        onPress ? 'active:opacity-80' : undefined,
        className,
      )}
    >
      <View className="flex-row items-center gap-3 flex-1">
        {icon ? (
          <View className={cn('h-10 w-10 items-center justify-center rounded-full border', iconBg)}>
            <FontAwesome name={icon} size={16} color={iconColor} />
          </View>
        ) : null}

        <View className="flex-1">
          <Text className="text-label text-text-primary font-semibold" numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text className="text-caption text-text-secondary mt-1" numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      {rightTitle ? (
        <View className="items-end pl-3">
          <Text className="text-label text-text-primary font-semibold" numberOfLines={1}>
            {rightTitle}
          </Text>
          {rightSubtitle ? (
            <Text className="text-caption text-text-muted mt-1" numberOfLines={1}>
              {rightSubtitle}
            </Text>
          ) : null}
        </View>
      ) : null}
    </Wrapper>
  );
}
