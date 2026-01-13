import React, { useMemo, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import { login } from '@/src/api/authApi';
import { decodeJwt } from '@/src/lib/jwt';
import { useAuthStore } from '@/src/store/authStore';

export default function LoginScreen() {
  const router = useRouter();
  const setTokens = useAuthStore((s) => s.setTokens);
  const setProfile = useAuthStore((s) => s.setProfile);
  const beginOtp = useAuthStore((s) => s.beginOtp);
  const clearPendingOtp = useAuthStore((s) => s.clearPendingOtp);
  const setLastEmail = useAuthStore((s) => s.setLastEmail);
  const role = useAuthStore((s) => s.role);

  const [email, setEmail] = useState(useAuthStore.getState().lastEmail ?? '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(() => email.trim().length > 3 && password.length >= 6 && !submitting, [email, password, submitting]);

  async function onSubmit() {
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      setLastEmail(normalizedEmail);

      const result = await login({ email: normalizedEmail, password });

      if (result.requiresOtp) {
        clearPendingOtp();
        beginOtp({ email: normalizedEmail });
        router.push('/(auth)/otp');
        return;
      }

      // Tokens immediately available (user already OTP-verified)
      setTokens({ accessToken: result.accessToken, refreshToken: result.refreshToken });

      const payload = decodeJwt(result.accessToken);
      if (payload.sub && payload.role) {
        setProfile({ userId: payload.sub, role: payload.role });
      }

      clearPendingOtp();

      if (payload.role === 'admin') router.replace({ pathname: '/(admin)' } as any);
      else router.replace('/(tabs)');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={{ flex: 1 }}>
      <View style={{ flex: 1, padding: 20, justifyContent: 'center', gap: 12 }}>
        <Text style={{ fontSize: 28, fontWeight: '700' }}>Finoryx</Text>
        <Text style={{ color: '#666' }}>Sign in to continue</Text>

        <View style={{ gap: 8 }}>
          <Text style={{ fontWeight: '600' }}>Email</Text>
          <TextInput
            testID="login-email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@company.com"
            style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 12 }}
          />
        </View>

        <View style={{ gap: 8 }}>
          <Text style={{ fontWeight: '600' }}>Password</Text>
          <TextInput
            testID="login-password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
            style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 12 }}
          />
        </View>

        {error ? <Text style={{ color: '#b00020' }}>{error}</Text> : null}

        <Pressable
          testID="login-submit"
          onPress={onSubmit}
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
          <Text style={{ color: '#fff', fontWeight: '700' }}>Sign in</Text>
        </Pressable>

        <Pressable
          testID="login-register"
          onPress={() => router.push('/(auth)/register')}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, padding: 10, alignItems: 'center' })}
        >
          <Text style={{ color: '#444' }}>Create a new account</Text>
        </Pressable>

        {role === 'admin' ? (
          <Text style={{ marginTop: 10, color: '#666' }}>Admin account detected. You’ll be redirected after sign-in.</Text>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}
