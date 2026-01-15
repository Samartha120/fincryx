import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { PrimaryButton } from '@/src/components/ui/PrimaryButton';
import { Screen } from '@/src/components/ui/Screen';
import { getApiBaseUrl } from '@/src/lib/env';

export default function OfflineScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ returnTo?: string }>();
  const returnTo = typeof params.returnTo === 'string' ? params.returnTo : undefined;

  const apiBaseUrl = useMemo(() => getApiBaseUrl(), []);
  const [isChecking, setIsChecking] = useState(true);
  const [attempts, setAttempts] = useState(0);
  const [hint, setHint] = useState<string | null>(null);

  const didNavigateRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const goBackOrReturn = useCallback(() => {
    if (didNavigateRef.current) return;
    didNavigateRef.current = true;

    if (returnTo) {
      router.replace(returnTo as any);
    } else {
      router.back();
    }
  }, [returnTo, router]);

  const pingServer = useCallback(async (): Promise<boolean> => {
    if (typeof fetch !== 'function') {
      return false;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const timeout = setTimeout(() => controller.abort(), 6_000);
    try {
      const base = apiBaseUrl.replace(/\/+$/g, '');
      const healthUrl = `${base}/health`;
      const res = await fetch(healthUrl, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });

      // Any HTTP response means the server is reachable (even if endpoint returns 404).
      return typeof res.status === 'number' && res.status > 0;
    } catch {
      return false;
    } finally {
      clearTimeout(timeout);
    }
  }, [apiBaseUrl]);

  const runCheckOnce = useCallback(async () => {
    setIsChecking(true);
    setHint(null);
    setAttempts((a) => a + 1);

    const ok = await pingServer();
    if (ok) {
      goBackOrReturn();
      return;
    }

    setHint('Still unable to reach the server.');
    setIsChecking(false);
  }, [goBackOrReturn, pingServer]);

  useEffect(() => {
    let cancelled = false;

    const schedule = async (attempt: number) => {
      if (cancelled) return;
      setIsChecking(true);
      setAttempts(attempt);

      const ok = await pingServer();
      if (cancelled) return;

      if (ok) {
        goBackOrReturn();
        return;
      }

      setIsChecking(false);

      // Simple backoff: 1s, 2s, 3s, 5s, 8s, 13s, then cap at 15s
      const delays = [1000, 2000, 3000, 5000, 8000, 13000];
      const delay = delays[Math.min(attempt - 1, delays.length - 1)] ?? 15000;
      const cappedDelay = Math.min(delay, 15000);

      timeoutRef.current = setTimeout(() => {
        void schedule(attempt + 1);
      }, cappedDelay);
    };

    void schedule(1);

    return () => {
      cancelled = true;
      timeoutRef.current && clearTimeout(timeoutRef.current);
      abortRef.current?.abort();
    };
  }, [goBackOrReturn, pingServer]);

  return (
    <Screen edges={['top', 'left', 'right']} className="px-md pt-xl">
      <View className="flex-1 justify-center">
        <Text className="text-title text-text-primary">You’re offline</Text>
        <Text className="text-body text-text-secondary mt-2">
          We can’t reach the server right now. Please check your internet connection and try again.
        </Text>

        <View className="mt-md flex-row items-center gap-3">
          {isChecking ? <ActivityIndicator /> : null}
          <Text className="text-body text-text-secondary">
            {isChecking ? 'Reconnecting…' : 'Waiting for connection…'}
            {attempts > 0 ? ` (attempt ${attempts})` : ''}
          </Text>
        </View>

        {hint ? (
          <Text className="text-body text-text-secondary mt-2">{hint}</Text>
        ) : null}

        <View className="mt-lg gap-3">
          <PrimaryButton
            title="Try again"
            onPress={runCheckOnce}
            disabled={isChecking}
          />

          <Pressable
            onPress={() => router.back()}
            className="items-center py-3"
            accessibilityRole="button"
          >
            <Text className="text-body text-text-secondary">Back</Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}
