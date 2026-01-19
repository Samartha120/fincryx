import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { getAccounts, type Account } from '@/src/api/accountsApi';
import {
  getLoanAnalytics,
  getTransactionAnalyticsWithParams,
  type LoanAnalytics,
  type TransactionAnalytics,
} from '@/src/api/analyticsApi';
import { getTransactions, type Transaction } from '@/src/api/transactionsApi';
import { AnimatedIn } from '@/src/components/ui/AnimatedIn';
import { Avatar } from '@/src/components/ui/Avatar';
import { Card } from '@/src/components/ui/Card';
import { CardContainer } from '@/src/components/ui/CardContainer'; // Kept for error/empty states
import { ListItem } from '@/src/components/ui/ListItem';
import { Logo } from '@/src/components/ui/Logo';
import { Screen } from '@/src/components/ui/Screen';
import { ScreenTransition } from '@/src/components/ui/ScreenTransition';
import { SectionHeader } from '@/src/components/ui/SectionHeader';
import { formatMoneyMinor } from '@/src/lib/money';
import { useAuthStore } from '@/src/store/useAuthStore';

// New Components
import { HeroCard } from '@/src/components/dashboard/HeroCard';
import { QuickActions } from '@/src/components/dashboard/QuickActions';
import { InsightSummary } from '@/src/components/dashboard/InsightSummary';

type DashboardData = {
  accounts: Account[];
  transactions: Transaction[];
};

type DashboardAnalytics = {
  transactions: TransactionAnalytics | null;
  loans: LoanAnalytics | null;
};

type TxAnalyticsPreset = 'monthly6' | 'monthly12' | 'daily14';

export default function DashboardScreen() {
  const { colorScheme } = useColorScheme();
  const spinnerColor = colorScheme === 'dark' ? '#6D8CFF' : '#1E40AF';
  const router = useRouter();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData>({ accounts: [], transactions: [] });

  // Analytics
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analytics, setAnalytics] = useState<DashboardAnalytics>({ transactions: null, loans: null });

  // Load essential data
  async function loadCore(): Promise<void> {
    const [accountsRes, txRes] = await Promise.all([getAccounts(), getTransactions({ page: 1, limit: 10 })]);
    setData({ accounts: accountsRes.items, transactions: txRes.items });
  }

  // Load simplified analytics for the "Insights" carousel
  async function loadAnalytics(): Promise<void> {
    setAnalyticsLoading(true);
    const [txRes, loanRes] = await Promise.allSettled([
      getTransactionAnalyticsWithParams({ range: 'monthly', points: 6 }), // Ensure we get monthly spend
      getLoanAnalytics(),
    ]);

    setAnalytics({
      transactions: txRes.status === 'fulfilled' ? txRes.value : null,
      loans: loanRes.status === 'fulfilled' ? loanRes.value : null,
    });
    setAnalyticsLoading(false);
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setError(null);
        await loadCore();
        void loadAnalytics();
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : 'Failed to load dashboard');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useFocusEffect(
    useCallback(() => {
      void Promise.allSettled([loadCore(), loadAnalytics()]);
    }, [])
  );

  // Computed Values
  const totalBalanceMinor = useMemo(
    () => data.accounts.reduce((sum, a) => sum + (Number.isFinite(a.balanceMinor) ? a.balanceMinor : 0), 0),
    [data.accounts]
  );

  const primaryAccount = useMemo(() => data.accounts[0] ?? null, [data.accounts]);

  const recent = useMemo(() => data.transactions.slice(0, 5), [data.transactions]);

  // Insights Calculations
  const monthlySpend = useMemo(() => {
    const debit = analytics.transactions?.debit ?? [];
    // Last item is typically the current/latest month in the series
    return debit.length > 0 ? Number(debit[debit.length - 1]) : 0;
  }, [analytics.transactions]);

  const loanStats = useMemo(() => {
    const total = analytics.loans?.totalLoan ?? 0;
    const paid = analytics.loans?.paid ?? 0;
    const pending = analytics.loans?.pending ?? 0;
    const safeTotal = Math.max(0, total || paid + pending);
    return { total: safeTotal, paid: Math.max(0, paid), pending: Math.max(0, pending), currency: primaryAccount?.currency ?? 'INR' };
  }, [analytics.loans, primaryAccount]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  if (loading) {
    return (
      <Screen className="items-center justify-center">
        <ActivityIndicator color={spinnerColor} />
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'left', 'right']} className="bg-neutral-50 dark:bg-neutral-900">
      <ScreenTransition>
        <ScrollView
          contentContainerClassName="pb-xl"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                try {
                  await Promise.allSettled([loadCore(), loadAnalytics()]);
                } finally {
                  setRefreshing(false);
                }
              }}
            />
          }
        >
          {/* Header Section */}
          <View className="px-md pt-lg pb-4 bg-white dark:bg-neutral-800 rounded-b-3xl shadow-sm z-10">
            <AnimatedIn>
              <View className="flex-row items-center justify-between mb-6">
                <View className="flex-row items-center gap-3">
                  <Logo size={40} showText={false} />
                  <View>
                    <Text className="text-xs text-text-secondary font-medium uppercase tracking-wider">{greeting}</Text>
                    <Text className="text-xl font-bold text-text-primary">
                      {user?.fullName ?? 'User'}
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-center gap-3">
                  <Pressable
                    onPress={() => router.push('/(tabs)/notifications')}
                    className="w-10 h-10 rounded-full bg-neutral-100 items-center justify-center"
                  >
                    <FontAwesome name="bell-o" size={18} color="#64748B" />
                  </Pressable>
                  <Pressable onPress={() => router.push('/(tabs)/profile')}>
                    <Avatar name={user?.fullName ?? user?.email} size="md" />
                  </Pressable>
                </View>
              </View>
            </AnimatedIn>

            {/* Hero Card */}
            <AnimatedIn delayMs={100}>
              <HeroCard
                totalBalanceMinor={totalBalanceMinor}
                currency={primaryAccount?.currency ?? 'INR'}
              />
            </AnimatedIn>
          </View>

          <View className="px-md">
            {/* Quick Actions */}
            <AnimatedIn delayMs={200}>
              <View className="mt-6 mb-2">
                <Text className="text-sm font-semibold text-text-primary mb-4 px-2">Quick Actions</Text>
                <QuickActions />
              </View>
            </AnimatedIn>

            {/* Insights Carousel */}
            <AnimatedIn delayMs={300}>
              <View className="mt-6">
                <View className="flex-row justify-between items-center mb-3 px-2">
                  <Text className="text-sm font-semibold text-text-primary">Insights</Text>
                  <Pressable onPress={() => router.push('/(tabs)/analytics')}>
                    <Text className="text-blue-600 text-xs font-medium">View all</Text>
                  </Pressable>
                </View>
                <InsightSummary
                  monthlySpend={monthlySpend}
                  monthlySpendCurrency={primaryAccount?.currency ?? 'INR'}
                  loanStatus={loanStats}
                  monthlyIncome={(() => {
                    const credit = analytics.transactions?.credit ?? [];
                    // Return the last item (current month) or 0
                    return credit.length > 0 ? Number(credit[credit.length - 1]) : 0;
                  })()}
                />
              </View>
            </AnimatedIn>

            {/* Recent Activity */}
            <AnimatedIn delayMs={400}>
              <View className="mt-8 mb-10">
                <View className="flex-row justify-between items-center mb-3 px-2">
                  <Text className="text-sm font-semibold text-text-primary">Recent Activity</Text>
                  <Pressable onPress={() => router.push('/(tabs)/transactions')}>
                    <Text className="text-blue-600 text-xs font-medium">See all</Text>
                  </Pressable>
                </View>

                <View className="bg-white dark:bg-neutral-800 rounded-2xl p-2 shadow-sm">
                  {recent.length === 0 ? (
                    <View className="p-4 items-center">
                      <Text className="text-text-secondary text-sm">No recent transactions</Text>
                    </View>
                  ) : (
                    recent.map((t, i) => {
                      const isLast = i === recent.length - 1;
                      const isDebit = t.type === 'transfer' && (t as any)?.fromAccountId;
                      const tone = isDebit ? 'danger' : 'success';
                      // Simple distinct icons
                      const iconName = t.type === 'transfer' ? 'exchange'
                        : t.type === 'loan_payment' ? 'credit-card'
                          : 'bolt';

                      return (
                        <View key={t._id}>
                          <ListItem
                            icon={iconName}
                            tone={tone}
                            title={t.type === 'transfer' ? 'Transfer' : t.type === 'loan_payment' ? 'Loan Payment' : 'Transaction'}
                            subtitle={t.reference || 'No reference'}
                            rightTitle={formatMoneyMinor(t.amountMinor, t.currency)}
                            rightSubtitle={new Date(t.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            onPress={() => router.push('/(tabs)/transactions')}
                            className="border-0 bg-transparent shadow-none rounded-none"
                          />
                          {!isLast && <View className="h-[1px] bg-neutral-100 ml-14" />}
                        </View>
                      );
                    })
                  )}
                </View>
              </View>
            </AnimatedIn>
          </View>
        </ScrollView>
      </ScreenTransition>
    </Screen>
  );
}
