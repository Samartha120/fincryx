import React from 'react';
import { View, type ViewProps } from 'react-native';

import { cn } from '@/src/lib/cn';

type Props = ViewProps & {
  className?: string;
};

export function Divider({ className, ...props }: Props) {
  return <View className={cn('h-px bg-border-light', className)} {...props} />;
}
