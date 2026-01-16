import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, Text, View, SectionList } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { getTransactionAnalyticsWithParams, type TransactionAnalytics } from '@/src/api/analyticsApi';
import { getTransactions, type Transaction } from '@/src/api/transactionsApi';
import { AnimatedIn } from '@/src/components/ui/AnimatedIn';
import { Button } from '@/src/components/ui/Button';
import { CardContainer } from '@/src/components/ui/CardContainer';
import { Divider } from '@/src/components/ui/Divider';
import { ListItem } from '@/src/components/ui/ListItem';
import { Screen } from '@/src/components/ui/Screen';
import { ScreenTransition } from '@/src/components/ui/ScreenTransition';
import { FilterChips } from '@/src/components/ui/FilterChips';
import { formatMoneyMinor } from '@/src/lib/money';

function formatTxDateHeader(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown date';
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }); // Removed year for cleaner look
}

function formatTxTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function prettyType(value: string): string {
  return value.replace(/_/g, ' ').trim();
}

function pickTxIcon(t: Transaction): React.ComponentProps<typeof FontAwesome>['name'] {
  const type = (t.type ?? '').toLowerCase();
  if (type.includes('transfer')) return 'exchange';
  if (type.includes('loan') && type.includes('payment')) return 'credit-card';
  if (type.includes('loan')) return 'money';
  if (type.includes('deposit')) return 'bank';
  return 'bolt';
}

type FilterType = 'all' | string;

export default function TransactionsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
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

  useEffect(() => {
    void loadPage(page, { showLoader: true });
  }, [loadPage, page]);

  const typeOptions = useMemo(() => {
    const options = new Set<string>();
    for (const item of data.items) options.add(item.type);
    const sorted = Array.from(options).sort();
    return [
      { label: 'All', value: 'all' },
      ...sorted.map(t => ({ label: prettyType(t), value: t }))
    ];
  }, [data.items]);

  const filteredItems = useMemo(() => {
    return data.items.filter((t) => {
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;
      return true;
    });
  }, [data.items, typeFilter]);

  // Group by date for SectionList
  const sections = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    for (const t of filteredItems) {
      const date = new Date(t.createdAt).toDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(t);
    }
    return Object.entries(groups).map(([date, data]) => ({
      title: formatTxDateHeader(date),
      data
    })).sort((a, b) => new Date(b.title).getTime() - new Date(a.title).getTime()); // Sort desc
  }, [filteredItems]);


  return (
    <Screen edges={['top', 'left', 'right']}>
      <ScreenTransition>
        <View className="flex-1 bg-neutral-50 dark:bg-black">

          {/* Header */}
          <View className="pt-md pb-2 bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800 z-10">
            <View className="px-md mb-4">
              <Text className="text-3xl font-bold text-text-primary">History</Text>
              <Text className="text-body text-text-secondary mt-1">
                {data.total} transactions
              </Text>
            </View>
            <FilterChips
              options={typeOptions}
              value={typeFilter}
              onChange={setTypeFilter}
            />
          </View>

          {error ? (
            <View className="px-md pt-md">
              <CardContainer variant="error" className="gap-3">
                <Text className="text-label text-error">{error}</Text>
                <Button title="Retry" variant="secondary" onPress={() => loadPage(page, { showLoader: true })} />
              </CardContainer>
            </View>
          ) : null}

          <SectionList
            sections={sections}
            keyExtractor={(item) => item._id}
            contentContainerStyle={{ paddingBottom: 100 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={async () => {
                  setRefreshing(true);
                  await loadPage(1, { showLoader: false });
                  setRefreshing(false);
                }}
              />
            }
            ListEmptyComponent={
              loading ? null : (
                <View className="items-center justify-center py-20 opacity-50">
                  <FontAwesome name="list-alt" size={48} color="#9CA3AF" />
                  <Text className="text-body text-text-secondary mt-4">No transactions found</Text>
                </View>
              )
            }
            renderSectionHeader={({ section: { title } }) => (
              <View className="px-md py-2 bg-neutral-50 dark:bg-black">
                <Text className="text-xs font-bold uppercase tracking-wider text-text-secondary">{title}</Text>
              </View>
            )}
            renderItem={({ item }) => {
              const isDebit = Boolean(item.fromAccountId);
              const sign = isDebit ? '-' : '+';
              const colorClass = isDebit ? 'text-text-primary' : 'text-green-600 dark:text-green-400';
              const icon = pickTxIcon(item);

              return (
                <View className="px-md py-3 bg-white dark:bg-neutral-900 flex-row items-center justify-between border-b border-neutral-100 dark:border-neutral-800">
                  <View className="flex-row items-center gap-4">
                    <View className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 items-center justify-center">
                      <FontAwesome name={icon} size={16} color="#6B7280" />
                    </View>
                    <View>
                      <Text className="font-semibold text-text-primary text-base transform capitalize">{prettyType(item.type)}</Text>
                      <Text className="text-xs text-text-secondary mt-0.5">{formatTxTime(item.createdAt)}</Text>
                    </View>
                  </View>
                  <View className="items-end">
                    <Text className={`font-bold text-base ${colorClass}`}>
                      {sign}{formatMoneyMinor(item.amountMinor, item.currency)}
                    </Text>
                    <Text className={`text-[10px] uppercase font-bold mt-0.5 ${item.status === 'success' ? 'text-text-secondary' : 'text-orange-500'}`}>
                      {item.status}
                    </Text>
                  </View>
                </View>
              );
            }}
          />

          {/* Simple Pagination */}
          {maxPage > 1 && (
            <View className="absolute bottom-6 left-0 right-0 flex-row justify-center gap-4">
              <Button
                title="Prev"
                variant="secondary"
                disabled={page <= 1}
                onPress={() => setPage(p => Math.max(1, p - 1))}
                className="shadow-lg bg-white dark:bg-neutral-800"
              />
              <View className="bg-neutral-900 dark:bg-white px-4 py-2 rounded-full shadow-lg items-center justify-center">
                <Text className="text-white dark:text-black font-bold text-xs">{page} / {maxPage}</Text>
              </View>
              <Button
                title="Next"
                variant="secondary"
                disabled={page >= maxPage}
                onPress={() => setPage(p => Math.min(maxPage, p + 1))}
                className="shadow-lg bg-white dark:bg-neutral-800"
              />
            </View>
          )}

        </View>
      </ScreenTransition>
    </Screen>
  );
}
