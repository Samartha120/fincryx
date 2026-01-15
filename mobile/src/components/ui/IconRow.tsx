import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useColorScheme } from 'nativewind';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { cn } from '@/src/lib/cn';

export type IconAction = {
  label: string;
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  onPress: () => void;
  testID?: string;
};

type Props = {
  actions: IconAction[];
  className?: string;
};

export function IconRow({ actions, className }: Props) {
  const { colorScheme } = useColorScheme();
  const iconColor = colorScheme === 'dark' ? '#6D8CFF' : '#1E40AF';

  return (
    <View className={cn('flex-row justify-between', className)}>
      {actions.map((a) => (
        <Pressable
          key={a.label}
          testID={a.testID}
          accessibilityRole="button"
          onPress={a.onPress}
          className="flex-1 items-center rounded-card py-3 active:opacity-80"
        >
          <View className="h-12 w-12 items-center justify-center rounded-full bg-primary/10 border border-primary/15">
            <FontAwesome name={a.icon} size={18} color={iconColor} />
          </View>
          <Text className="text-caption text-text-secondary mt-2" numberOfLines={1}>
            {a.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
