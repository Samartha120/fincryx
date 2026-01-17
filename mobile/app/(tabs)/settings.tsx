import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import { useColorScheme } from 'nativewind';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Switch, Text, View } from 'react-native';

import { AnimatedIn } from '@/src/components/ui/AnimatedIn';
import { Avatar } from '@/src/components/ui/Avatar';
import { Screen } from '@/src/components/ui/Screen';
import { ScreenHeader } from '@/src/components/ui/ScreenHeader';
import { ScreenTransition } from '@/src/components/ui/ScreenTransition';
import { useAuthStore } from '@/src/store/useAuthStore';
import { usePreferencesStore } from '@/src/store/usePreferencesStore';

// Dynamic Components
import { ActionSheet } from '@/src/components/ui/ActionSheet';
import { RateAppModal } from '@/src/components/settings/RateAppModal';

// Helper component for Settings Item
function SettingsItem({
  icon,
  iconColor = '#6B7280',
  title,
  subtitle,
  rightElement,
  onPress,
  isDestructive = false,
}: {
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  iconColor?: string;
  title: string;
  subtitle?: string | null;
  rightElement?: React.ReactNode;
  onPress?: () => void;
  isDestructive?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className={`flex-row items-center py-3.5 px-md ${onPress ? 'active:opacity-70' : ''}`}
    >
      <View
        className="w-8 h-8 rounded-full items-center justify-center mr-4"
        style={{ backgroundColor: isDestructive ? '#FEE2E2' : `${iconColor}20` }}
      >
        <FontAwesome name={icon} size={16} color={isDestructive ? '#DC2626' : iconColor} />
      </View>
      <View className="flex-1 mr-3">
        <Text className={`text-body font-medium ${isDestructive ? 'text-error' : 'text-text-primary'}`}>
          {title}
        </Text>
        {subtitle && <Text className="text-caption text-text-secondary mt-0.5">{subtitle}</Text>}
      </View>
      <View>{rightElement || (onPress && <FontAwesome name="angle-right" size={16} color="#9CA3AF" />)}</View>
    </Pressable>
  );
}

// Helper for Section Group
function SettingsGroup({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <View className="mb-6">
      {title && (
        <Text className="text-caption font-semibold text-text-secondary uppercase tracking-wider mb-2 px-md">
          {title}
        </Text>
      )}
      <View className="bg-surface rounded-2xl overflow-hidden border border-border/50 shadow-sm">
        {children}
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const { colorScheme } = useColorScheme();
  const router = useRouter();
  const { user, logoutUser } = useAuthStore();

  const theme = usePreferencesStore((s) => s.theme);
  const notificationsEnabled = usePreferencesStore((s) => s.notificationsEnabled);
  const biometricEnabled = usePreferencesStore((s) => s.biometricEnabled);
  const setTheme = usePreferencesStore((s) => s.setTheme);
  const setNotificationsEnabled = usePreferencesStore((s) => s.setNotificationsEnabled);
  const setBiometricEnabled = usePreferencesStore((s) => s.setBiometricEnabled);

  const [submitting, setSubmitting] = useState(false);
  const [showThemeSheet, setShowThemeSheet] = useState(false);
  const [showLanguageSheet, setShowLanguageSheet] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);

  // Derive display values
  const currentThemeLabel = useMemo(() => {
    if (theme === 'system') return 'System Default';
    return theme.charAt(0).toUpperCase() + theme.slice(1);
  }, [theme]);

  // Handle Logout
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

  // Handle Biometric Toggle
  const toggleBiometric = async (value: boolean) => {
    try {
      if (value) {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();

        if (!hasHardware || !isEnrolled) {
          Alert.alert('Not Available', 'Biometric authentication is not available or not set up on this device.');
          return;
        }

        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Authenticate to enable biometric lock',
        });

        if (result.success) {
          setBiometricEnabled(true);
        }
      } else {
        setBiometricEnabled(false);
      }
    } catch (error) {
      console.error('Biometric error:', error);
      Alert.alert('Error', 'Biometric authentication failed to initialize. Please try restarting the app.');
    }
  };

  return (
    <Screen edges={['top', 'left', 'right']} className="bg-background-subtle">
      <ScreenTransition>
        <ScrollView contentContainerClassName="px-md pt-md pb-xl">
          <AnimatedIn>
            <ScreenHeader title="Settings" subtitle="Manage your preferences" />
          </AnimatedIn>

          <AnimatedIn delayMs={60}>
            {/* User Profile Card - Moved down with mt-4 */}
            <Pressable
              onPress={() => router.push('/(tabs)/profile')}
              className="bg-surface p-4 rounded-2xl flex-row items-center border border-border/50 mb-8 mt-4 shadow-sm active:bg-neutral-50 dark:active:bg-neutral-800"
            >
              <Avatar name={user?.fullName || user?.email} size="lg" />
              <View className="ml-4 flex-1">
                <Text className="text-lg font-bold text-text-primary mb-0.5">
                  {user?.fullName || 'User'}
                </Text>
                <Text className="text-body text-text-secondary">{user?.email || 'email@example.com'}</Text>
                <View className="flex-row mt-2">
                  <View className="bg-primary/10 px-2 py-0.5 rounded-md">
                    <Text className="text-xs font-semibold text-primary uppercase">
                      {user?.role || 'Member'}
                    </Text>
                  </View>
                </View>
              </View>
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  router.push('/settings/qr-scanner');
                }}
                className="p-2 active:opacity-50"
              >
                <FontAwesome name="qrcode" size={24} color={colorScheme === 'dark' ? '#EAF0FF' : '#111827'} />
              </Pressable>
            </Pressable>
          </AnimatedIn>

          <AnimatedIn delayMs={120}>
            <SettingsGroup title="General">
              <SettingsItem
                icon="moon-o"
                iconColor="#8B5CF6"
                title="Appearance"
                subtitle={currentThemeLabel}
                onPress={() => setShowThemeSheet(true)}
              />
              <View className="h-px bg-border/40 ml-14" />
              <SettingsItem
                icon="bell-o"
                iconColor="#F59E0B"
                title="Notifications"
                rightElement={
                  <Switch
                    value={notificationsEnabled}
                    onValueChange={(v) => void setNotificationsEnabled(v)}
                    thumbColor="#FFFFFF"
                    trackColor={{ false: '#374151', true: '#3B82F6' }}
                  />
                }
              />
              <View className="h-px bg-border/40 ml-14" />
              <SettingsItem
                icon="globe"
                iconColor="#10B981"
                title="Language"
                subtitle="English (US)"
                onPress={() => setShowLanguageSheet(true)}
              />
            </SettingsGroup>
          </AnimatedIn>

          <AnimatedIn delayMs={180}>
            <SettingsGroup title="Security">
              <SettingsItem
                icon="lock"
                iconColor="#EF4444"
                title="Biometric Lock"
                subtitle="Face ID / Fingerprint"
                rightElement={
                  <Switch
                    value={biometricEnabled}
                    onValueChange={toggleBiometric}
                    thumbColor="#FFFFFF"
                    trackColor={{ false: '#374151', true: '#3B82F6' }}
                  />
                }
              />
              <View className="h-px bg-border/40 ml-14" />
              <SettingsItem
                icon="key"
                iconColor="#6366F1"
                title="Change Password"
                onPress={() => router.push('/settings/change-password')}
              />
              <View className="h-px bg-border/40 ml-14" />
              <SettingsItem
                icon="shield"
                iconColor="#3B82F6"
                title="Privacy Policy"
                onPress={() => router.push('/settings/privacy-policy')}
              />
            </SettingsGroup>
          </AnimatedIn>

          <AnimatedIn delayMs={240}>
            <SettingsGroup title="Support">
              <SettingsItem
                icon="question-circle-o"
                iconColor="#EC4899"
                title="Help & Support"
                onPress={() => router.push('/settings/help-support')}
              />
              <View className="h-px bg-border/40 ml-14" />
              <SettingsItem
                icon="star-o"
                iconColor="#FBBF24"
                title="Rate App"
                onPress={() => setShowRateModal(true)}
              />
            </SettingsGroup>
          </AnimatedIn>

          <AnimatedIn delayMs={300}>
            <View className="mt-2 mb-8">
              <Pressable
                onPress={onLogout}
                disabled={submitting}
                className={`flex-row items-center justify-center py-4 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-900/30 ${submitting ? 'opacity-50' : 'active:bg-red-100 dark:active:bg-red-900/20'}`}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#DC2626" />
                ) : (
                  <>
                    <FontAwesome name="sign-out" size={18} color="#DC2626" />
                    <Text className="text-red-600 font-bold ml-2 text-base">Log Out</Text>
                  </>
                )}
              </Pressable>

              <Text className="text-caption text-text-secondary/60 mt-6 text-center">
                Version 1.2.0 • Build 245
              </Text>
            </View>
          </AnimatedIn>

        </ScrollView>
      </ScreenTransition>

      {/* Dynamic Sheets & Modals */}
      <ActionSheet
        visible={showThemeSheet}
        onClose={() => setShowThemeSheet(false)}
        title="Select Appearance"
        onSelect={(val) => setTheme(val as any)}
        selectedValue={theme}
        options={[
          { label: 'System Default', value: 'system', icon: 'desktop' },
          { label: 'Light Mode', value: 'light', icon: 'sun-o', color: '#F59E0B' },
          { label: 'Dark Mode', value: 'dark', icon: 'moon-o', color: '#8B5CF6' },
        ]}
      />

      <ActionSheet
        visible={showLanguageSheet}
        onClose={() => setShowLanguageSheet(false)}
        title="Select Language"
        onSelect={() => { }}
        selectedValue="en"
        options={[
          { label: 'English (US)', value: 'en', icon: 'flag' },
          { label: 'More coming soon...', value: 'disabled', icon: 'clock-o', color: '#9CA3AF' },
        ]}
      />

      <RateAppModal
        visible={showRateModal}
        onClose={() => setShowRateModal(false)}
        onSubmit={(rating) => {
          Alert.alert('Thank You!', `You rated us ${rating} stars.`);
        }}
      />
    </Screen>
  );
}
