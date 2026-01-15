import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';

import { getAccounts, type Account } from '@/src/api/accountsApi';
import { getLoanAnalytics, type LoanAnalytics } from '@/src/api/analyticsApi';
import { applyLoan, getLoans, type Loan, type LoanStatus } from '@/src/api/loansApi';
import { LoanOverviewChart } from '@/src/components/analytics/LoanOverviewChart';
import { AnimatedIn } from '@/src/components/ui/AnimatedIn';
import { Button } from '@/src/components/ui/Button';
import { CardContainer } from '@/src/components/ui/CardContainer';
import { Divider } from '@/src/components/ui/Divider';
import { Input } from '@/src/components/ui/Input';
import { ListItem } from '@/src/components/ui/ListItem';
import { Screen } from '@/src/components/ui/Screen';
import { ScreenHeader } from '@/src/components/ui/ScreenHeader';
import { ScreenTransition } from '@/src/components/ui/ScreenTransition';
import { SectionHeader } from '@/src/components/ui/SectionHeader';
import { SegmentedControl } from '@/src/components/ui/SegmentedControl';
import { StatCard } from '@/src/components/ui/StatCard';
import { formatMoneyMinor, parseAmountToMinor } from '@/src/lib/money';

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export default function LoansScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<LoanAnalytics | null>(null);

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<LoanStatus | 'all'>('all');
  const [data, setData] = useState<{ items: Loan[]; total: number; limit: number }>({ items: [], total: 0, limit: 20 });

  // Apply form
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountId, setAccountId] = useState<string>('');
  const [principal, setPrincipal] = useState('');
  const [annualInterestBps, setAnnualInterestBps] = useState('1200');
  const [termMonths, setTermMonths] = useState('12');
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applySuccess, setApplySuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const maxPage = useMemo(() => Math.max(1, Math.ceil(data.total / data.limit)), [data.total, data.limit]);

  const stats = useMemo(() => {
    const total = analytics?.totalLoan ?? 0;
    const paid = analytics?.paid ?? 0;
    const pending = analytics?.pending ?? 0;
    const safeTotal = Math.max(0, total || paid + pending);
    const pctPaid = safeTotal > 0 ? Math.round((Math.max(0, paid) / safeTotal) * 100) : 0;
    return { total: safeTotal, paid: Math.max(0, paid), pending: Math.max(0, pending), pctPaid };
  }, [analytics]);

  const accountOptions = useMemo(() => {
    return accounts.slice(0, 3).map((a) => ({
      value: a._id,
      label: a.type.toUpperCase(),
    }));
  }, [accounts]);

  const statusOptions = useMemo(() => {
    return (['all', 'pending', 'approved', 'rejected'] as const).map((opt) => ({
      value: opt,
      label: opt.toUpperCase(),
    }));
  }, []);

  const loadPage = useCallback(
    async (nextPage: number, opts?: { showLoader?: boolean }) => {
      const showLoader = opts?.showLoader ?? true;
      if (showLoader) setLoading(true);
      setError(null);

      try {
        const res = await getLoans({ page: nextPage, limit: data.limit, status: status === 'all' ? undefined : status });
        setData({ items: res.items, total: res.total, limit: res.limit });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load loans');
      } finally {
        if (showLoader) setLoading(false);
      }
    },
    [data.limit, status],
  );

  const loadAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    setAnalyticsError(null);
    try {
      const res = await getLoanAnalytics();
      setAnalytics(res);
    } catch (e) {
      setAnalytics(null);
      setAnalyticsError(e instanceof Error ? e.message : 'Failed to load analytics');
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPage(page, { showLoader: true });
  }, [loadPage, page]);

  useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await getAccounts();
        if (!mounted) return;
        setAccounts(res.items);
        if (!accountId && res.items[0]?._id) setAccountId(res.items[0]._id);
      } catch {
        // best-effort; apply form will show error if used
      }
    })();

    return () => {
      mounted = false;
    };
  }, [accountId]);

  async function onApply() {
    if (submitting) return;
    setApplyError(null);
    setApplySuccess(null);

    const principalMinor = parseAmountToMinor(principal);
    if (!accountId) {
      setApplyError('Select an account');
      return;
    }
    if (!principalMinor || principalMinor <= 0) {
      setApplyError('Enter a valid principal amount');
      return;
    }

    const bps = Number(annualInterestBps);
    const months = Number(termMonths);
    if (!Number.isFinite(bps) || bps < 0) {
      setApplyError('Enter a valid annual interest (bps)');
      return;
    }
    if (!Number.isFinite(months) || months < 1) {
      setApplyError('Enter a valid term (months)');
      return;
    }

    setSubmitting(true);
    try {
      const res = await applyLoan({
        accountId,
        principalMinor,
        annualInterestBps: bps,
        termMonths: months,
      });

      setApplySuccess(
        `Applied. EMI: ${formatMoneyMinor(res.emi.monthlyEmiMinor)} • Total: ${formatMoneyMinor(res.emi.totalPayableMinor)}`,
      );

      // Refresh list (go back to page 1 on apply)
      setPage(1);
      await loadPage(1, { showLoader: true });
    } catch (e) {
      setApplyError(e instanceof Error ? e.message : 'Failed to apply for loan');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen edges={['top', 'left', 'right']}>
      <ScreenTransition>
        <View className="flex-1">
          {error ? (
            <View className="px-md pt-md">
              <CardContainer variant="error" className="gap-3">
                <Text className="text-label text-error">{error}</Text>
                <Button title="Retry" variant="secondary" onPress={() => loadPage(page, { showLoader: true })} />
              </CardContainer>
            </View>
          ) : null}

          <FlatList
            data={data.items}
            keyExtractor={(l) => l._id}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16, gap: 10 } as any}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={async () => {
                  setRefreshing(true);
                  try {
                    await Promise.allSettled([loadPage(page, { showLoader: false }), loadAnalytics()]);
                  } finally {
                    setRefreshing(false);
                  }
                }}
              />
            }
            ListHeaderComponent={
              <View className="gap-3">
                <AnimatedIn>
                  <ScreenHeader title="Loans" subtitle="Apply and track repayments" loading={loading} />
                </AnimatedIn>

                <AnimatedIn delayMs={60}>
                  <Text className="text-body text-text-secondary">
                    Total: {data.total} • Page {page} / {maxPage}
                  </Text>
                </AnimatedIn>

                <AnimatedIn delayMs={110}>
                  <SectionHeader title="Overview" subtitle="Your loan health at a glance" className="mt-2" />
                </AnimatedIn>

                <AnimatedIn delayMs={160}>
                  <View className="flex-row gap-3">
                    <StatCard
                      className="flex-1"
                      label="Paid"
                      value={`${stats.pctPaid}%`}
                      hint={stats.total > 0 ? `Paid: ${Math.round(stats.paid)}` : 'No data'}
                      icon="check"
                      tone={stats.pctPaid >= 60 ? 'success' : 'default'}
                    />
                    <StatCard
                      className="flex-1"
                      label="Pending"
                      value={stats.total > 0 ? `${Math.round(stats.pending)}` : '—'}
                      hint={stats.total > 0 ? `Total: ${Math.round(stats.total)}` : 'No data'}
                      icon="clock-o"
                      tone={stats.pending > 0 ? 'warning' : 'default'}
                    />
                  </View>
                </AnimatedIn>

                <AnimatedIn delayMs={210}>
                  <CardContainer className="p-md">
                    <LoanOverviewChart
                      title="Loan overview"
                      currency={accounts[0]?.currency ?? 'INR'}
                      data={analytics}
                      loading={analyticsLoading}
                      error={analyticsError}
                    />
                  </CardContainer>
                </AnimatedIn>

                <AnimatedIn delayMs={260}>
                  <SectionHeader title="Apply" subtitle="Pick an account, set terms, and submit" className="mt-2" />
                </AnimatedIn>

                <AnimatedIn delayMs={310}>
                  <CardContainer className="gap-4 p-md" variant="subtle">
                    {applyError ? <Text className="text-caption text-error">{applyError}</Text> : null}
                    {applySuccess ? <Text className="text-caption text-success">{applySuccess}</Text> : null}

                    <View className="gap-2">
                      <Text className="text-body text-text-secondary">Account</Text>
                      {accounts.length === 0 ? (
                        <Text className="text-body text-text-secondary">No accounts available.</Text>
                      ) : (
                        <SegmentedControl options={accountOptions} value={accountId} onChange={setAccountId} />
                      )}
                    </View>

                    <Input
                      label="Principal"
                      value={principal}
                      onChangeText={setPrincipal}
                      keyboardType="decimal-pad"
                      placeholder="0.00"
                    />

                    <View className="flex-row gap-3">
                      <Input
                        className="flex-1"
                        label="Annual interest (bps)"
                        value={annualInterestBps}
                        onChangeText={setAnnualInterestBps}
                        keyboardType="number-pad"
                        placeholder="1200"
                      />
                      <Input
                        className="flex-1"
                        label="Term (months)"
                        value={termMonths}
                        onChangeText={setTermMonths}
                        keyboardType="number-pad"
                        placeholder="12"
                      />
                    </View>

                    <Button
                      title={submitting ? 'Submitting…' : 'Apply'}
                      loading={submitting}
                      disabled={submitting}
                      onPress={onApply}
                    />
                  </CardContainer>
                </AnimatedIn>

                <AnimatedIn delayMs={360}>
                  <SectionHeader title="Your loans" subtitle="Filter by status" className="mt-2" />
                </AnimatedIn>

                <AnimatedIn delayMs={410}>
                  <CardContainer className="gap-2 p-md" variant="subtle">
                    <SegmentedControl
                      options={statusOptions}
                      value={status}
                      onChange={(next) => {
                        setStatus(next);
                        setPage(1);
                      }}
                    />
                  </CardContainer>
                </AnimatedIn>
              </View>
            }
            ListEmptyComponent={
              loading ? null : (
                <CardContainer className="gap-2 p-md" variant="subtle">
                  <Text className="text-label text-text-primary font-semibold">No loans</Text>
                  <Text className="text-body text-text-secondary">Applied loans will show up here.</Text>
                </CardContainer>
              )
            }
            renderItem={({ item }) => {
              const tone = item.status === 'approved' ? 'success' : item.status === 'rejected' ? 'danger' : 'warning';
              const icon = item.status === 'approved' ? 'check' : item.status === 'rejected' ? 'times' : 'clock-o';

              const subtitle = item.decisionNote ? item.decisionNote : `Applied ${formatDate(item.createdAt)}`;
              const rightSubtitle = `Term ${item.termMonths}m • APR ${item.annualInterestBps}bps`;

              return (
                <View className="gap-2">
                  <ListItem
                    title={`Loan • ${item.status.toUpperCase()}`}
                    subtitle={subtitle}
                    rightTitle={formatMoneyMinor(item.principalMinor, item.currency)}
                    rightSubtitle={rightSubtitle}
                    icon={icon}
                    tone={tone}
                  />
                  <Divider className="opacity-40" />
                </View>
              );
            }}
          />

          <View className="bg-background flex-row gap-3 px-md pb-lg">
            <Button
              title="Prev"
              variant="secondary"
              disabled={page <= 1}
              onPress={() => setPage((p) => Math.max(1, p - 1))}
            />
            <Button
              title="Next"
              variant="secondary"
              disabled={page >= maxPage}
              onPress={() => setPage((p) => Math.min(maxPage, p + 1))}
            />
          </View>
        </View>
      </ScreenTransition>
    </Screen>
  );
}
