import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Switch, Text, View } from 'react-native';

import { getAccounts, type Account } from '@/src/api/accountsApi';
import { AnimatedIn } from '@/src/components/ui/AnimatedIn';
import { Avatar } from '@/src/components/ui/Avatar';
import { Button } from '@/src/components/ui/Button';
import { CardContainer } from '@/src/components/ui/CardContainer';
import { Screen } from '@/src/components/ui/Screen';
import { ScreenHeader } from '@/src/components/ui/ScreenHeader';
import { ScreenTransition } from '@/src/components/ui/ScreenTransition';
import { SectionHeader } from '@/src/components/ui/SectionHeader';
import { SegmentedControl } from '@/src/components/ui/SegmentedControl';
import { formatMoneyMinor } from '@/src/lib/money';
import { useAuthStore } from '@/src/store/useAuthStore';
import { usePreferencesStore } from '@/src/store/usePreferencesStore';

export default function SettingsScreen() {
  const { colorScheme } = useColorScheme();
  const spinnerColor = colorScheme === 'dark' ? '#6D8CFF' : '#1E40AF';
  const router = useRouter();
  const { user, logoutUser } = useAuthStore();
  const role = user?.role ?? null;
  const userId = user?.id ?? null;
  const lastEmail = user?.email ?? null;
  const fullName = user?.fullName ?? null;

  const theme = usePreferencesStore((s) => s.theme);
  const notificationsEnabled = usePreferencesStore((s) => s.notificationsEnabled);
  const biometricEnabled = usePreferencesStore((s) => s.biometricEnabled);
  const setTheme = usePreferencesStore((s) => s.setTheme);
  const setNotificationsEnabled = usePreferencesStore((s) => s.setNotificationsEnabled);
  const setBiometricEnabled = usePreferencesStore((s) => s.setBiometricEnabled);

  const [accountsLoading, setAccountsLoading] = useState(true);
  const [accountsError, setAccountsError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);

  const [submitting, setSubmitting] = useState(false);

  const themeOptions = useMemo(
    () =>
      [
        { value: 'system', label: 'System' },
        { value: 'light', label: 'Light' },
        { value: 'dark', label: 'Dark' },
      ] as const,
    [],
  );

  const totalBalanceMinor = useMemo(
    () => accounts.reduce((sum, a) => sum + (Number.isFinite(a.balanceMinor) ? a.balanceMinor : 0), 0),
    [accounts],
  );

  const primaryCurrency = useMemo(() => accounts?.[0]?.currency ?? 'INR', [accounts]);

  const loadAccounts = useCallback(async () => {
    setAccountsError(null);
    setAccountsLoading(true);
    try {
      const res = await getAccounts();
      setAccounts(res.items);
    } catch (e) {
      setAccountsError(e instanceof Error ? e.message : 'Failed to load accounts');
    } finally {
      setAccountsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAccounts();
  }, [loadAccounts]);

  async function onLogout() {
    if (submitting) return;
    setSubmitting(true);

    try {
      await logoutUser();
      router.replace('/');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen edges={['top', 'left', 'right']}>
      <ScreenTransition>
        <ScrollView contentContainerClassName="px-md pt-md pb-lg">
          <AnimatedIn>
            <ScreenHeader title="Settings" subtitle="Account, security, and appearance" />
          </AnimatedIn>

        <AnimatedIn delayMs={60}>
          <SectionHeader className="mt-lg" title="Profile" subtitle="Your details at a glance" />
        </AnimatedIn>

        <AnimatedIn delayMs={110}>
          <CardContainer className="mt-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3 flex-1">
                <Avatar name={fullName ?? lastEmail ?? undefined} />
                <View className="flex-1">
                  <Text className="text-label text-text-primary font-semibold" numberOfLines={1}>
                    {fullName ?? 'Account'}
                  </Text>
                  <Text className="text-body text-text-secondary mt-1" numberOfLines={1}>
                    {lastEmail ?? '—'}
                  </Text>
                </View>
              </View>
            </View>

            <View className="mt-4 gap-3">
              <View className="gap-1">
                <Text className="text-body text-text-secondary">Role</Text>
                <Text className="text-label text-text-primary font-semibold">{role ?? '—'}</Text>
              </View>

              <View className="gap-1">
                <Text className="text-body text-text-secondary">User ID</Text>
                <Text className="text-label text-text-primary font-semibold">{userId ?? '—'}</Text>
              </View>
            </View>
          </CardContainer>
        </AnimatedIn>

        <AnimatedIn delayMs={160}>
          <SectionHeader className="mt-lg" title="Appearance" subtitle="Choose how the app looks" />
        </AnimatedIn>

        <AnimatedIn delayMs={210}>
          <CardContainer className="mt-3" variant="subtle">
            <Text className="text-body text-text-secondary">Theme</Text>
            <SegmentedControl
              className="mt-3"
              options={themeOptions}
              value={theme}
              onChange={(v) => void setTheme(v)}
              size="sm"
            />
          </CardContainer>
        </AnimatedIn>

        <AnimatedIn delayMs={260}>
          <SectionHeader className="mt-lg" title="Preferences" subtitle="Control alerts and security" />
        </AnimatedIn>

        <AnimatedIn delayMs={310}>
          <CardContainer className="mt-3" variant="subtle">
            <View className="flex-row items-center justify-between py-1">
              <View className="flex-1 pr-3">
                <Text className="text-label text-text-primary font-semibold">Notifications</Text>
                <Text className="text-caption text-text-secondary mt-1">Transaction and security alerts</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={(v) => void setNotificationsEnabled(v)}
              />
            </View>

            <View className="h-px bg-border/60 my-3" />

            <View className="flex-row items-center justify-between py-1">
              <View className="flex-1 pr-3">
                <Text className="text-label text-text-primary font-semibold">Biometric lock</Text>
                <Text className="text-caption text-text-secondary mt-1">Require Face ID / fingerprint on launch</Text>
              </View>
              <Switch value={biometricEnabled} onValueChange={(v) => void setBiometricEnabled(v)} />
            </View>
          </CardContainer>
        </AnimatedIn>

        <AnimatedIn delayMs={360}>
          <SectionHeader className="mt-lg" title="Accounts" subtitle="Balances across your accounts" />
        </AnimatedIn>

        <AnimatedIn delayMs={410}>
          <CardContainer className="mt-3">
            <View className="flex-row items-center justify-between">
              <View className="gap-1">
                <Text className="text-body text-text-secondary">Total balance</Text>
                <Text className="text-heading text-text-primary">{formatMoneyMinor(totalBalanceMinor, primaryCurrency)}</Text>
              </View>

              {accountsLoading ? <ActivityIndicator color={spinnerColor} /> : null}
            </View>

            {accountsError ? (
              <View className="mt-3">
                <Text className="text-caption text-error">{accountsError}</Text>
                <View className="mt-3">
                  <Button title="Retry" variant="secondary" onPress={loadAccounts} />
                </View>
              </View>
            ) : null}

            {!accountsLoading && !accountsError ? (
              <View className="mt-4 gap-2">
                {accounts.length === 0 ? (
                  <Text className="text-body text-text-secondary">No accounts yet.</Text>
                ) : (
                  accounts.slice(0, 5).map((a) => (
                    <View key={a._id} className="rounded-input border border-border bg-surface px-4 py-3">
                      <Text className="text-label text-text-primary font-semibold" numberOfLines={1}>
                        {a.type.toUpperCase()} • {a.currency}
                      </Text>
                      <Text className="text-caption text-text-secondary mt-1" numberOfLines={1}>
                        Acct: {a.accountNumber}
                      </Text>
                      <Text className="text-body text-text-secondary mt-2">{formatMoneyMinor(a.balanceMinor, a.currency)}</Text>
                    </View>
                  ))
                )}
              </View>
            ) : null}
          </CardContainer>
        </AnimatedIn>

        <AnimatedIn delayMs={460}>
          <View className="mt-lg">
            <Button testID="settings-logout" title="Log out" loading={submitting} variant="danger" onPress={onLogout} />
          </View>
        </AnimatedIn>
        </ScrollView>
      </ScreenTransition>
    </Screen>
  );
}
