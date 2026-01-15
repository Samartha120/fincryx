import { useColorScheme } from 'nativewind';
import React from 'react';
import { ActivityIndicator, Pressable, Text, type PressableProps } from 'react-native';

import { cn } from '@/src/lib/cn';

type Variant = 'primary' | 'secondary' | 'danger';

type Props = PressableProps & {
  title: string;
  loading?: boolean;
  disabled?: boolean;
  variant?: Variant;
  className?: string;
};

export function Button({ title, loading, disabled, variant = 'primary', className, ...props }: Props) {
  const { colorScheme } = useColorScheme();
  const primarySpinner = colorScheme === 'dark' ? '#6D8CFF' : '#1E40AF';
  const isDisabled = Boolean(disabled || loading);

  const baseStyles = 'h-14 items-center justify-center rounded-button px-6';
  const variantStyles = {
    primary: 'bg-primary shadow-button',
    secondary: 'bg-surface border border-border',
    danger: 'bg-error',
  };

  const textStyles = {
    primary: 'text-white',
    secondary: 'text-text-primary',
    danger: 'text-white',
  };

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      className={cn(
        baseStyles,
        variantStyles[variant],
        isDisabled ? 'opacity-50' : 'opacity-100 active:opacity-80',
        className
      )}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' ? primarySpinner : '#FFFFFF'} size="small" />
      ) : (
        <Text className={cn('text-label font-semibold', textStyles[variant])}>{title}</Text>
      )}
    </Pressable>
  );
}
