import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, Text, View, Pressable, Modal } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useColorScheme } from 'nativewind';

import { getAccounts, type Account } from '@/src/api/accountsApi';
import { getLoanAnalytics, type LoanAnalytics } from '@/src/api/analyticsApi';
import { applyLoan, getLoans, type Loan, type LoanStatus } from '@/src/api/loansApi';
import { AnimatedIn } from '@/src/components/ui/AnimatedIn';
import { Button } from '@/src/components/ui/Button';
import { CardContainer } from '@/src/components/ui/CardContainer'; // Keep for modals/forms
import { Input } from '@/src/components/ui/Input';
import { Screen } from '@/src/components/ui/Screen';
import { ScreenTransition } from '@/src/components/ui/ScreenTransition';
import { SegmentedControl } from '@/src/components/ui/SegmentedControl';
import { formatMoneyMinor, parseAmountToMinor } from '@/src/lib/money';

function LoanCard({ item }: { item: Loan }) {
  const isApproved = item.status === 'approved';
  const isRejected = item.status === 'rejected';

  const bgClass = isApproved
    ? 'bg-neutral-900 dark:bg-neutral-800'
    : isRejected ? 'bg-red-50 dark:bg-red-900/20'
      : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 border';

  const textClass = isApproved ? 'text-white' : 'text-text-primary';
  const subTextClass = isApproved ? 'text-neutral-400' : 'text-text-secondary';

  return (
    <View className={`p-5 rounded-3xl mb-4 ${bgClass} shadow-sm`}>
      <View className="flex-row justify-between items-start mb-4">
        <View>
          <Text className={`text-xs font-bold uppercase tracking-wider mb-1 ${subTextClass}`}>Loan Amount</Text>
          <Text className={`text-2xl font-bold ${textClass}`}>
            {formatMoneyMinor(item.principalMinor, item.currency)}
          </Text>
        </View>
        <View className={`px-3 py-1 rounded-full ${isApproved ? 'bg-white/20' : 'bg-black/5'}`}>
          <Text className={`text-xs font-semibold ${textClass}`}>{item.status.toUpperCase()}</Text>
        </View>
      </View>

      <View className="flex-row gap-6">
        <View>
          <Text className={`text-xs mb-1 ${subTextClass}`}>Term</Text>
          <Text className={`font-medium ${textClass}`}>{item.termMonths} months</Text>
        </View>
        <View>
          <Text className={`text-xs mb-1 ${subTextClass}`}>Interest</Text>
          <Text className={`font-medium ${textClass}`}>{item.annualInterestBps / 100}%</Text>
        </View>
        <View>
          <Text className={`text-xs mb-1 ${subTextClass}`}>Date</Text>
          <Text className={`font-medium ${textClass}`}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>
      </View>
    </View>
  );
}

export default function LoansScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analytics, setAnalytics] = useState<LoanAnalytics | null>(null);

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<LoanStatus | 'all'>('all');
  const [data, setData] = useState<{ items: Loan[]; total: number; limit: number }>({ items: [], total: 0, limit: 20 });
  const [showApplyModal, setShowApplyModal] = useState(false);

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

  const statusOptions = useMemo(() => {
    return (['all', 'pending', 'approved', 'rejected'] as const).map((opt) => ({
      value: opt,
      label: opt.toUpperCase(),
    }));
  }, []);

  const accountOptions = useMemo(() => {
    return accounts.slice(0, 3).map((a) => ({
      value: a._id,
      label: a.type.toUpperCase(),
    }));
  }, [accounts]);


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
    try {
      const res = await getLoanAnalytics();
      setAnalytics(res);
    } catch (e) {
      setAnalytics(null);
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
      } catch { }
    })();
    return () => { mounted = false; };
  }, [accountId]);

  async function onApply() {
    if (submitting) return;
    setApplyError(null);
    setApplySuccess(null);

    const principalMinor = parseAmountToMinor(principal);
    if (!accountId) { setApplyError('Select an account'); return; }
    if (!principalMinor || principalMinor <= 0) { setApplyError('Enter a valid principal amount'); return; }

    setSubmitting(true);
    try {
      const res = await applyLoan({ accountId, principalMinor, annualInterestBps: Number(annualInterestBps), termMonths: Number(termMonths) });
      setApplySuccess(`Applied! Total payable: ${formatMoneyMinor(res.emi.totalPayableMinor)}`);
      // Reset and refresh
      setTimeout(() => {
        setShowApplyModal(false);
        setApplySuccess(null);
        setPrincipal('');
        setPage(1);
        loadPage(1);
      }, 1500);
    } catch (e) {
      setApplyError(e instanceof Error ? e.message : 'Failed to apply');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen edges={['top', 'left', 'right']}>
      <ScreenTransition>
        <View className="flex-1">
          {/* Header */}
          <View className="px-md pt-md pb-4 bg-white dark:bg-neutral-900 z-10">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-3xl font-bold text-text-primary">Loans</Text>
              <Pressable
                onPress={() => setShowApplyModal(true)}
                className="bg-primary w-10 h-10 rounded-full items-center justify-center shadow-lg shadow-primary/30"
              >
                <FontAwesome name="plus" size={16} color="white" />
              </Pressable>
            </View>

            {/* Status Segment */}
            <SegmentedControl
              options={statusOptions}
              value={status}
              onChange={(next) => { setStatus(next); setPage(1); }}
            />
          </View>

          <FlatList
            data={data.items}
            keyExtractor={(l) => l._id}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 100 }} // paddingBottom for FAB if needed
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
            ListEmptyComponent={
              loading ? null : (
                <View className="items-center justify-center py-20 opacity-50">
                  <FontAwesome name="folder-open-o" size={48} color="#9CA3AF" />
                  <Text className="text-body text-text-secondary mt-4">No loans found</Text>
                </View>
              )
            }
            renderItem={({ item }) => (
              <AnimatedIn>
                <LoanCard item={item} />
              </AnimatedIn>
            )}
          />

          {/* Apply Modal */}
          <Modal visible={showApplyModal} animationType="slide" presentationStyle="pageSheet">
            <View className="flex-1 bg-white dark:bg-neutral-900 p-6">
              <View className="flex-row justify-between items-center mb-8">
                <Text className="text-2xl font-bold text-text-primary">New Loan</Text>
                <Pressable onPress={() => setShowApplyModal(false)} className="p-2 bg-neutral-100 rounded-full">
                  <FontAwesome name="close" size={16} color="#000" />
                </Pressable>
              </View>

              <View className="gap-6">
                {applySuccess ? (
                  <View className="bg-success/10 p-4 rounded-xl">
                    <Text className="text-success font-medium text-center">{applySuccess}</Text>
                  </View>
                ) : null}

                {applyError ? (
                  <View className="bg-error/10 p-4 rounded-xl">
                    <Text className="text-error font-medium text-center">{applyError}</Text>
                  </View>
                ) : null}

                <View>
                  <Text className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">Principal Amount</Text>
                  <Input
                    label="Principal"
                    value={principal}
                    onChangeText={setPrincipal}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    className="text-2xl font-bold"
                  />
                </View>

                <View>
                  <Text className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">Account</Text>
                  {accounts.length > 0 && <SegmentedControl options={accountOptions} value={accountId} onChange={setAccountId} />}
                </View>

                <View className="flex-row gap-4">
                  <View className="flex-1">
                    <Text className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">Term (Months)</Text>
                    <Input label="Term" value={termMonths} onChangeText={setTermMonths} keyboardType="number-pad" placeholder="12" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">Interest (bps)</Text>
                    <Input label="Rate" value={annualInterestBps} onChangeText={setAnnualInterestBps} keyboardType="number-pad" placeholder="1200" />
                  </View>
                </View>

                <Button
                  title={submitting ? "Submitting..." : "Submit Application"}
                  onPress={onApply}
                  loading={submitting}
                  disabled={submitting}
                  className="mt-4"
                />
              </View>
            </View>
          </Modal>

        </View>
      </ScreenTransition>
    </Screen>
  );
}
