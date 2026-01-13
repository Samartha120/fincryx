import React, { useMemo, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import { register } from '@/src/api/authApi';
import { useAuthStore } from '@/src/store/authStore';

export default function RegisterScreen() {
  const router = useRouter();
  const beginOtp = useAuthStore((s) => s.beginOtp);
  const clearPendingOtp = useAuthStore((s) => s.clearPendingOtp);
  const setLastEmail = useAuthStore((s) => s.setLastEmail);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(useAuthStore.getState().lastEmail ?? '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    const normalizedEmail = email.trim();
    const nameOk = fullName.trim().length >= 2;
    const emailOk = normalizedEmail.includes('@') && normalizedEmail.includes('.');
    const passOk = password.length >= 6;
    const matchOk = password === confirmPassword;
    return nameOk && emailOk && passOk && matchOk && !submitting;
  }, [confirmPassword, email, fullName, password, submitting]);

  async function onSubmit() {
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);
    setDevOtp(null);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const name = fullName.trim();

      setLastEmail(normalizedEmail);

      const res = await register({ fullName: name, email: normalizedEmail, password });

      clearPendingOtp();
      beginOtp({ email: normalizedEmail });

      if (__DEV__ && res?.otp) setDevOtp(res.otp);

      router.push('/(auth)/otp');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={{ flex: 1 }}>
      <View style={{ flex: 1, padding: 20, justifyContent: 'center', gap: 12 }}>
        <Text style={{ fontSize: 28, fontWeight: '700' }}>Create account</Text>
        <Text style={{ color: '#666' }}>Register, then verify OTP to continue</Text>

        <View style={{ gap: 8 }}>
          <Text style={{ fontWeight: '600' }}>Full name</Text>
          <TextInput
            testID="register-fullName"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Jane Doe"
            style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 12 }}
          />
        </View>

        <View style={{ gap: 8 }}>
          <Text style={{ fontWeight: '600' }}>Email</Text>
          <TextInput
            testID="register-email"
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
            testID="register-password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
            style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 12 }}
          />
        </View>

        <View style={{ gap: 8 }}>
          <Text style={{ fontWeight: '600' }}>Confirm password</Text>
          <TextInput
            testID="register-confirmPassword"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            placeholder="••••••••"
            style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 12 }}
          />
        </View>

        {error ? <Text style={{ color: '#b00020' }}>{error}</Text> : null}
        {devOtp ? <Text style={{ color: '#666' }}>DEV OTP: {devOtp}</Text> : null}

        <Pressable
          testID="register-submit"
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
          <Text style={{ color: '#fff', fontWeight: '700' }}>Create account</Text>
        </Pressable>

        <Pressable
          testID="register-back"
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
