import React, { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { logout } from '@/src/api/authApi';
import { useAuthStore } from '@/src/store/authStore';

export default function SettingsScreen() {
  const router = useRouter();
  const role = useAuthStore((s) => s.role);
  const userId = useAuthStore((s) => s.userId);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const clear = useAuthStore((s) => s.clear);
  const lastEmail = useAuthStore((s) => s.lastEmail);

  const [submitting, setSubmitting] = useState(false);

  async function onLogout() {
    if (submitting) return;
    setSubmitting(true);

    try {
      if (refreshToken) {
        await logout({ refreshToken });
      }
    } catch {
      // Logout should be best-effort.
    } finally {
      clear();
      router.replace('/(auth)/login');
      setSubmitting(false);
    }
  }

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 20, fontWeight: '700' }}>Settings</Text>

      <View style={{ padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#eee', gap: 6 }}>
        <Text style={{ color: '#666' }}>Email</Text>
        <Text style={{ fontWeight: '700' }}>{lastEmail ?? '—'}</Text>

        <Text style={{ color: '#666', marginTop: 6 }}>Role</Text>
        <Text style={{ fontWeight: '700' }}>{role ?? '—'}</Text>

        <Text style={{ color: '#666', marginTop: 6 }}>User ID</Text>
        <Text style={{ fontWeight: '700' }}>{userId ?? '—'}</Text>
      </View>

      <Pressable
        testID="settings-logout"
        onPress={onLogout}
        style={({ pressed }) => ({
          opacity: pressed ? 0.85 : 1,
          backgroundColor: '#111',
          padding: 14,
          borderRadius: 14,
          alignItems: 'center',
          marginTop: 6,
          flexDirection: 'row',
          justifyContent: 'center',
          gap: 10,
        })}
      >
        {submitting ? <ActivityIndicator color="#fff" /> : null}
        <Text style={{ color: '#fff', fontWeight: '700' }}>Log out</Text>
      </Pressable>
    </View>
  );
}
