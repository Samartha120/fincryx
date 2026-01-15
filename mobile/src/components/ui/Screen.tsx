import React from 'react';
import { SafeAreaView, type SafeAreaViewProps } from 'react-native-safe-area-context';

import { cn } from '@/src/lib/cn';

type Props = SafeAreaViewProps & {
  className?: string;
};

export function Screen({ className, children, ...props }: Props) {
  return (
    <SafeAreaView className={cn('flex-1 bg-background', className)} {...props}>
      {children}
    </SafeAreaView>
  );
}
