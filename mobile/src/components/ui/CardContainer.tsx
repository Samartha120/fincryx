import React from 'react';
import { View, type ViewProps } from 'react-native';

import { cn } from '@/src/lib/cn';

type Variant = 'default' | 'subtle' | 'error';

type Props = ViewProps & {
  className?: string;
  variant?: Variant;
};

export function CardContainer({ className, variant = 'default', ...props }: Props) {
  const variantClass =
    variant === 'error'
      ? 'border-error/20 bg-error/10'
      : variant === 'subtle'
        ? 'border-border bg-surface'
        : 'border-border-light bg-surface';

  return (
    <View
      className={cn('rounded-card p-lg border shadow-card', variantClass, className)}
      {...props}
    />
  );
}
