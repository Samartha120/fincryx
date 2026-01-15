import { cn } from '@/src/lib/cn';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useColorScheme } from 'nativewind';
import React, { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View, type TextInputProps } from 'react-native';

type TextInputFieldProps = TextInputProps & {
  label: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  containerClassName?: string;
  showPasswordToggle?: boolean;
};

/**
 * TextInputField - Standard fintech input field
 * Includes label, input, error state, and helper text
 */
export function TextInputField({
  label,
  error,
  helperText,
  required = false,
  containerClassName,
  showPasswordToggle,
  className,
  ...props
}: TextInputFieldProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [isFocused, setIsFocused] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const isPasswordField = !!props.secureTextEntry;
  const shouldShowToggle = useMemo(() => {
    if (!isPasswordField) return false;
    return showPasswordToggle !== false;
  }, [isPasswordField, showPasswordToggle]);

  const resolvedSecureTextEntry = isPasswordField ? !passwordVisible : props.secureTextEntry;

  return (
    <View className={cn('gap-1.5', containerClassName)}>
      {/* Label */}
      <Text className="text-label text-text-primary">
        {label}
        {required && <Text className="text-error"> *</Text>}
      </Text>

      {/* Input */}
      <View className="relative">
        <TextInput
          className={cn(
            'h-12 px-4 rounded-input bg-surface',
            'border text-body text-text-primary',
            error
              ? 'border-error'
              : isFocused
              ? 'border-primary'
              : 'border-border',
            shouldShowToggle ? 'pr-12' : null,
            className
          )}
          placeholderTextColor={isDark ? '#7A8CB2' : '#9CA3AF'}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
          secureTextEntry={resolvedSecureTextEntry}
        />

        {shouldShowToggle && (
          <Pressable
            onPress={() => setPasswordVisible((v) => !v)}
            hitSlop={10}
            className="absolute right-3 top-0 h-12 justify-center"
            accessibilityRole="button"
            accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
          >
            <Ionicons
              name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={
                error ? '#EF4444' : isFocused ? (isDark ? '#6D8CFF' : '#1E40AF') : isDark ? '#B0BFE4' : '#6B7280'
              }
            />
          </Pressable>
        )}
      </View>

      {/* Error or Helper Text */}
      {error ? (
        <Text className="text-caption text-error">{error}</Text>
      ) : helperText ? (
        <Text className="text-caption text-text-muted">{helperText}</Text>
      ) : null}
    </View>
  );
}
