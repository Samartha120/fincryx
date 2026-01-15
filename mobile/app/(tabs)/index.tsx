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
import { LoanOverviewChart } from '@/src/components/analytics/LoanOverviewChart';
import { SpendingPatternChart } from '@/src/components/analytics/SpendingPatternChart';
import { TransactionFlowChart } from '@/src/components/analytics/TransactionFlowChart';
import { MiniBarChart } from '@/src/components/MiniBarChart';
import { AnimatedIn } from '@/src/components/ui/AnimatedIn';
import { Avatar } from '@/src/components/ui/Avatar';
import { Card } from '@/src/components/ui/Card';
import { CardContainer } from '@/src/components/ui/CardContainer';
import { IconRow } from '@/src/components/ui/IconRow';
import { ListItem } from '@/src/components/ui/ListItem';
import { Logo } from '@/src/components/ui/Logo';
import { Screen } from '@/src/components/ui/Screen';
import { ScreenTransition } from '@/src/components/ui/ScreenTransition';
import { SectionHeader } from '@/src/components/ui/SectionHeader';
import { StatCard } from '@/src/components/ui/StatCard';
import { formatMoneyMinor } from '@/src/lib/money';
import { useAuthStore } from '@/src/store/useAuthStore';

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

  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [txAnalyticsError, setTxAnalyticsError] = useState<string | null>(null);
  const [loanAnalyticsError, setLoanAnalyticsError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<DashboardAnalytics>({ transactions: null, loans: null });

  const [txPreset] = useState<TxAnalyticsPreset>('monthly6');

  async function loadCore(): Promise<void> {
    // Pull more history to make on-device analytics (spending pattern) meaningful.
    const [accountsRes, txRes] = await Promise.all([getAccounts(), getTransactions({ page: 1, limit: 50 })]);
    setData({ accounts: accountsRes.items, transactions: txRes.items });
  }

  async function loadAnalytics(preset: TxAnalyticsPreset = txPreset): Promise<void> {
    const config =
      preset === 'daily14'
        ? { range: 'daily' as const, points: 14 }
        : preset === 'monthly12'
          ? { range: 'monthly' as const, points: 12 }
          : { range: 'monthly' as const, points: 6 };

    setAnalyticsLoading(true);
    setTxAnalyticsError(null);
    setLoanAnalyticsError(null);

    const [txRes, loanRes] = await Promise.allSettled([
      getTransactionAnalyticsWithParams({ range: config.range, points: config.points }),
      getLoanAnalytics(),
    ]);

    setAnalytics({
      transactions: txRes.status === 'fulfilled' ? txRes.value : null,
      loans: loanRes.status === 'fulfilled' ? loanRes.value : null,
    });

    if (txRes.status === 'rejected') {
      setTxAnalyticsError(txRes.reason instanceof Error ? txRes.reason.message : 'Failed to load transaction analytics');
    }
    if (loanRes.status === 'rejected') {
      setLoanAnalyticsError(loanRes.reason instanceof Error ? loanRes.reason.message : 'Failed to load loan analytics');
    }

    setAnalyticsLoading(false);
  }

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setError(null);
        await loadCore();
        // Analytics should never block the dashboard from rendering.
        void loadAnalytics('monthly6');
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

  useFocusEffect(
    useCallback(() => {
      // Refresh when returning from Transfer/Loans so charts stay current.
      void Promise.allSettled([loadCore(), loadAnalytics()]);
    }, [txPreset]),
  );

  const totalBalanceMinor = useMemo(
    () => data.accounts.reduce((sum, a) => sum + (Number.isFinite(a.balanceMinor) ? a.balanceMinor : 0), 0),
    [data.accounts],
  );

  const primaryAccount = useMemo(() => data.accounts[0] ?? null, [data.accounts]);

  const recent = useMemo(() => data.transactions.slice(0, 5), [data.transactions]);

  const spendTrendItems = useMemo(() => {
    const labels = analytics.transactions?.labels ?? [];
    const debit = analytics.transactions?.debit ?? [];
    // Use debit only: "how much user is spending".
    return labels.map((label, idx) => ({
      label,
      value: Number.isFinite(debit[idx]) ? Number(debit[idx]) : 0,
    }));
  }, [analytics.transactions]);

  const loanStats = useMemo(() => {
    const total = analytics.loans?.totalLoan ?? 0;
    const paid = analytics.loans?.paid ?? 0;
    const pending = analytics.loans?.pending ?? 0;
    const safeTotal = Math.max(0, total || paid + pending);
    const pctPaid = safeTotal > 0 ? Math.round((Math.max(0, paid) / safeTotal) * 100) : 0;
    return { total: safeTotal, paid: Math.max(0, paid), pending: Math.max(0, pending), pctPaid };
  }, [analytics.loans]);

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
      <Screen className="items-center justify-center">
        <ActivityIndicator color={spinnerColor} />
      </Screen>
    );
  }

  if (data.accounts.length === 0) {
    return (
      <Screen edges={['top', 'left', 'right']} className="px-md pt-md">
        <Text className="text-title text-text-primary">Welcome</Text>
        <Text className="text-body text-text-secondary mt-1">Your balances and recent activity</Text>
        {error ? (
          <Card className="mt-4 border-error/20 bg-error/10">
            <Text className="text-label text-error">{error}</Text>
          </Card>
        ) : null}
        <View className="mt-4">
          <Card testID="dashboard-no-accounts" className="gap-2">
            <Text className="text-label text-text-primary font-semibold">No accounts yet</Text>
            <Text className="text-body text-text-secondary">Once your account is created, balances and activity will show up here.</Text>
          </Card>
        </View>
      </Screen>
    );
  }

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
                  setError(null);
                  await Promise.allSettled([loadCore(), loadAnalytics()]);
                } catch (e) {
                  setError(e instanceof Error ? e.message : 'Failed to refresh');
                } finally {
                  setRefreshing(false);
                }
              }}
            />
          }
        >
          {/* 1) Header */}
          <AnimatedIn>
            <View>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <Logo size={36} showText={false} />
                  <View className="gap-1">
                    <Text className="text-caption text-text-secondary">Welcome</Text>
                    <Text className="text-heading text-text-primary" numberOfLines={1}>
                      {user?.fullName ? `Hi, ${user.fullName}` : 'Hi there'}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center gap-2">
                  <Pressable
                    onPress={() => router.push('/(tabs)/notifications')}
                    className="h-10 w-10 items-center justify-center rounded-full bg-surface"
                    accessibilityRole="button"
                    accessibilityLabel="Notifications"
                  >
                    <FontAwesome name="bell" size={18} color="#1E40AF" />
                  </Pressable>
                  <Pressable
                    onPress={() => router.push('/(tabs)/profile')}
                    accessibilityRole="button"
                    accessibilityLabel="Profile"
                  >
                    <Avatar name={user?.fullName ?? user?.email} />
                  </Pressable>
                </View>
              </View>
            </View>
          </AnimatedIn>

        {error ? (
          <CardContainer variant="error" className="mt-md">
            <Text className="text-label text-error">{error}</Text>
          </CardContainer>
        ) : null}

        {/* 2) Balance Section */}
        <AnimatedIn delayMs={60}>
          <CardContainer className="mt-md">
            <Text className="text-caption text-text-secondary">Total balance</Text>
            <Text className="text-display text-text-primary mt-1">
              {formatMoneyMinor(totalBalanceMinor, primaryAccount?.currency ?? 'INR')}
            </Text>
            <View className="flex-row items-center justify-between mt-3">
              <Text className="text-body text-text-secondary">
                {primaryAccount?.type ? primaryAccount.type.toUpperCase() : 'All accounts'}
              </Text>
              <Text className="text-body text-text-secondary">{primaryAccount?.currency ?? 'INR'}</Text>
            </View>
          </CardContainer>
        </AnimatedIn>

        {/* 3) Quick Actions */}
        <AnimatedIn delayMs={120}>
          <SectionHeader className="mt-lg" title="Quick actions" subtitle="Move fast, stay in control" />
        </AnimatedIn>
        <AnimatedIn delayMs={170}>
          <CardContainer className="mt-3 p-sm">
            <IconRow
              actions={[
                { label: 'Transfer', icon: 'exchange', onPress: () => router.push('/(tabs)/transfer') },
                { label: 'Loans', icon: 'money', onPress: () => router.push('/(tabs)/loans') },
                { label: 'History', icon: 'list', onPress: () => router.push('/(tabs)/transactions') },
                { label: 'Analytics', icon: 'line-chart', onPress: () => router.push('/(tabs)/analytics') },
              ]}
            />
          </CardContainer>
        </AnimatedIn>

        {/* 4) Analytics Preview */}
        <AnimatedIn delayMs={220}>
          <SectionHeader
            className="mt-lg"
            title="Insights"
            subtitle="Real-time analytics from your activity"
            actionLabel="View all"
            onActionPress={() => router.push('/(tabs)/analytics')}
          />
        </AnimatedIn>

        <View className="mt-3 gap-3">
          <AnimatedIn delayMs={260}>
            <MiniBarChart title="Spend trend" items={spendTrendItems.slice(-6)} />
          </AnimatedIn>

          <AnimatedIn delayMs={300}>
            <View className="flex-row gap-3">
              <StatCard
                className="flex-1"
                label="Loans paid"
                value={`${loanStats.pctPaid}%`}
                hint={loanStats.total > 0 ? `Paid: ${Math.round(loanStats.paid)}` : 'No loan data'}
                icon="check"
                tone={loanStats.pctPaid >= 60 ? 'success' : 'default'}
              />
              <StatCard
                className="flex-1"
                label="Pending"
                value={loanStats.total > 0 ? `${Math.round(loanStats.pending)}` : '—'}
                hint={loanStats.total > 0 ? `Total: ${Math.round(loanStats.total)}` : 'No loan data'}
                icon="clock-o"
                tone={loanStats.pending > 0 ? 'warning' : 'default'}
              />
            </View>
          </AnimatedIn>

          {/* Optional full previews (still inside cards, not a separate page) */}
          <AnimatedIn delayMs={340}>
            <TransactionFlowChart
              title="Transaction flow"
              data={analytics.transactions}
              loading={analyticsLoading}
              error={txAnalyticsError}
            />
          </AnimatedIn>

          <AnimatedIn delayMs={380}>
            <LoanOverviewChart
              title="Loan utilization"
              currency={primaryAccount?.currency ?? 'INR'}
              data={analytics.loans}
              loading={analyticsLoading}
              error={loanAnalyticsError}
            />
          </AnimatedIn>
        </View>

        {/* 5) Recent Activity */}
        <AnimatedIn delayMs={420}>
          <SectionHeader
            className="mt-lg"
            title="Recent activity"
            subtitle="Latest transactions"
            actionLabel="See all"
            onActionPress={() => router.push('/(tabs)/transactions')}
          />
        </AnimatedIn>

        <View className="mt-3 gap-2">
          {recent.length === 0 ? (
            <CardContainer className="p-md">
              <Text className="text-body text-text-secondary">No transactions yet.</Text>
            </CardContainer>
          ) : (
            recent.map((t) => {
              const isDebit = t.type === 'transfer' && (t as any)?.fromAccountId;
              const tone = isDebit ? 'danger' : 'success';
              const icon = t.type === 'transfer' ? 'exchange' : t.type === 'loan_payment' ? 'credit-card' : 'bolt';
              return (
                <ListItem
                  key={t._id}
                  icon={icon}
                  tone={tone}
                  title={t.type.toUpperCase()}
                  subtitle={t.reference}
                  rightTitle={formatMoneyMinor(t.amountMinor, t.currency)}
                  rightSubtitle={t.status}
                  onPress={() => router.push('/(tabs)/transactions')}
                />
              );
            })
          )}
        </View>

        {/* Extra: Spending pattern uses real tx data (kept below) */}
        <View className="mt-lg">
          <SpendingPatternChart
            title="Spending breakdown"
            currency={primaryAccount?.currency ?? 'INR'}
            accounts={data.accounts}
            transactions={data.transactions}
          />
        </View>
        </ScrollView>
      </ScreenTransition>
    </Screen>
  );
}
