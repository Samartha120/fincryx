import React, { useState } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';

import { cn } from '@/src/lib/cn';

type Props = TextInputProps & {
  label: string;
  error?: string;
  className?: string;
};

export function Input({ label, error, className, ...props }: Props) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View className={cn('gap-2', className)}>
      <Text className="text-label text-text-primary">{label}</Text>
      <TextInput
        placeholderTextColor="#9CA3AF"
        className={cn(
          'h-14 rounded-input border px-4 text-body text-text-primary bg-surface',
          error ? 'border-error' : isFocused ? 'border-primary' : 'border-border'
        )}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...props}
      />
      {error && (
        <Text className="text-caption text-error">{error}</Text>
      )}
    </View>
  );
}
