import { cn } from '@/src/lib/cn';
import React from 'react';
import { View, type ViewProps } from 'react-native';

type AuthCardProps = ViewProps & {
  className?: string;
};

/**
 * AuthCard - Standard container for auth screens
 * Clean, minimal card with shadow and rounded corners
 */
export function AuthCard({ className, children, ...props }: AuthCardProps) {
  return (
    <View
      className={cn(
        'bg-surface rounded-card p-lg shadow-card',
        'border border-border-light',
        className
      )}
      {...props}
    >
      {children}
    </View>
  );
}
