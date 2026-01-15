import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { getLoanAnalytics, getTransactionAnalyticsWithParams } from '@/src/api/analyticsApi';
import { getTransactions, type Transaction } from '@/src/api/transactionsApi';
import { Card } from '@/src/components/ui/Card';
import { Screen } from '@/src/components/ui/Screen';
import { ScreenTransition } from '@/src/components/ui/ScreenTransition';
import { formatMoneyMinor } from '@/src/lib/money';
import { useAuthStore } from '@/src/store/useAuthStore';

export default function NotificationsScreen() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loanPending, setLoanPending] = useState(0);
  const [dailySpend, setDailySpend] = useState(0);
  const [dailyLabel, setDailyLabel] = useState('today');
  const isFetchingRef = useRef(false);

  const currency = 'INR';

  const loadData = async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setError(null);
    const [txRes, loanRes, txAnalyticsRes] = await Promise.all([getTransactions({ page: 1, limit: 50 }), getLoanAnalytics(), getTransactionAnalyticsWithParams({ range: 'daily', points: 14 })]);
    setTransactions(txRes.items);
    setLoanPending(Math.max(0, loanRes.pending ?? 0));
    const labels = txAnalyticsRes.labels ?? [];
    const debit = txAnalyticsRes.debit ?? [];
    const label = labels.length > 0 ? labels[labels.length - 1] : 'today';
    const value = Number(debit[debit.length - 1] ?? 0);
    setDailyLabel(label);
    setDailySpend(value);
    isFetchingRef.current = false;
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await loadData();
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : 'Failed to load notifications');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const tick = async () => {
        if (!active) return;
        try {
          await loadData();
        } catch {
          // ignore; handled by state
        }
      };

      void tick();
      const interval = setInterval(tick, 15000);

      return () => {
        active = false;
        clearInterval(interval);
      };
    }, []),
  );

  const notifications = useMemo(() => {
    const transferTxs = transactions.filter((t) => t.type === 'transfer').slice(0, 3);
    const latestTxs = transactions.slice(0, 5);

    const transferItems = transferTxs.map((t) => ({
      id: `transfer-${t._id}`,
      title: 'Transfer',
      text: `${formatMoneyMinor(t.amountMinor, t.currency ?? currency)} • ${t.status}`,
    }));

    const transactionItems = latestTxs.map((t) => ({
      id: `tx-${t._id}`,
      title: 'Transaction',
      text: `${formatMoneyMinor(t.amountMinor, t.currency ?? currency)} • ${t.type}`,
    }));

    const loanItem = {
      id: 'loan',
      title: 'Loan',
      text: loanPending > 0 ? formatMoneyMinor(loanPending, currency) : 'No pending loans',
    };

    const dailyItem = {
      id: 'daily',
      title: 'Daily spend',
      text: dailySpend > 0
        ? `${formatMoneyMinor(dailySpend, currency)} (${dailyLabel})`
        : 'No daily spend data yet',
    };

    return [...transferItems, ...transactionItems, loanItem, dailyItem];
  }, [currency, dailyLabel, dailySpend, loanPending, transactions]);

  return (
    <Screen edges={['top', 'left', 'right']}>
      <ScreenTransition>
        <ScrollView
          contentContainerClassName="px-md pt-md pb-lg"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                try {
                  await loadData();
                } catch (e) {
                  setError(e instanceof Error ? e.message : 'Failed to refresh');
                } finally {
                  setRefreshing(false);
                }
              }}
            />
          }
        >
          {loading ? (
            <View className="items-center justify-center mt-lg">
              <ActivityIndicator />
            </View>
          ) : null}

          {error ? (
            <Card className="mt-md border-error/20 bg-error/10">
              <Text className="text-label text-error">{error}</Text>
            </Card>
          ) : null}

          <Card className="mt-md gap-3">
            <View className="flex-row items-center gap-2">
              <FontAwesome name="bell" size={18} color="#1E40AF" />
              <Text className="text-label text-text-primary font-semibold">
                {user?.fullName ? `${user.fullName}'s notifications` : 'Notifications'}
              </Text>
            </View>

            {notifications.length === 0 ? (
              <Text className="text-body text-text-secondary">No notifications yet.</Text>
            ) : (
              <View className="gap-3">
                {notifications.map((note) => (
                  <View key={note.id} className="border-b border-border-light pb-3 last:border-b-0 last:pb-0">
                    <Text className="text-caption text-text-secondary">{note.title}</Text>
                    <Text className="text-body text-text-primary">{note.text}</Text>
                  </View>
                ))}
              </View>
            )}
          </Card>
        </ScrollView>
      </ScreenTransition>
    </Screen>
  );
}
