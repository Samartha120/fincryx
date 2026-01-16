import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import React, { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, Pressable, ScrollView, Text, View, TextInput } from 'react-native';
import { z } from 'zod';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { getAccounts, transfer, type Account } from '@/src/api/accountsApi';
import { AnimatedIn } from '@/src/components/ui/AnimatedIn';
import { Button } from '@/src/components/ui/Button';
import { CardContainer } from '@/src/components/ui/CardContainer';
import { Input } from '@/src/components/ui/Input';
import { Screen } from '@/src/components/ui/Screen';
import { ScreenTransition } from '@/src/components/ui/ScreenTransition';
import { parseAmountToMinor, formatMoneyMinor } from '@/src/lib/money';

const schema = z.object({
  fromAccountId: z.string().min(1, 'Select a source account'),
  toAccountNumber: z.string().min(6, 'Account number looks too short').max(32, 'Account number looks too long'),
  amount: z.string().min(1, 'Amount is required'),
  note: z.string().max(140, 'Max 140 characters').optional(),
});

type FormValues = z.infer<typeof schema>;

export default function TransferScreen() {
  const { colorScheme } = useColorScheme();
  const spinnerColor = colorScheme === 'dark' ? '#6D8CFF' : '#1E40AF';
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
  const amount = watch('amount');

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
    return () => { mounted = false; };
  }, [setValue]);

  const selectedAccount = useMemo(() => accounts.find(a => a._id === fromAccountId), [accounts, fromAccountId]);

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
      <Screen className="items-center justify-center">
        <ActivityIndicator color={spinnerColor} />
      </Screen>
    );
  }

  // Success State
  if (successRef) {
    return (
      <Screen className="items-center justify-center bg-success/5 px-6">
        <AnimatedIn>
          <View className="items-center gap-6">
            <View className="w-20 h-20 bg-success/20 rounded-full items-center justify-center">
              <FontAwesome name="check" size={40} color="#15803d" />
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-text-primary">Transfer Sent!</Text>
              <Text className="text-body text-text-secondary mt-2 text-center">
                Your money is on its way. Reference: {successRef}
              </Text>
            </View>
            <Button
              title="Done"
              onPress={() => {
                setSuccessRef(null);
                router.replace('/(tabs)/transactions');
              }}
              className="w-full min-w-[200px]"
            />
          </View>
        </AnimatedIn>
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'left', 'right']} className="bg-white dark:bg-neutral-900">
      <ScreenTransition>
        <ScrollView contentContainerClassName="px-md pt-md pb-lg">

          {/* Header */}
          <View className="items-center mb-8">
            <Text className="text-lg font-semibold text-text-secondary">Send Money</Text>
          </View>

          {serverError ? (
            <View className="mb-4 bg-error/10 p-4 rounded-xl">
              <Text className="text-error text-center">{serverError}</Text>
            </View>
          ) : null}

          {/* Huge Amount Input */}
          <View className="items-center mb-8">
            <View className="flex-row items-center justify-center">
              <Text className="text-4xl font-bold text-text-secondary mr-1">{selectedAccount?.currency ?? '$'}</Text>
              <Controller
                control={control}
                name="amount"
                render={({ field: { value, onChange } }) => (
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor="#9CA3AF"
                    style={{ fontSize: 64, fontWeight: 'bold', color: colorScheme === 'dark' ? '#FFF' : '#1F2937' }}
                    autoFocus
                  />
                )}
              />
            </View>
            {errors.amount && <Text className="text-error mt-2">{errors.amount.message}</Text>}
          </View>

          {/* From Account Selector (Simple) */}
          <View className="mb-6">
            <Text className="text-xs text-text-secondary font-medium uppercase tracking-wider mb-2">From</Text>
            <Controller
              control={control}
              name="fromAccountId"
              render={({ field: { value, onChange } }) => (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {accounts.map(a => (
                    <Pressable
                      key={a._id}
                      onPress={() => onChange(a._id)}
                      className={`px-4 py-3 rounded-2xl border ${value === a._id ? 'bg-primary border-primary' : 'bg-neutral-50 border-neutral-200 dark:bg-neutral-800 dark:border-neutral-700'}`}
                    >
                      <Text className={value === a._id ? 'text-white font-semibold' : 'text-text-primary font-medium'}>{a.type.toUpperCase()}</Text>
                      <Text className={`text-xs mt-1 ${value === a._id ? 'text-blue-100' : 'text-text-secondary'}`}>{formatMoneyMinor(a.balanceMinor, a.currency)}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}
            />
          </View>


          {/* To Section */}
          <View className="gap-4">
            <Controller
              control={control}
              name="toAccountNumber"
              render={({ field: { value, onChange } }) => (
                <Input
                  label="To Account"
                  value={value}
                  onChangeText={onChange}
                  placeholder="Account Number"
                  error={errors.toAccountNumber?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="note"
              render={({ field: { value, onChange } }) => (
                <Input
                  label="Note"
                  value={value}
                  onChangeText={onChange}
                  placeholder="What's this for?"
                  error={errors.note?.message}
                />
              )}
            />
          </View>

          <View className="mt-8">
            <Button
              title={isSubmitting ? "Sending..." : "Send Money"}
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
              disabled={!canSubmit}
              variant="primary"
            />
          </View>

        </ScrollView>
      </ScreenTransition>
    </Screen>
  );
}
