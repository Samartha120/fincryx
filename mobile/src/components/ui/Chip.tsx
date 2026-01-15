import React from 'react';
import { Pressable, Text, type PressableProps } from 'react-native';

import { cn } from '@/src/lib/cn';

type Props = PressableProps & {
  label: string;
  selected?: boolean;
};

export function Chip({ label, selected, className, ...props }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      className={cn(
        'rounded-full border px-3 py-1.5',
        selected ? 'border-primary bg-primary' : 'border-border bg-surface',
        className,
      )}
      {...props}
    >
      <Text className={cn('text-label font-semibold', selected ? 'text-white' : 'text-text-secondary')}>{label}</Text>
    </Pressable>
  );
}
