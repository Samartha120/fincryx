import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import React, { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { z } from 'zod';

import { getAccounts, transfer, type Account } from '@/src/api/accountsApi';
import { AnimatedIn } from '@/src/components/ui/AnimatedIn';
import { Button } from '@/src/components/ui/Button';
import { CardContainer } from '@/src/components/ui/CardContainer';
import { Input } from '@/src/components/ui/Input';
import { Screen } from '@/src/components/ui/Screen';
import { ScreenHeader } from '@/src/components/ui/ScreenHeader';
import { ScreenTransition } from '@/src/components/ui/ScreenTransition';
import { SectionHeader } from '@/src/components/ui/SectionHeader';
import { parseAmountToMinor } from '@/src/lib/money';

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
      <Screen className="items-center justify-center">
        <ActivityIndicator color={spinnerColor} />
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'left', 'right']}>
      <ScreenTransition>
        <ScrollView contentContainerClassName="px-md pt-md pb-lg">
          <AnimatedIn>
            <ScreenHeader title="Transfer" subtitle="Move money instantly and securely" />
          </AnimatedIn>

        <View className="mt-4 gap-3">
          {serverError ? (
            <AnimatedIn delayMs={60}>
              <CardContainer variant="error" className="gap-2">
                <Text className="text-label text-error">{serverError}</Text>
              </CardContainer>
            </AnimatedIn>
          ) : null}

          {successRef ? (
            <AnimatedIn delayMs={100}>
              <CardContainer className="gap-2">
                <Text className="text-label text-text-primary font-semibold">Transfer completed</Text>
                <Text className="text-success mt-1">{successRef}</Text>

                <View className="mt-3">
                  <Button
                    testID="transfer-view-transactions"
                    title="View history"
                    variant="secondary"
                    onPress={() => router.push('/(tabs)/transactions')}
                  />
                </View>
              </CardContainer>
            </AnimatedIn>
          ) : null}

          <AnimatedIn delayMs={140}>
            <SectionHeader title="Transfer details" subtitle="Choose accounts and enter amount" className="mt-2" />
          </AnimatedIn>

          <AnimatedIn delayMs={180}>
            <CardContainer className="gap-4" variant="subtle">
              <View className="gap-2">
                <Text className="text-body text-text-secondary">From account</Text>
                <Controller
                  control={control}
                  name="fromAccountId"
                  render={({ field: { value, onChange } }) => (
                    <View className="gap-2">
                      {accounts.map((a) => {
                        const selected = a._id === value;
                        return (
                          <Pressable
                            key={a._id}
                            testID={`from-${a._id}`}
                            onPress={() => onChange(a._id)}
                            className={
                              selected
                                ? 'rounded-input border border-primary bg-primary/10 px-4 py-3'
                                : 'rounded-input border border-border bg-surface px-4 py-3'
                            }
                          >
                            <Text className="text-label text-text-primary font-semibold">{a.type.toUpperCase()}</Text>
                            <Text className="text-caption text-text-secondary mt-1">{a.accountNumber}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  )}
                />
                {errors.fromAccountId ? (
                  <Text className="text-caption text-error">{errors.fromAccountId.message}</Text>
                ) : null}
              </View>

              <Controller
                control={control}
                name="toAccountNumber"
                render={({ field: { value, onChange } }) => (
                  <Input
                    label="To account number"
                    testID="transfer-toAccountNumber"
                    value={value}
                    onChangeText={onChange}
                    autoCapitalize="none"
                    placeholder="1234567890"
                    error={errors.toAccountNumber?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="amount"
                render={({ field: { value, onChange } }) => (
                  <Input
                    label="Amount"
                    testID="transfer-amount"
                    value={value}
                    onChangeText={onChange}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    error={errors.amount?.message}
                  />
                )}
              />

              {amountMinor !== null ? (
                <Text className="text-caption text-text-secondary">Minor units: {amountMinor}</Text>
              ) : null}

              <Controller
                control={control}
                name="note"
                render={({ field: { value, onChange } }) => (
                  <Input
                    label="Note (optional)"
                    testID="transfer-note"
                    value={value ?? ''}
                    onChangeText={onChange}
                    placeholder="For rent, groceries, ..."
                    error={errors.note?.message}
                  />
                )}
              />

              <Button
                testID="transfer-submit"
                title="Send"
                loading={isSubmitting}
                disabled={!canSubmit}
                onPress={handleSubmit(onSubmit)}
              />
            </CardContainer>
          </AnimatedIn>
        </View>
        </ScrollView>
      </ScreenTransition>
    </Screen>
  );
}
