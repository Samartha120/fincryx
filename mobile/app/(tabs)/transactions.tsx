import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';

import { getTransactions, type Transaction } from '@/src/api/transactionsApi';
import { formatMoneyMinor } from '@/src/lib/money';

function formatTxDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

type FilterType = 'all' | string;
type FilterStatus = 'all' | string;

export default function TransactionsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [data, setData] = useState<{ items: Transaction[]; total: number; limit: number }>({
    items: [],
    total: 0,
    limit: 20,
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
    return ['all', ...Array.from(options).sort()] as const;
  }, [data.items]);

  const statusOptions = useMemo(() => {
    const options = new Set<string>();
    for (const item of data.items) options.add(item.status);
    return ['all', ...Array.from(options).sort()] as const;
  }, [data.items]);

  const filteredItems = useMemo(() => {
    return data.items.filter((t) => {
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      return true;
    });
  }, [data.items, statusFilter, typeFilter]);

  return (
    <View style={{ flex: 1 }}>
      {error ? (
        <View style={{ padding: 16, gap: 10 }}>
          <Text style={{ color: '#b00020' }}>{error}</Text>
          <Pressable
            onPress={() => loadPage(page, { showLoader: true })}
            style={({ pressed }) => ({
              opacity: pressed ? 0.85 : 1,
              borderWidth: 1,
              borderColor: '#ddd',
              padding: 12,
              borderRadius: 12,
              alignItems: 'center',
              alignSelf: 'flex-start',
            })}
          >
            <Text style={{ fontWeight: '700' }}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      <FlatList
        data={filteredItems}
        keyExtractor={(t) => t._id}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              try {
                await loadPage(page, { showLoader: false });
              } finally {
                setRefreshing(false);
              }
            }}
          />
        }
        ListHeaderComponent={
          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 16, fontWeight: '700' }}>Transactions</Text>
              {loading ? <ActivityIndicator /> : null}
            </View>
            <Text style={{ color: '#666' }}>
              Total: {data.total} • Showing: {filteredItems.length} • Page {page} / {maxPage}
            </Text>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={{ color: '#666' }}>Type</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {typeOptions.map((opt) => {
                    const selected = opt === typeFilter;
                    return (
                      <Pressable
                        key={opt}
                        onPress={() => setTypeFilter(opt)}
                        style={({ pressed }) => ({
                          opacity: pressed ? 0.85 : 1,
                          paddingVertical: 6,
                          paddingHorizontal: 10,
                          borderRadius: 999,
                          borderWidth: 1,
                          borderColor: selected ? '#111' : '#ddd',
                          backgroundColor: selected ? '#111' : '#fff',
                        })}
                      >
                        <Text style={{ color: selected ? '#fff' : '#444', fontWeight: '700' }}>{String(opt)}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={{ color: '#666' }}>Status</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {statusOptions.map((opt) => {
                    const selected = opt === statusFilter;
                    return (
                      <Pressable
                        key={opt}
                        onPress={() => setStatusFilter(opt)}
                        style={({ pressed }) => ({
                          opacity: pressed ? 0.85 : 1,
                          paddingVertical: 6,
                          paddingHorizontal: 10,
                          borderRadius: 999,
                          borderWidth: 1,
                          borderColor: selected ? '#111' : '#ddd',
                          backgroundColor: selected ? '#111' : '#fff',
                        })}
                      >
                        <Text style={{ color: selected ? '#fff' : '#444', fontWeight: '700' }}>{String(opt)}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? null : (
            <View style={{ padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#eee' }}>
              <Text style={{ fontWeight: '700' }}>No transactions</Text>
              <Text style={{ color: '#666', marginTop: 6 }}>Your recent transactions will show up here.</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <View style={{ padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#eee', gap: 2 }}>
            <Text style={{ fontWeight: '700' }}>{item.type.toUpperCase()} • {item.status}</Text>
            <Text style={{ color: '#666' }}>{formatMoneyMinor(item.amountMinor, item.currency)}</Text>
            <Text style={{ color: '#999' }}>{item.reference}</Text>
            <Text style={{ color: '#999' }}>{formatTxDate(item.createdAt)}</Text>
          </View>
        )}
      />

      <View style={{ padding: 16, flexDirection: 'row', gap: 10 }}>
        <Pressable
          disabled={page <= 1}
          onPress={() => setPage((p) => Math.max(1, p - 1))}
          style={({ pressed }) => ({
            opacity: page <= 1 ? 0.5 : pressed ? 0.85 : 1,
            flex: 1,
            borderWidth: 1,
            borderColor: '#ddd',
            padding: 12,
            borderRadius: 12,
            alignItems: 'center',
          })}
        >
          <Text style={{ fontWeight: '700' }}>Prev</Text>
        </Pressable>

        <Pressable
          disabled={page >= maxPage}
          onPress={() => setPage((p) => Math.min(maxPage, p + 1))}
          style={({ pressed }) => ({
            opacity: page >= maxPage ? 0.5 : pressed ? 0.85 : 1,
            flex: 1,
            borderWidth: 1,
            borderColor: '#ddd',
            padding: 12,
            borderRadius: 12,
            alignItems: 'center',
          })}
        >
          <Text style={{ fontWeight: '700' }}>Next</Text>
        </Pressable>
      </View>
    </View>
  );
}
