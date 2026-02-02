import { AuthCard } from '@/src/components/ui/AuthCard';
import { Logo } from '@/src/components/ui/Logo';
import { PrimaryButton } from '@/src/components/ui/PrimaryButton';
import { TextInputField } from '@/src/components/ui/TextInputField';
import { useAuthStore } from '@/src/store/useAuthStore';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';

export default function RegisterScreen() {
  const router = useRouter();
  const { registerUser } = useAuthStore();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    // Full name validation
    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    }

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

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const normalizedEmail = email.trim().toLowerCase();
      await registerUser(fullName.trim(), normalizedEmail, password);
      console.log('Registration successful, navigating to OTP verification');
      // Navigate to OTP verification
      router.push({
        pathname: '/(auth)/verify-otp',
        params: { email: normalizedEmail }
      });
    } catch (error) {
      if ((error as any)?.kind === 'network') {
        if (__DEV__) {
          console.warn('Registration network error:', error);
        }
        router.push({ pathname: '/offline' as any, params: { returnTo: '/(auth)/register' } } as any);
        return;
      }

      if (__DEV__) {
        console.error('Registration error:', error);
      }

      const message = error instanceof Error ? error.message : 'Registration failed. Please try again.';
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
          <View className="flex-1 justify-center px-lg py-xl">
            {/* Logo */}
            <View className="items-center mb-xl mt-lg">
              <Logo size={90} showText={true} />
            </View>

            {/* Header */}
            <View className="mb-xl">
              <Text className="text-3xl font-bold text-text-primary mb-2 text-center">
                Create Account
              </Text>
              <Text className="text-base text-text-secondary text-center">
                Join Finoryx and start managing your finances
              </Text>
            </View>

            {/* Form Card */}
            <AuthCard className="gap-md">
              <TextInputField
                label="Full Name"
                value={fullName}
                onChangeText={(text) => {
                  setFullName(text);
                  if (errors.fullName) setErrors({ ...errors, fullName: undefined });
                }}
                placeholder="Enter your full name"
                error={errors.fullName}
                editable={!isLoading}
                required
              />

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
              />

              <TextInputField
                label="Password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) setErrors({ ...errors, password: undefined });
                }}
                secureTextEntry
                placeholder="Minimum 8 characters"
                error={errors.password}
                editable={!isLoading}
                required
              />

              <TextInputField
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined });
                }}
                secureTextEntry
                placeholder="Re-enter your password"
                error={errors.confirmPassword}
                editable={!isLoading}
                required
              />

              {errors.general && (
                <View className="bg-error/10 border border-error/20 rounded-input px-4 py-3">
                  <Text className="text-label text-error">{errors.general}</Text>
                </View>
              )}

              <PrimaryButton
                title="Create Account"
                loading={isLoading}
                disabled={isLoading}
                onPress={handleRegister}
                className="mt-sm"
              />
            </AuthCard>

            {/* Footer */}
            <View className="flex-row items-center justify-center mt-xl">
              <Text className="text-base text-text-secondary">
                Already have an account?{' '}
              </Text>
              <Pressable
                onPress={() => router.replace('/(auth)/login')}
                disabled={isLoading}
              >
                <Text className="text-base text-primary font-bold">
                  Sign In
                </Text>
              </Pressable>
            </View>

            {/* Branding */}
            <View className="items-center mt-lg">
              <Text className="text-xs text-text-secondary/60">Secured by Finoryx Banking</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
