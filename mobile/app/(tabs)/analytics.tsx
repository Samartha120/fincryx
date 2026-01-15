import { useColorScheme } from 'nativewind';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';

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
import { AnimatedIn } from '@/src/components/ui/AnimatedIn';
import { CardContainer } from '@/src/components/ui/CardContainer';
import { Screen } from '@/src/components/ui/Screen';
import { ScreenHeader } from '@/src/components/ui/ScreenHeader';
import { ScreenTransition } from '@/src/components/ui/ScreenTransition';
import { SectionHeader } from '@/src/components/ui/SectionHeader';
import { SegmentedControl } from '@/src/components/ui/SegmentedControl';

type TxPreset = 'daily14' | 'monthly6' | 'monthly12';

export default function AnalyticsScreen() {
  const { colorScheme } = useColorScheme();
  const spinnerColor = colorScheme === 'dark' ? '#6D8CFF' : '#1E40AF';
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [txPreset, setTxPreset] = useState<TxPreset>('monthly6');

  const presetOptions = useMemo(
    () =>
      [
        { value: 'monthly6', label: '6M' },
        { value: 'monthly12', label: '12M' },
        { value: 'daily14', label: 'Daily' },
      ] as const,
    [],
  );
  const txPresetConfig = useMemo(() => {
    switch (txPreset) {
      case 'daily14':
        return { range: 'daily' as const, points: 14, caption: 'Last 14 days' };
      case 'monthly12':
        return { range: 'monthly' as const, points: 12, caption: 'Last 12 months' };
      case 'monthly6':
      default:
        return { range: 'monthly' as const, points: 6, caption: 'Last 6 months' };
    }
  }, [txPreset]);

  const [txAnalytics, setTxAnalytics] = useState<TransactionAnalytics | null>(null);
  const [loansAnalytics, setLoansAnalytics] = useState<LoanAnalytics | null>(null);
  const [txAnalyticsError, setTxAnalyticsError] = useState<string | null>(null);
  const [loanAnalyticsError, setLoanAnalyticsError] = useState<string | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const load = useCallback(
    async (preset: TxPreset = txPreset) => {
      setAnalyticsLoading(true);
      setTxAnalyticsError(null);
      setLoanAnalyticsError(null);
      setError(null);

      try {
        const [accountsRes, txRes] = await Promise.allSettled([
          getAccounts(),
          getTransactions({ page: 1, limit: 200 }),
        ]);

        if (accountsRes.status === 'fulfilled') setAccounts(accountsRes.value.items);
        if (txRes.status === 'fulfilled') setTransactions(txRes.value.items);

        const presetConfig =
          preset === 'daily14'
            ? { range: 'daily' as const, points: 14 }
            : preset === 'monthly12'
              ? { range: 'monthly' as const, points: 12 }
              : { range: 'monthly' as const, points: 6 };

        const [txA, loanA] = await Promise.allSettled([
          getTransactionAnalyticsWithParams({ range: presetConfig.range, points: presetConfig.points }),
          getLoanAnalytics(),
        ]);

        if (txA.status === 'fulfilled') setTxAnalytics(txA.value);
        else {
          setTxAnalytics(null);
          setTxAnalyticsError(txA.reason instanceof Error ? txA.reason.message : 'Failed to load transaction analytics');
        }

        if (loanA.status === 'fulfilled') setLoansAnalytics(loanA.value);
        else {
          setLoansAnalytics(null);
          setLoanAnalyticsError(loanA.reason instanceof Error ? loanA.reason.message : 'Failed to load loan analytics');
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load analytics');
      } finally {
        setAnalyticsLoading(false);
        setLoading(false);
      }
    },
    [txPreset],
  );

  React.useEffect(() => {
    void load();
  }, [load]);

  const currency = accounts?.[0]?.currency ?? 'INR';

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
                  await load();
                } finally {
                  setRefreshing(false);
                }
              }}
            />
          }
        >
          <AnimatedIn>
            <ScreenHeader title="Analytics" subtitle="Track trends and understand your money" />
          </AnimatedIn>

        {error ? (
          <AnimatedIn delayMs={60}>
            <CardContainer variant="error" className="mt-md">
              <Text className="text-label text-error">{error}</Text>
            </CardContainer>
          </AnimatedIn>
        ) : null}

        {loading ? (
          <View className="mt-lg items-center justify-center">
            <ActivityIndicator color={spinnerColor} />
          </View>
        ) : null}

        <AnimatedIn delayMs={120}>
          <SectionHeader className="mt-lg" title="Transaction flow" subtitle={txPresetConfig.caption} />
        </AnimatedIn>

        <AnimatedIn delayMs={170}>
          <SegmentedControl
            className="mt-3"
            options={presetOptions}
            value={txPreset}
            onChange={(next) => {
              setTxPreset(next);
              void load(next);
            }}
            size="sm"
          />
        </AnimatedIn>

        <AnimatedIn delayMs={220}>
          <View className="mt-3">
            <TransactionFlowChart title="" data={txAnalytics} loading={analyticsLoading} error={txAnalyticsError} />
          </View>
        </AnimatedIn>

        <AnimatedIn delayMs={260}>
          <SectionHeader className="mt-lg" title="Loan overview" subtitle="Paid vs pending" />
        </AnimatedIn>
        <AnimatedIn delayMs={310}>
          <View className="mt-3">
            <LoanOverviewChart
              title=""
              currency={currency}
              data={loansAnalytics}
              loading={analyticsLoading}
              error={loanAnalyticsError}
            />
          </View>
        </AnimatedIn>

        <AnimatedIn delayMs={350}>
          <SectionHeader className="mt-lg" title="Spending pattern" subtitle="Based on your transactions" />
        </AnimatedIn>
        <AnimatedIn delayMs={400}>
          <View className="mt-3">
            <SpendingPatternChart title="" currency={currency} accounts={accounts} transactions={transactions} />
          </View>
        </AnimatedIn>
        </ScrollView>
      </ScreenTransition>
    </Screen>
  );
}
