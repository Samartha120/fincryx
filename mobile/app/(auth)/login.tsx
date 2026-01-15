import { authKeys, getItem, setItem } from '@/src/auth/storage';
import { AuthCard } from '@/src/components/ui/AuthCard';
import { Logo } from '@/src/components/ui/Logo';
import { PrimaryButton } from '@/src/components/ui/PrimaryButton';
import { TextInputField } from '@/src/components/ui/TextInputField';
import { getApiBaseUrl } from '@/src/lib/env';
import { useAuthStore } from '@/src/store/useAuthStore';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';

export default function LoginScreen() {
  const router = useRouter();
  const { loginUser } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const retryRef = useRef(false);

  const checkServerReachable = async (): Promise<boolean> => {
    if (typeof fetch !== 'function') return false;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6_000);

    try {
      const base = getApiBaseUrl().replace(/\/+$/g, '');
      const res = await fetch(`${base}/health`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      return typeof res.status === 'number' && res.status > 0;
    } catch {
      return false;
    } finally {
      clearTimeout(timeout);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const last = await getItem(authKeys.lastEmail);
        if (mounted && last) setEmail(last);
      } catch {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    // Email validation
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email';
    }

    // Password validation
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});
    retryRef.current = false;

    const normalizedEmail = email.trim().toLowerCase();

    try {
      const reachable = await checkServerReachable();
      if (!reachable) {
        setErrors({ general: 'Can’t reach the server. Please try again in a moment.' });
        return;
      }

      // Persist last email only when Remember Me is enabled
      await setItem(authKeys.lastEmail, rememberMe ? normalizedEmail : null);

      await loginUser(normalizedEmail, password, rememberMe);
      console.log('Login successful, user authenticated');
      // Route to root so splash can redirect based on role
      router.replace('/');
    } catch (error) {
      const err = error as (Error & { status?: number }) | any;
      const message = err instanceof Error ? err.message : 'Login failed. Please try again.';

      // Dedicated offline experience for network failures (avoid LogBox console.error)
      if (err?.kind === 'network') {
        const reachable = await checkServerReachable();
        if (!reachable) {
          setErrors({ general: 'Can’t reach the server. Please try again in a moment.' });
          return;
        }

        if (!retryRef.current) {
          retryRef.current = true;
          setErrors({ general: 'Server is waking up. Retrying…' });
          await new Promise((r) => setTimeout(r, 1500));
          try {
            await loginUser(normalizedEmail, password, rememberMe);
            router.replace('/');
            return;
          } catch (retryError) {
            const retryErr = retryError as (Error & { status?: number }) | any;
            if (__DEV__) {
              console.error('Login retry error:', retryErr);
            }
          }
        }

        setErrors({ general: 'Server is waking up. Please try again in a moment.' });
        return;
      }

      // If backend requires OTP verification, redirect to OTP screen
      const needsVerification =
        err?.status === 403 ||
        /verify|otp|not verified|unverified/i.test(message);

      if (needsVerification && normalizedEmail) {
        if (__DEV__) {
          console.warn('Login requires OTP verification:', err);
        }
        router.push({ pathname: '/(auth)/verify-otp', params: { email: normalizedEmail } });
        return;
      }

      if (__DEV__) {
        console.error('Login error:', err);
      }

      setErrors({ general: message });
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
            {/* Logo */}
            <View className="items-center mb-xl">
              <Logo size={80} showText={true} />
            </View>

            {/* Header */}
            <View className="mb-lg">
              <Text className="text-title text-text-primary mb-2">
                Welcome Back
              </Text>
              <Text className="text-body text-text-secondary">
                Sign in to your Finoryx account
              </Text>
            </View>

            {/* Form Card */}
            <AuthCard className="gap-md">
              <TextInputField
                label="Email Address"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) setErrors({ ...errors, email: undefined });
                }}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="you@example.com"
                error={errors.email}
                editable={!isLoading}
                required
                testID="login-email"
              />

              <TextInputField
                label="Password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) setErrors({ ...errors, password: undefined });
                }}
                secureTextEntry
                placeholder="Enter your password"
                error={errors.password}
                editable={!isLoading}
                required
                testID="login-password"
              />

              {/* Remember Me */}
              <Pressable
                onPress={() => setRememberMe((v) => !v)}
                disabled={isLoading}
                className="flex-row items-center"
                accessibilityRole="checkbox"
                accessibilityState={{ checked: rememberMe, disabled: isLoading }}
                testID="login-remember-me"
              >
                <View
                  className={
                    rememberMe
                      ? 'h-5 w-5 rounded border border-primary bg-primary items-center justify-center'
                      : 'h-5 w-5 rounded border border-border items-center justify-center'
                  }
                >
                  {rememberMe ? <Text className="text-white text-xs">✓</Text> : null}
                </View>
                <Text className="ml-3 text-body text-text-secondary">Remember me</Text>
              </Pressable>

              {errors.general && (
                <View className="bg-error/10 border border-error/20 rounded-input px-4 py-3">
                  <Text className="text-label text-error">{errors.general}</Text>
                </View>
              )}

              <PrimaryButton 
                title="Sign In" 
                loading={isLoading} 
                disabled={isLoading}
                onPress={handleLogin}
                className="mt-sm"
                testID="login-submit"
              />

              <Pressable
                onPress={() => router.push({ pathname: '/(auth)/forgot-password', params: { email: email.trim() } })}
                disabled={isLoading}
                className="items-center"
              >
                <Text className="text-body text-primary font-semibold">Forgot password?</Text>
              </Pressable>
            </AuthCard>

            {/* Footer */}
            <View className="flex-row items-center justify-center mt-lg">
              <Text className="text-body text-text-secondary">
                Don't have an account?{' '}
              </Text>
              <Pressable onPress={() => router.push('/(auth)/register')} disabled={isLoading}>
                <Text className="text-body text-primary font-semibold">
                  Sign Up
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
