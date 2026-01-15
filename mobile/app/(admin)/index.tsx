import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { getAdminStats } from '@/src/api/adminApi';
import { useAuthStore } from '@/src/store/authStore';
import { formatMoneyMinor } from '@/src/lib/money';

export default function AdminHome() {
  const router = useRouter();
  const clear = useAuthStore((s) => s.clear);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Awaited<ReturnType<typeof getAdminStats>> | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const s = await getAdminStats();
        if (!mounted) return;
        setStats(s);
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : 'Failed to load admin stats');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 20, fontWeight: '700' }}>Admin Overview</Text>

      {loading ? <ActivityIndicator /> : null}
      {error ? <Text style={{ color: '#b00020' }}>{error}</Text> : null}

      {stats ? (
        <View style={{ gap: 10 }}>
          <View style={{ padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#eee' }}>
            <Text style={{ color: '#666' }}>Users</Text>
            <Text style={{ fontSize: 22, fontWeight: '700' }}>{stats.users.total}</Text>
            <Text style={{ color: '#666' }}>Customers: {stats.users.customers} • Admins: {stats.users.admins} • OTP verified: {stats.users.otpVerified}</Text>
          </View>
          <View style={{ padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#eee' }}>
            <Text style={{ color: '#666' }}>Accounts</Text>
            <Text style={{ fontSize: 22, fontWeight: '700' }}>{stats.accounts.total}</Text>
            <Text style={{ color: '#666' }}>Total balance: {formatMoneyMinor(stats.accounts.totalBalanceMinor)}</Text>
          </View>
          <View style={{ padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#eee' }}>
            <Text style={{ color: '#666' }}>Transactions</Text>
            <Text style={{ fontSize: 22, fontWeight: '700' }}>{stats.transactions.total}</Text>
            <Text style={{ color: '#666' }}>Last 24h: {stats.transactions.last24hCount} • Volume: {formatMoneyMinor(stats.transactions.last24hVolumeMinor)}</Text>
          </View>
        </View>
      ) : null}

      <View style={{ gap: 10, marginTop: 12 }}>
        <Pressable
          testID="admin-users"
          onPress={() => router.push({ pathname: '/(admin)/users' } as any)}
          style={({ pressed }) => ({
            opacity: pressed ? 0.85 : 1,
            borderWidth: 1,
            borderColor: '#ddd',
            padding: 14,
            borderRadius: 14,
            backgroundColor: '#fff',
          })}
        >
          <Text style={{ fontWeight: '700' }}>View users</Text>
          <Text style={{ color: '#666', marginTop: 4 }}>Paginated list of registered users</Text>
        </Pressable>

        <Pressable
          testID="admin-transactions"
          onPress={() => router.push({ pathname: '/(admin)/transactions' } as any)}
          style={({ pressed }) => ({
            opacity: pressed ? 0.85 : 1,
            borderWidth: 1,
            borderColor: '#ddd',
            padding: 14,
            borderRadius: 14,
            backgroundColor: '#fff',
          })}
        >
          <Text style={{ fontWeight: '700' }}>View transactions</Text>
          <Text style={{ color: '#666', marginTop: 4 }}>All transactions across the platform</Text>
        </Pressable>
      </View>

      <Pressable
        testID="admin-logout"
        onPress={() => clear()}
        style={({ pressed }) => ({
          opacity: pressed ? 0.8 : 1,
          backgroundColor: '#111',
          padding: 14,
          borderRadius: 14,
          alignItems: 'center',
          marginTop: 12,
        })}
      >
        <Text style={{ color: '#fff', fontWeight: '700' }}>Log out</Text>
      </Pressable>
    </View>
  );
}
