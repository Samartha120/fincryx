import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, View } from 'react-native';

import { getAccounts, type Account } from '@/src/api/accountsApi';
import { getTransactions, type Transaction } from '@/src/api/transactionsApi';
import { MiniBarChart } from '@/src/components/MiniBarChart';
import { formatMoneyMinor } from '@/src/lib/money';

type DashboardData = {
  accounts: Account[];
  transactions: Transaction[];
};

export default function DashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData>({ accounts: [], transactions: [] });

  async function load(): Promise<void> {
    const [accountsRes, txRes] = await Promise.all([getAccounts(), getTransactions({ page: 1, limit: 10 })]);
    setData({ accounts: accountsRes.items, transactions: txRes.items });
  }

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setError(null);
        await load();
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : 'Failed to load dashboard');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const totalBalanceMinor = useMemo(
    () => data.accounts.reduce((sum, a) => sum + (Number.isFinite(a.balanceMinor) ? a.balanceMinor : 0), 0),
    [data.accounts],
  );

  const accountsChart = useMemo(
    () =>
      data.accounts.slice(0, 5).map((a) => ({
        label: a.type,
        value: a.balanceMinor,
      })),
    [data.accounts],
  );

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (data.accounts.length === 0) {
    return (
      <View style={{ flex: 1, padding: 16, gap: 10 }}>
        <Text style={{ fontSize: 20, fontWeight: '700' }}>Dashboard</Text>
        {error ? <Text style={{ color: '#b00020' }}>{error}</Text> : null}
        <View
          testID="dashboard-no-accounts"
          style={{ padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#eee' }}
        >
          <Text style={{ fontWeight: '700' }}>No accounts yet</Text>
          <Text style={{ color: '#666', marginTop: 6 }}>
            Once your account is created, balances and activity will show up here.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <FlatList
      data={data.transactions}
      keyExtractor={(t) => t._id}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            try {
              setError(null);
              await load();
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Failed to refresh');
            } finally {
              setRefreshing(false);
            }
          }}
        />
      }
      ListHeaderComponent={
        <View style={{ padding: 16, gap: 12 }}>
          <Text style={{ fontSize: 20, fontWeight: '700' }}>Dashboard</Text>
          {error ? <Text style={{ color: '#b00020' }}>{error}</Text> : null}

          <View style={{ padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#eee' }}>
            <Text style={{ color: '#666' }}>Total balance</Text>
            <Text style={{ fontSize: 26, fontWeight: '800' }}>
              {formatMoneyMinor(totalBalanceMinor, data.accounts[0]?.currency ?? 'INR')}
            </Text>
          </View>

          <MiniBarChart title="Balances" items={accountsChart} />

          <Text style={{ fontSize: 16, fontWeight: '700' }}>Recent activity</Text>
          {data.transactions.length === 0 ? <Text style={{ color: '#666' }}>No transactions yet.</Text> : null}
        </View>
      }
      renderItem={({ item }) => (
        <View style={{ paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#f2f2f2' }}>
          <Text style={{ fontWeight: '700' }}>{item.type.toUpperCase()}</Text>
          <Text style={{ color: '#666' }}>
            {formatMoneyMinor(item.amountMinor, item.currency)} • {item.status}
          </Text>
          <Text style={{ color: '#999' }}>{item.reference}</Text>
        </View>
      )}
    />
  );
}
