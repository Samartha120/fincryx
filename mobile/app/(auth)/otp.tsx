import React, { useMemo, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import { verifyOtp } from '@/src/api/authApi';
import { decodeJwt } from '@/src/lib/jwt';
import { useAuthStore } from '@/src/store/authStore';

export default function OtpScreen() {
  const router = useRouter();
  const pendingEmail = useAuthStore((s) => s.pendingEmail);
  const clearPendingOtp = useAuthStore((s) => s.clearPendingOtp);
  const setTokens = useAuthStore((s) => s.setTokens);
  const setProfile = useAuthStore((s) => s.setProfile);

  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(() => otp.trim().length >= 4 && !submitting, [otp, submitting]);

  async function onVerify() {
    if (!pendingEmail) {
      router.replace('/(auth)/login');
      return;
    }

    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);

    try {
      const tokens = await verifyOtp({ email: pendingEmail, otp: otp.trim() });
      setTokens(tokens);

      const payload = decodeJwt(tokens.accessToken);
      if (payload.sub && payload.role) {
        setProfile({ userId: payload.sub, role: payload.role });
      }

      clearPendingOtp();

      if (payload.role === 'admin') router.replace({ pathname: '/(admin)' } as any);
      else router.replace('/(tabs)');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'OTP verification failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={{ flex: 1 }}>
      <View style={{ flex: 1, padding: 20, justifyContent: 'center', gap: 12 }}>
        <Text style={{ fontSize: 24, fontWeight: '700' }}>Verify OTP</Text>
        <Text style={{ color: '#666' }}>{pendingEmail ? `Sent to ${pendingEmail}` : 'Missing email. Please login again.'}</Text>

        <View style={{ gap: 8 }}>
          <Text style={{ fontWeight: '600' }}>OTP</Text>
          <TextInput
            testID="otp-code"
            value={otp}
            onChangeText={setOtp}
            placeholder="123456"
            keyboardType="number-pad"
            style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 12 }}
          />
        </View>

        {error ? <Text style={{ color: '#b00020' }}>{error}</Text> : null}

        <Pressable
          testID="otp-submit"
          onPress={onVerify}
          disabled={!canSubmit}
          style={({ pressed }) => ({
            opacity: !canSubmit ? 0.5 : pressed ? 0.8 : 1,
            backgroundColor: '#111',
            padding: 14,
            borderRadius: 14,
            marginTop: 8,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 10,
          })}
        >
          {submitting ? <ActivityIndicator color="#fff" /> : null}
          <Text style={{ color: '#fff', fontWeight: '700' }}>Verify</Text>
        </Pressable>

        <Pressable
          testID="otp-back"
          onPress={() => {
            clearPendingOtp();
            router.replace('/(auth)/login');
          }}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, padding: 10, alignItems: 'center' })}
        >
          <Text style={{ color: '#444' }}>Back to login</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
