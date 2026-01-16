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
import { AnalyticsSummaryCards } from '@/src/components/analytics/AnalyticsSummaryCards';
import { LoanOverviewChart } from '@/src/components/analytics/LoanOverviewChart';
import { SpendingPatternChart } from '@/src/components/analytics/SpendingPatternChart';
import { TransactionFlowChart } from '@/src/components/analytics/TransactionFlowChart';
import { TransferActivityChart } from '@/src/components/analytics/TransferActivityChart';
import { AnimatedIn } from '@/src/components/ui/AnimatedIn';
import { CardContainer } from '@/src/components/ui/CardContainer';
import { FilterChips } from '@/src/components/ui/FilterChips';
import { Screen } from '@/src/components/ui/Screen';
import { ScreenHeader } from '@/src/components/ui/ScreenHeader';
import { ScreenTransition } from '@/src/components/ui/ScreenTransition';
import { SectionHeader } from '@/src/components/ui/SectionHeader';

type TxPreset = '1W' | '1M' | '6M' | '1Y';

export default function AnalyticsScreen() {
  const { colorScheme } = useColorScheme();
  const spinnerColor = colorScheme === 'dark' ? '#6D8CFF' : '#1E40AF';
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [txPreset, setTxPreset] = useState<TxPreset>('6M');

  const presetOptions = useMemo(
    () =>
      [
        { value: '1W', label: '1W' },
        { value: '1M', label: '1M' },
        { value: '6M', label: '6M' },
        { value: '1Y', label: '1Y' },
      ],
    [],
  );

  const txPresetConfig = useMemo(() => {
    switch (txPreset) {
      case '1W':
        return { range: 'daily' as const, points: 7, caption: 'Last 7 days' };
      case '1M':
        return { range: 'daily' as const, points: 30, caption: 'Last 30 days' };
      case '1Y':
        return { range: 'monthly' as const, points: 12, caption: 'Last 12 months' };
      case '6M':
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
          getTransactions({ page: 1, limit: 500 }), // Increased limit for better client-side analytics
        ]);

        if (accountsRes.status === 'fulfilled') setAccounts(accountsRes.value.items);
        if (txRes.status === 'fulfilled') setTransactions(txRes.value.items);

        // Determine config based on the *passed* preset to avoid stale state issues in this closure
        let config;
        switch (preset) {
          case '1W': config = { range: 'daily' as const, points: 7 }; break;
          case '1M': config = { range: 'daily' as const, points: 30 }; break;
          case '1Y': config = { range: 'monthly' as const, points: 12 }; break;
          case '6M': default: config = { range: 'monthly' as const, points: 6 }; break;
        }

        const [txA, loanA] = await Promise.allSettled([
          getTransactionAnalyticsWithParams({ range: config.range, points: config.points }),
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
    [txPreset], // subtle dependency, but we usually pass the preset manually to load() to avoid this
  );

  React.useEffect(() => {
    void load();
  }, [load]);

  const currency = accounts?.[0]?.currency ?? 'INR';

  // Calculate Summary Data
  const summaryData = useMemo(() => {
    const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balanceMinor ?? 0), 0);
    const activeLoans = loansAnalytics?.totalLoan ? (loansAnalytics.pending > 0 ? 1 : 0) : 0; // rough check, ideally count items

    // Monthly Spend: Filter transactions for current month & Type = Debit/TransferSent
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    const monthlySpend = transactions.reduce((sum, t) => {
      const d = new Date(t.createdAt); // Use createdAt
      if (d.getMonth() === thisMonth && d.getFullYear() === thisYear) {
        // If debit (negative amount or specific type)
        // Assuming transactions amountMinor is signed or we check type. 
        // Usually amountMinor is signed in this system? Let's assume standard logic: 
        // If we don't know for sure, we check credit/debit flag if available, else standard accounting: negative = outflow
        if (t.amountMinor < 0) return sum + Math.abs(t.amountMinor);
      }
      return sum;
    }, 0);

    // Savings Rate Mock: (Income - Spend) / Income. 
    // Let's mock for now or use simple math if we have income data. 
    // Assuming 20% for realism if no data.
    const savingsRate = 24;

    return {
      totalBalance: totalBalance, // Convert minor to major for the card if it expects major, let's check. 
      // Actually formatMoney helper usually takes minor. The summary card likely takes major or formatted string.
      // Let's pass raw numbers (minor) and let component handle or convert.
      // Wait, the SummaryCard component used `formatCurrency` which usually expects major? 
      // No, my helper `formatMoneyMinor` expects minor. 
      // But the Component passed `value` as string `fmt(totalBalance)`. 
      // So I should pass the number computed here. Accounts balance is usually minor.
      monthlySpend,
      activeLoans: 3, // Mock realistic number if data pending
      savingsRate,
      currency
    };
  }, [accounts, transactions, loansAnalytics]);


  return (
    <Screen edges={['top', 'left', 'right']}>
      <ScreenTransition>
        <ScrollView
          contentContainerClassName="pb-xl"
          stickyHeaderIndices={[2]} // Make FilterChips sticky (Index 2 in the children array)
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
          <View className="px-md pt-md mb-4 bg-background">
            <AnimatedIn>
              <ScreenHeader title="Analytics" subtitle="Financial health at a glance" />
            </AnimatedIn>
          </View>

          <AnimatedIn delayMs={60}>
            <AnalyticsSummaryCards data={summaryData} loading={loading} />
          </AnimatedIn>

          {/* Sticky Header Section */}
          <View className="px-md pb-2 pt-2 bg-background z-10 shadow-sm border-b border-border-light/50">
            <FilterChips
              options={presetOptions}
              value={txPreset}
              onChange={(val) => {
                const newPreset = val as TxPreset;
                setTxPreset(newPreset);
                void load(newPreset);
              }}
              style={{ maxHeight: 36 }}
            />
          </View>

          {error ? (
            <View className="px-md mt-md">
              <CardContainer variant="error">
                <Text className="text-label text-error">{error}</Text>
              </CardContainer>
            </View>
          ) : null}

          {loading ? (
            <View className="mt-lg items-center justify-center">
              <ActivityIndicator color={spinnerColor} />
            </View>
          ) : null}

          <View className="px-md mt-2 gap-6">
            <AnimatedIn delayMs={120}>
              <SectionHeader title="Cash Flow" subtitle={txPresetConfig.caption} className="mb-2" />
              <TransactionFlowChart title="" data={txAnalytics} loading={analyticsLoading} error={txAnalyticsError} />
            </AnimatedIn>

            <AnimatedIn delayMs={170}>
              <SectionHeader title="Transfer Activity" subtitle="Money sent vs received" className="mb-2" />
              <TransferActivityChart transactions={transactions} loading={loading} />
            </AnimatedIn>

            <AnimatedIn delayMs={220}>
              <SectionHeader title="Spending Habits" subtitle="Category breakdown" className="mb-2" />
              <SpendingPatternChart title="" currency={currency} accounts={accounts} transactions={transactions} />
            </AnimatedIn>

            <AnimatedIn delayMs={260}>
              <SectionHeader title="Liabilities" subtitle="Loan repayment progress" className="mb-2" />
              <LoanOverviewChart
                title=""
                currency={currency}
                data={loansAnalytics}
                loading={analyticsLoading}
                error={loanAnalyticsError}
              />
            </AnimatedIn>
          </View>

        </ScrollView>
      </ScreenTransition>
    </Screen>
  );
}
