import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, TextInput, View } from 'react-native';

import { getAccounts, type Account } from '@/src/api/accountsApi';
import { applyLoan, getLoans, type Loan, type LoanStatus } from '@/src/api/loansApi';
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

  useEffect(() => {
    void loadPage(page, { showLoader: true });
  }, [loadPage, page]);

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
        data={data.items}
        keyExtractor={(l) => l._id}
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
          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 16, fontWeight: '700' }}>Loans</Text>
              {loading ? <ActivityIndicator /> : null}
            </View>

            <Text style={{ color: '#666' }}>
              Total: {data.total} • Page {page} / {maxPage}
            </Text>

            <View style={{ padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#eee', gap: 8 }}>
              <Text style={{ fontWeight: '700' }}>Apply for a loan</Text>

              {applyError ? <Text style={{ color: '#b00020' }}>{applyError}</Text> : null}
              {applySuccess ? <Text style={{ color: '#0a7a2e' }}>{applySuccess}</Text> : null}

              <View style={{ gap: 6 }}>
                <Text style={{ color: '#666' }}>Account</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {accounts.length === 0 ? <Text style={{ color: '#666' }}>No accounts available.</Text> : null}
                  {accounts.slice(0, 3).map((a) => {
                    const selected = a._id === accountId;
                    return (
                      <Pressable
                        key={a._id}
                        onPress={() => setAccountId(a._id)}
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
                        <Text style={{ color: selected ? '#fff' : '#444', fontWeight: '700' }}>{a.type.toUpperCase()}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={{ gap: 6 }}>
                <Text style={{ color: '#666' }}>Principal</Text>
                <TextInput
                  value={principal}
                  onChangeText={setPrincipal}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 12 }}
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1, gap: 6 }}>
                  <Text style={{ color: '#666' }}>Annual interest (bps)</Text>
                  <TextInput
                    value={annualInterestBps}
                    onChangeText={setAnnualInterestBps}
                    keyboardType="number-pad"
                    placeholder="1200"
                    style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 12 }}
                  />
                </View>
                <View style={{ flex: 1, gap: 6 }}>
                  <Text style={{ color: '#666' }}>Term (months)</Text>
                  <TextInput
                    value={termMonths}
                    onChangeText={setTermMonths}
                    keyboardType="number-pad"
                    placeholder="12"
                    style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 12 }}
                  />
                </View>
              </View>

              <Pressable
                onPress={onApply}
                disabled={submitting}
                style={({ pressed }) => ({
                  opacity: submitting ? 0.5 : pressed ? 0.85 : 1,
                  backgroundColor: '#111',
                  padding: 12,
                  borderRadius: 12,
                  alignItems: 'center',
                  marginTop: 4,
                })}
              >
                {submitting ? <ActivityIndicator color="#fff" /> : null}
                <Text style={{ color: '#fff', fontWeight: '700' }}>{submitting ? 'Submitting…' : 'Apply'}</Text>
              </Pressable>

              <View style={{ gap: 6 }}>
                <Text style={{ color: '#666' }}>Status filter</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {(['all', 'pending', 'approved', 'rejected'] as const).map((opt) => {
                    const selected = opt === status;
                    return (
                      <Pressable
                        key={opt}
                        onPress={() => {
                          setStatus(opt);
                          setPage(1);
                        }}
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
                        <Text style={{ color: selected ? '#fff' : '#444', fontWeight: '700' }}>{opt}</Text>
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
              <Text style={{ fontWeight: '700' }}>No loans</Text>
              <Text style={{ color: '#666', marginTop: 6 }}>Applied loans will show up here.</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <View style={{ padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#eee', gap: 2 }}>
            <Text style={{ fontWeight: '700' }}>Status: {item.status.toUpperCase()}</Text>
            <Text style={{ color: '#666' }}>Principal: {formatMoneyMinor(item.principalMinor)}</Text>
            <Text style={{ color: '#999' }}>Term: {item.termMonths} months • APR(bps): {item.annualInterestBps}</Text>
            <Text style={{ color: '#999' }}>{formatDate(item.createdAt)}</Text>
            {item.decisionNote ? <Text style={{ color: '#666' }}>{item.decisionNote}</Text> : null}
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
