import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';

import { getAccounts, type Account } from '@/src/api/accountsApi';
import { useAuthStore } from '@/src/store/authStore';
import { formatMoneyMinor } from '@/src/lib/money';

export default function ProfileScreen() {
  const role = useAuthStore((s) => s.role);
  const userId = useAuthStore((s) => s.userId);
  const lastEmail = useAuthStore((s) => s.lastEmail);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);

  const totalBalanceMinor = useMemo(() => accounts.reduce((sum, a) => sum + (a.balanceMinor || 0), 0), [accounts]);

  const load = useCallback(async (opts?: { showLoader?: boolean }) => {
    const showLoader = opts?.showLoader ?? true;
    if (showLoader) setLoading(true);
    setError(null);

    try {
      const res = await getAccounts();
      setAccounts(res.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load profile');
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load({ showLoader: true });
  }, [load]);

  return (
    <View style={{ flex: 1 }}>
      {error ? (
        <View style={{ padding: 16, gap: 10 }}>
          <Text style={{ color: '#b00020' }}>{error}</Text>
          <Pressable
            onPress={() => load({ showLoader: true })}
            style={({ pressed }) => ({
              opacity: pressed ? 0.85 : 1,
              borderWidth: 1,
              borderColor: '#ddd',
              padding: 12,
              borderRadius: 12,
              alignItems: 'center',
              alignSelf: 'flex-start',
            })}
          >
            <Text style={{ fontWeight: '700' }}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      <FlatList
        data={accounts}
        keyExtractor={(a) => a._id}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              try {
                await load({ showLoader: false });
              } finally {
                setRefreshing(false);
              }
            }}
          />
        }
        ListHeaderComponent={
          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 16, fontWeight: '700' }}>Profile</Text>
              {loading ? <ActivityIndicator /> : null}
            </View>

            <View style={{ padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#eee', gap: 6 }}>
              <Text style={{ color: '#666' }}>Email</Text>
              <Text style={{ fontWeight: '700' }}>{lastEmail ?? '—'}</Text>

              <Text style={{ color: '#666', marginTop: 6 }}>Role</Text>
              <Text style={{ fontWeight: '700' }}>{role ?? '—'}</Text>

              <Text style={{ color: '#666', marginTop: 6 }}>User ID</Text>
              <Text style={{ fontWeight: '700' }}>{userId ?? '—'}</Text>

              <Text style={{ color: '#666', marginTop: 6 }}>Total balance</Text>
              <Text style={{ fontWeight: '700' }}>{formatMoneyMinor(totalBalanceMinor)}</Text>
            </View>

            <Text style={{ color: '#666' }}>Accounts</Text>
          </View>
        }
        ListEmptyComponent={
          loading ? null : (
            <View style={{ padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#eee' }}>
              <Text style={{ fontWeight: '700' }}>No accounts</Text>
              <Text style={{ color: '#666', marginTop: 6 }}>Accounts will show up here once created.</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <View style={{ padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#eee', gap: 4 }}>
            <Text style={{ fontWeight: '700' }}>{item.type.toUpperCase()} • {item.currency}</Text>
            <Text style={{ color: '#666' }}>Acct: {item.accountNumber}</Text>
            <Text style={{ color: '#111', fontWeight: '700' }}>{formatMoneyMinor(item.balanceMinor, item.currency)}</Text>
          </View>
        )}
      />
    </View>
  );
}
