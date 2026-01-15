import React from 'react';
import { Text, View } from 'react-native';

import { cn } from '@/src/lib/cn';

type Props = {
  name?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

function initialsFromName(name?: string | null): string {
  const safe = (name ?? '').trim();
  if (!safe) return 'U';
  const parts = safe.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? 'U';
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : '';
  return (first + last).toUpperCase();
}

export function Avatar({ name, size = 'md', className }: Props) {
  const sizes = {
    sm: { wrapper: 'h-9 w-9', text: 'text-label' },
    md: { wrapper: 'h-11 w-11', text: 'text-body' },
    lg: { wrapper: 'h-14 w-14', text: 'text-heading' },
  };

  return (
    <View
      className={cn(
        'items-center justify-center rounded-full bg-primary/10 border border-primary/20',
        sizes[size].wrapper,
        className,
      )}
    >
      <Text className={cn('text-text-primary font-semibold', sizes[size].text)}>
        {initialsFromName(name)}
      </Text>
    </View>
  );
}
