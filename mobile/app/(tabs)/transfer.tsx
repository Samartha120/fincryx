import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';

import { getAccounts, transfer, type Account } from '@/src/api/accountsApi';
import { parseAmountToMinor } from '@/src/lib/money';

const schema = z.object({
  fromAccountId: z.string().min(1, 'Select a source account'),
  toAccountNumber: z.string().min(6, 'Account number looks too short').max(32, 'Account number looks too long'),
  amount: z.string().min(1, 'Amount is required'),
  note: z.string().max(140, 'Max 140 characters').optional(),
});

type FormValues = z.infer<typeof schema>;

export default function TransferScreen() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successRef, setSuccessRef] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fromAccountId: '',
      toAccountNumber: '',
      amount: '',
      note: '',
    },
    mode: 'onChange',
  });

  const fromAccountId = watch('fromAccountId');

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await getAccounts();
        if (!mounted) return;
        setAccounts(res.items);
        if (res.items[0]?._id) setValue('fromAccountId', res.items[0]._id);
      } catch (e) {
        if (!mounted) return;
        setServerError(e instanceof Error ? e.message : 'Failed to load accounts');
      } finally {
        if (mounted) setLoadingAccounts(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [setValue]);

  const amountMinor = useMemo(() => parseAmountToMinor(watch('amount')), [watch]);

  const canSubmit = Boolean(fromAccountId) && !loadingAccounts && !isSubmitting;

  async function onSubmit(values: FormValues) {
    setServerError(null);
    setSuccessRef(null);

    const minor = parseAmountToMinor(values.amount);
    if (!minor || minor <= 0) {
      setServerError('Amount must be greater than 0');
      return;
    }

    const res = await transfer({
      fromAccountId: values.fromAccountId,
      toAccountNumber: values.toAccountNumber.trim(),
      amountMinor: minor,
      note: values.note?.trim() || undefined,
    });

    setSuccessRef(res.reference);
  }

  if (loadingAccounts) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 20, fontWeight: '700' }}>Transfer</Text>

      {serverError ? <Text style={{ color: '#b00020' }}>{serverError}</Text> : null}
      {successRef ? (
        <View style={{ padding: 12, borderRadius: 12, backgroundColor: '#eef9f0' }}>
          <Text style={{ fontWeight: '700' }}>Transfer completed</Text>
          <Text style={{ color: '#0a7a2e' }}>{successRef}</Text>

          <Pressable
            testID="transfer-view-transactions"
            onPress={() => router.push('/(tabs)/transactions')}
            style={({ pressed }) => ({
              opacity: pressed ? 0.85 : 1,
              marginTop: 10,
              alignSelf: 'flex-start',
              borderWidth: 1,
              borderColor: '#0a7a2e',
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 999,
            })}
          >
            <Text style={{ color: '#0a7a2e', fontWeight: '700' }}>View transactions</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={{ gap: 6 }}>
        <Text style={{ fontWeight: '600' }}>From</Text>
        <Controller
          control={control}
          name="fromAccountId"
          render={({ field: { value, onChange } }) => (
            <View style={{ gap: 8 }}>
              {accounts.map((a) => {
                const selected = a._id === value;
                return (
                  <Pressable
                    key={a._id}
                    testID={`from-${a._id}`}
                    onPress={() => onChange(a._id)}
                    style={({ pressed }) => ({
                      opacity: pressed ? 0.85 : 1,
                      borderWidth: 1,
                      borderColor: selected ? '#111' : '#ddd',
                      borderRadius: 12,
                      padding: 12,
                    })}
                  >
                    <Text style={{ fontWeight: '700' }}>{a.type.toUpperCase()}</Text>
                    <Text style={{ color: '#666' }}>{a.accountNumber}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        />
        {errors.fromAccountId ? <Text style={{ color: '#b00020' }}>{errors.fromAccountId.message}</Text> : null}
      </View>

      <View style={{ gap: 6 }}>
        <Text style={{ fontWeight: '600' }}>To account number</Text>
        <Controller
          control={control}
          name="toAccountNumber"
          render={({ field: { value, onChange } }) => (
            <TextInput
              testID="transfer-toAccountNumber"
              value={value}
              onChangeText={onChange}
              autoCapitalize="none"
              placeholder="1234567890"
              style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 12 }}
            />
          )}
        />
        {errors.toAccountNumber ? <Text style={{ color: '#b00020' }}>{errors.toAccountNumber.message}</Text> : null}
      </View>

      <View style={{ gap: 6 }}>
        <Text style={{ fontWeight: '600' }}>Amount</Text>
        <Controller
          control={control}
          name="amount"
          render={({ field: { value, onChange } }) => (
            <TextInput
              testID="transfer-amount"
              value={value}
              onChangeText={onChange}
              keyboardType="decimal-pad"
              placeholder="0.00"
              style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 12 }}
            />
          )}
        />
        {errors.amount ? <Text style={{ color: '#b00020' }}>{errors.amount.message}</Text> : null}
        {amountMinor !== null ? (
          <Text style={{ color: '#666' }}>Minor units: {amountMinor}</Text>
        ) : null}
      </View>

      <View style={{ gap: 6 }}>
        <Text style={{ fontWeight: '600' }}>Note (optional)</Text>
        <Controller
          control={control}
          name="note"
          render={({ field: { value, onChange } }) => (
            <TextInput
              testID="transfer-note"
              value={value ?? ''}
              onChangeText={onChange}
              placeholder="For rent, groceries, ..."
              style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 12 }}
            />
          )}
        />
        {errors.note ? <Text style={{ color: '#b00020' }}>{errors.note.message}</Text> : null}
      </View>

      <Pressable
        testID="transfer-submit"
        onPress={handleSubmit(onSubmit)}
        disabled={!canSubmit}
        style={({ pressed }) => ({
          opacity: !canSubmit ? 0.5 : pressed ? 0.85 : 1,
          backgroundColor: '#111',
          padding: 14,
          borderRadius: 14,
          alignItems: 'center',
          marginTop: 4,
          flexDirection: 'row',
          justifyContent: 'center',
          gap: 10,
        })}
      >
        {isSubmitting ? <ActivityIndicator color="#fff" /> : null}
        <Text style={{ color: '#fff', fontWeight: '700' }}>Send</Text>
      </Pressable>
    </View>
  );
}
