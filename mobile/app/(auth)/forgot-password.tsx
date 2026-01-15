import * as authApi from '@/src/api/authApi';
import { AuthCard } from '@/src/components/ui/AuthCard';
import { Logo } from '@/src/components/ui/Logo';
import { PrimaryButton } from '@/src/components/ui/PrimaryButton';
import { TextInputField } from '@/src/components/ui/TextInputField';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [info, setInfo] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const initial = (params.email ?? '').trim();
    if (initial) setEmail(initial);
  }, [params.email]);

  const validate = () => {
    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      setError('Email is required');
      return null;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      setError('Please enter a valid email');
      return null;
    }
    return normalized;
  };

  const handleSend = async () => {
    const normalized = validate();
    if (!normalized) return;

    setIsLoading(true);
    setError(undefined);
    setInfo(undefined);

    try {
      await authApi.requestPasswordReset({ email: normalized });
      setInfo('If the email exists, a reset code was sent.');
      router.push({ pathname: '/(auth)/reset-password', params: { email: normalized } });
    } catch (e) {
      if ((e as any)?.kind === 'network') {
        if (__DEV__) {
          console.warn('Password reset request network error:', e);
        }
        const returnTo = `/(auth)/forgot-password?email=${encodeURIComponent(normalized)}`;
        router.push({ pathname: '/offline' as any, params: { returnTo } } as any);
        return;
      }

      if (__DEV__) {
        console.error('Password reset request error:', e);
      }

      const message = e instanceof Error ? e.message : 'Failed to send reset code. Please try again.';
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
              <Text className="text-title text-text-primary mb-2">Forgot Password</Text>
              <Text className="text-body text-text-secondary">We’ll email you a reset code.</Text>
            </View>

            <AuthCard className="gap-md">
              <TextInputField
                label="Email Address"
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  if (error) setError(undefined);
                }}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="you@example.com"
                editable={!isLoading}
                required
              />

              {error && (
                <View className="bg-error/10 border border-error/20 rounded-input px-4 py-3">
                  <Text className="text-label text-error">{error}</Text>
                </View>
              )}

              {info && !error && (
                <View className="bg-primary/10 border border-primary/20 rounded-input px-4 py-3">
                  <Text className="text-label text-text-primary">{info}</Text>
                </View>
              )}

              <PrimaryButton
                title="Send Reset Code"
                loading={isLoading}
                disabled={isLoading}
                onPress={handleSend}
              />
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
