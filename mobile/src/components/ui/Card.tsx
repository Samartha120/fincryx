import React from 'react';
import { View, type ViewProps } from 'react-native';

import { cn } from '@/src/lib/cn';

export function Card({ className, ...props }: ViewProps & { className?: string }) {
  return (
    <View
      className={cn('bg-surface rounded-card p-lg shadow-card border border-border-light', className)}
      {...props}
    />
  );
}
