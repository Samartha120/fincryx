import { cn } from '@/src/lib/cn';
import { useColorScheme } from 'nativewind';
import React from 'react';
import { ActivityIndicator, Pressable, Text, type PressableProps } from 'react-native';

type PrimaryButtonProps = PressableProps & {
  title: string;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'large' | 'medium';
  className?: string;
};

/**
 * PrimaryButton - Standard fintech button
 * Professional, clean design with loading states
 */
export function PrimaryButton({
  title,
  loading = false,
  variant = 'primary',
  size = 'large',
  className,
  disabled,
  ...props
}: PrimaryButtonProps) {
  const { colorScheme } = useColorScheme();
  const primarySpinner = colorScheme === 'dark' ? '#6D8CFF' : '#1E40AF';
  const isDisabled = disabled || loading;

  const baseStyles = cn(
    'items-center justify-center rounded-button',
    'transition-all duration-150',
    size === 'large' ? 'h-14 px-6' : 'h-12 px-5'
  );

  const variantStyles = {
    primary: 'bg-primary shadow-button',
    secondary: 'bg-text-secondary',
    outline: 'bg-transparent border-2 border-primary',
  };

  const textStyles = {
    primary: 'text-white',
    secondary: 'text-white',
    outline: 'text-primary',
  };

  const disabledStyles = isDisabled ? 'opacity-50' : 'active:opacity-80';

  return (
    <Pressable
      className={cn(
        baseStyles,
        variantStyles[variant],
        disabledStyles,
        className
      )}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? primarySpinner : '#FFFFFF'} size="small" />
      ) : (
        <Text className={cn('text-label font-semibold', textStyles[variant])}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}
