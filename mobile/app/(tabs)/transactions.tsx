import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';

import { getTransactionAnalyticsWithParams, type TransactionAnalytics } from '@/src/api/analyticsApi';
import { getTransactions, type Transaction } from '@/src/api/transactionsApi';
import { TransactionFlowChart } from '@/src/components/analytics/TransactionFlowChart';
import { AnimatedIn } from '@/src/components/ui/AnimatedIn';
import { Button } from '@/src/components/ui/Button';
import { CardContainer } from '@/src/components/ui/CardContainer';
import { Divider } from '@/src/components/ui/Divider';
import { ListItem } from '@/src/components/ui/ListItem';
import { Screen } from '@/src/components/ui/Screen';
import { ScreenHeader } from '@/src/components/ui/ScreenHeader';
import { ScreenTransition } from '@/src/components/ui/ScreenTransition';
import { SectionHeader } from '@/src/components/ui/SectionHeader';
import { SegmentedControl } from '@/src/components/ui/SegmentedControl';
import { formatMoneyMinor } from '@/src/lib/money';

function formatTxDateHeader(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown date';
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTxTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function prettyType(value: string): string {
  return value
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

function pickTxIcon(t: Transaction): React.ComponentProps<typeof import('@expo/vector-icons/FontAwesome').default>['name'] {
  const type = (t.type ?? '').toLowerCase();
  if (type.includes('transfer')) return 'exchange';
  if (type.includes('loan') && type.includes('payment')) return 'credit-card';
  if (type.includes('loan')) return 'money';
  if (type.includes('deposit')) return 'bank';
  return 'bolt';
}

type FilterType = 'all' | string;
type FilterStatus = 'all' | string;

export default function TransactionsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<TransactionAnalytics | null>(null);

  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [data, setData] = useState<{ items: Transaction[]; total: number; limit: number }>({
    items: [],
    total: 0,
    limit: 50,
  });

  const maxPage = useMemo(() => Math.max(1, Math.ceil(data.total / data.limit)), [data.total, data.limit]);

  const loadPage = useCallback(
    async (nextPage: number, opts?: { showLoader?: boolean }) => {
      const showLoader = opts?.showLoader ?? true;
      if (showLoader) setLoading(true);
      setError(null);

      try {
        const res = await getTransactions({ page: nextPage, limit: data.limit });
        setData({ items: res.items, total: res.total, limit: res.limit });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load transactions');
      } finally {
        if (showLoader) setLoading(false);
      }
    },
    [data.limit],
  );

  const loadAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    setAnalyticsError(null);
    try {
      const res = await getTransactionAnalyticsWithParams({ range: 'monthly', points: 6 });
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

  const typeOptions = useMemo(() => {
    const options = new Set<string>();
    for (const item of data.items) options.add(item.type);
    return ['all', ...Array.from(options).sort()] as const;
  }, [data.items]);

  const typeSegmentOptions = useMemo(() => {
    return typeOptions.map((opt) => ({
      value: opt as FilterType,
      label: opt === 'all' ? 'All' : prettyType(String(opt)),
    }));
  }, [typeOptions]);

  const statusOptions = useMemo(() => {
    const options = new Set<string>();
    for (const item of data.items) options.add(item.status);
    return ['all', ...Array.from(options).sort()] as const;
  }, [data.items]);

  const statusSegmentOptions = useMemo(() => {
    return statusOptions.map((opt) => ({
      value: opt as FilterStatus,
      label: opt === 'all' ? 'All' : String(opt).replace(/_/g, ' ').toUpperCase(),
    }));
  }, [statusOptions]);

  const filteredItems = useMemo(() => {
    return data.items.filter((t) => {
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      return true;
    });
  }, [data.items, statusFilter, typeFilter]);

  type Row =
    | { kind: 'header'; key: string; title: string }
    | { kind: 'tx'; key: string; tx: Transaction };

  const rows = useMemo<Row[]>(() => {
    const sorted = [...filteredItems].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
    const out: Row[] = [];
    let lastHeader = '';

    for (const tx of sorted) {
      const header = formatTxDateHeader(tx.createdAt);
      if (header !== lastHeader) {
        lastHeader = header;
        out.push({ kind: 'header', key: `h:${header}`, title: header });
      }
      out.push({ kind: 'tx', key: `t:${tx._id}`, tx });
    }

    return out;
  }, [filteredItems]);

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
            data={rows}
            keyExtractor={(r) => r.key}
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
                  <ScreenHeader title="History" subtitle="Track credits and debits" loading={loading} />
                </AnimatedIn>

                <AnimatedIn delayMs={60}>
                  <CardContainer className="p-md">
                    <TransactionFlowChart
                      title="Transaction flow"
                      data={analytics}
                      loading={analyticsLoading}
                      error={analyticsError}
                    />
                  </CardContainer>
                </AnimatedIn>

                <AnimatedIn delayMs={110}>
                  <Text className="text-body text-text-secondary">
                    Total: {data.total} • Showing: {filteredItems.length} • Page {page} / {maxPage}
                  </Text>
                </AnimatedIn>

                <AnimatedIn delayMs={160}>
                  <CardContainer className="gap-3 p-md" variant="subtle">
                    <View className="gap-2">
                      <Text className="text-body text-text-secondary">Type</Text>
                      <SegmentedControl options={typeSegmentOptions} value={typeFilter} onChange={setTypeFilter} />
                    </View>

                    <View className="gap-2">
                      <Text className="text-body text-text-secondary">Status</Text>
                      <SegmentedControl options={statusSegmentOptions} value={statusFilter} onChange={setStatusFilter} />
                    </View>
                  </CardContainer>
                </AnimatedIn>

                <AnimatedIn delayMs={210}>
                  <SectionHeader title="All transactions" subtitle="Grouped by date" className="mt-2" />
                </AnimatedIn>
              </View>
            }
            ListEmptyComponent={
              loading ? null : (
                <CardContainer className="gap-2 p-md" variant="subtle">
                  <Text className="text-label text-text-primary font-semibold">No transactions</Text>
                  <Text className="text-body text-text-secondary">Your recent transactions will show up here.</Text>
                </CardContainer>
              )
            }
            renderItem={({ item }) => {
              if (item.kind === 'header') {
                return (
                  <View className="gap-2 pt-2">
                    <Text className="text-caption text-text-muted">{item.title}</Text>
                    <Divider />
                  </View>
                );
              }

              const t = item.tx;
              const status = (t.status ?? '').toLowerCase();
              const isDebit = Boolean(t.fromAccountId);

              const tone = status.includes('pending')
                ? 'warning'
                : status.includes('fail') || status.includes('reject')
                  ? 'danger'
                  : isDebit
                    ? 'danger'
                    : 'success';

              const sign = isDebit ? '-' : '+';
              const title = prettyType(t.type);
              const subtitle = [t.reference, formatTxTime(t.createdAt)].filter(Boolean).join(' • ');

              return (
                <ListItem
                  title={title}
                  subtitle={subtitle}
                  rightTitle={`${sign}${formatMoneyMinor(t.amountMinor, t.currency)}`}
                  rightSubtitle={t.status}
                  icon={pickTxIcon(t)}
                  tone={tone}
                />
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
