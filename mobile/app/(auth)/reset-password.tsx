import * as authApi from '@/src/api/authApi';
import { AuthCard } from '@/src/components/ui/AuthCard';
import { Logo } from '@/src/components/ui/Logo';
import { PrimaryButton } from '@/src/components/ui/PrimaryButton';
import { TextInputField } from '@/src/components/ui/TextInputField';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();

  const email = (params.email ?? '').trim().toLowerCase();

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (!email) setError('Email not found. Please start again.');
  }, [email]);

  const handleOtpChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;
    setError(undefined);

    // Paste support
    if (value.length > 1) {
      const digits = value.slice(0, 6).split('');
      const next = Array.from({ length: 6 }, (_, i) => digits[i] ?? '');
      setOtp(next);
      const nextIndex = Math.min(digits.length, 6) - 1;
      if (nextIndex >= 0) inputRefs.current[nextIndex]?.focus();
      return;
    }

    const next = [...otp];
    next[index] = value;
    setOtp(next);

    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleReset = async () => {
    if (!email) return;

    const code = otp.join('');
    if (code.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError(undefined);

    try {
      await authApi.confirmPasswordReset({ email, otp: code, newPassword });
      router.replace({ pathname: '/(auth)/login', params: { email } });
    } catch (e) {
      if ((e as any)?.kind === 'network') {
        if (__DEV__) {
          console.warn('Confirm password reset network error:', e);
        }
        const returnTo = `/(auth)/reset-password?email=${encodeURIComponent(email)}`;
        router.push({ pathname: '/offline' as any, params: { returnTo } } as any);
        return;
      }

      if (__DEV__) {
        console.error('Confirm password reset error:', e);
      }

      const message = e instanceof Error ? e.message : 'Reset failed. Please try again.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: 'height' })}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 justify-center px-md py-xl">
            <View className="items-center mb-xl">
              <Logo size={80} showText={true} />
            </View>

            <View className="mb-lg">
              <Text className="text-title text-text-primary mb-2">Reset Password</Text>
              <Text className="text-body text-text-secondary">Enter the code sent to</Text>
              <Text className="text-body text-primary font-semibold mt-1">{email || '—'}</Text>
            </View>

            <AuthCard className="gap-lg">
              <View>
                <Text className="text-label text-text-primary mb-3">Reset Code</Text>
                <View className="flex-row justify-between gap-2">
                  {otp.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={(ref) => {
                        inputRefs.current[index] = ref;
                      }}
                      className="flex-1 h-14 text-center text-title text-text-primary bg-surface border border-border rounded-input"
                      value={digit}
                      onChangeText={(v) => handleOtpChange(v, index)}
                      onKeyPress={(e) => handleKeyPress(e, index)}
                      keyboardType="number-pad"
                      maxLength={1}
                      editable={!isLoading}
                      selectTextOnFocus
                    />
                  ))}
                </View>
              </View>

              <TextInputField
                label="New Password"
                value={newPassword}
                onChangeText={(t) => {
                  setNewPassword(t);
                  if (error) setError(undefined);
                }}
                secureTextEntry
                placeholder="Minimum 8 characters"
                editable={!isLoading}
                required
              />

              <TextInputField
                label="Confirm New Password"
                value={confirmPassword}
                onChangeText={(t) => {
                  setConfirmPassword(t);
                  if (error) setError(undefined);
                }}
                secureTextEntry
                placeholder="Re-enter new password"
                editable={!isLoading}
                required
              />

              {error && (
                <View className="bg-error/10 border border-error/20 rounded-input px-4 py-3">
                  <Text className="text-label text-error">{error}</Text>
                </View>
              )}

              <PrimaryButton
                title="Reset Password"
                loading={isLoading}
                disabled={isLoading}
                onPress={handleReset}
              />

              <View className="flex-row items-center justify-center mt-sm">
                <Pressable onPress={() => router.replace('/(auth)/forgot-password')} disabled={isLoading}>
                  <Text className="text-body text-primary font-semibold">Resend code</Text>
                </Pressable>
              </View>
            </AuthCard>

            <View className="flex-row items-center justify-center mt-lg">
              <Pressable onPress={() => router.replace('/(auth)/login')} disabled={isLoading}>
                <Text className="text-body text-text-secondary">Back to Sign In</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
