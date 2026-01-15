import * as authApi from '@/src/api/authApi';
import { AuthCard } from '@/src/components/ui/AuthCard';
import { Logo } from '@/src/components/ui/Logo';
import { PrimaryButton } from '@/src/components/ui/PrimaryButton';
import { useAuthStore } from '@/src/store/useAuthStore';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

export default function VerifyOtpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const { verifyOtp, pendingVerificationEmail } = useAuthStore();

  const email = params.email || pendingVerificationEmail || '';
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState<string | undefined>();
  const [info, setInfo] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const lastAutoSubmitted = useRef<string | null>(null);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setInterval(() => {
      setResendCooldown((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [resendCooldown]);

  const handleOtpChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits

    setError(undefined);
    setInfo(undefined);

    // Handle paste of full code
    if (value.length > 1) {
      const digits = value.slice(0, 6).split('');
      const next = Array.from({ length: 6 }, (_, i) => digits[i] ?? '');
      setOtp(next);
      const nextIndex = Math.min(digits.length, 6) - 1;
      if (nextIndex >= 0) {
        inputRefs.current[nextIndex]?.focus();
      }
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }

    if (!email) {
      setError('Email not found. Please register again.');
      return;
    }

    setIsLoading(true);
    setError(undefined);
    setInfo(undefined);

    try {
      await verifyOtp(email, otpCode);
      console.log('OTP verified successfully');
      // Route to root so splash can redirect based on role
      router.replace('/');
    } catch (error) {
      if ((error as any)?.kind === 'network') {
        if (__DEV__) {
          console.warn('OTP verification network error:', error);
        }
        const returnTo = email ? `/(auth)/verify-otp?email=${encodeURIComponent(email)}` : '/(auth)/verify-otp';
        router.push({ pathname: '/offline' as any, params: { returnTo } } as any);
        return;
      }

      if (__DEV__) {
        console.error('OTP verification error:', error);
      }

      const message = error instanceof Error ? error.message : 'Verification failed. Please try again.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-submit when 6 digits are filled
  useEffect(() => {
    const code = otp.join('');
    const complete = code.length === 6 && otp.every((d) => d.length === 1);
    if (!complete) {
      lastAutoSubmitted.current = null;
      return;
    }
    if (!email) return;
    if (isLoading) return;
    if (lastAutoSubmitted.current === code) return;
    lastAutoSubmitted.current = code;
    void handleVerify();
  }, [otp, email, isLoading]);

  const handleResendOtp = async () => {
    if (!email) {
      setError('Email not found. Please go back and sign in again.');
      return;
    }

    if (resendCooldown > 0) return;

    setIsLoading(true);
    setError(undefined);
    setInfo(undefined);

    try {
      await authApi.requestOtp({ email });
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      setInfo('A new verification code was sent.');
      setResendCooldown(30);
    } catch (e) {
      if ((e as any)?.kind === 'network') {
        if (__DEV__) {
          console.warn('Resend OTP network error:', e);
        }
        const returnTo = email ? `/(auth)/verify-otp?email=${encodeURIComponent(email)}` : '/(auth)/verify-otp';
        router.push({ pathname: '/offline' as any, params: { returnTo } } as any);
        return;
      }

      if (__DEV__) {
        console.error('Resend OTP error:', e);
      }

      const message = e instanceof Error ? e.message : 'Failed to resend code. Please try again.';
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
            {/* Logo */}
            <View className="items-center mb-xl">
              <Logo size={80} showText={true} />
            </View>

            {/* Header */}
            <View className="mb-lg">
              <Text className="text-title text-text-primary mb-2">
                Verify Your Account
              </Text>
              <Text className="text-body text-text-secondary">
                Enter the 6-digit code sent to
              </Text>
              <Text className="text-body text-primary font-semibold mt-1">
                {email}
              </Text>
            </View>

            {/* Form Card */}
            <AuthCard className="gap-lg">
              {/* OTP Input */}
              <View>
                <Text className="text-label text-text-primary mb-3">
                  Verification Code
                </Text>
                <View className="flex-row justify-between gap-2">
                  {otp.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={(ref) => {
                        inputRefs.current[index] = ref;
                      }}
                      className="flex-1 h-14 text-center text-title text-text-primary bg-surface border border-border rounded-input"
                      value={digit}
                      onChangeText={(value) => handleOtpChange(value, index)}
                      onKeyPress={(e) => handleKeyPress(e, index)}
                      keyboardType="number-pad"
                      maxLength={1}
                      editable={!isLoading}
                      selectTextOnFocus
                    />
                  ))}
                </View>
              </View>

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
                title="Verify Account" 
                loading={isLoading} 
                disabled={isLoading || otp.join('').length !== 6}
                onPress={handleVerify}
              />

              {/* Resend OTP */}
              <View className="flex-row items-center justify-center mt-sm">
                <Text className="text-body text-text-secondary">
                  Didn't receive the code?{' '}
                </Text>
                <Pressable
                  onPress={handleResendOtp}
                  disabled={isLoading || resendCooldown > 0}
                >
                  <Text className="text-body text-primary font-semibold">
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend'}
                  </Text>
                </Pressable>
              </View>
            </AuthCard>

            {/* Back to Login */}
            <View className="flex-row items-center justify-center mt-lg">
              <Pressable
                onPress={() => router.replace('/(auth)/login')}
                disabled={isLoading}
              >
                <Text className="text-body text-text-secondary">
                  Back to Sign In
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
