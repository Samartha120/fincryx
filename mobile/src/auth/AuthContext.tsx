import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { decodeJwt } from '@/src/lib/jwt';
import { clearAuthStorage, authKeys, getItem, setItem } from '@/src/auth/storage';
import { setHttpAccessToken, setHttpRefreshHooks } from '@/src/lib/http';

export type AuthProfile = {
  userId: string;
  role: 'admin' | 'customer';
};

type AuthState = {
  status: 'loading' | 'signedOut' | 'signedIn';
  accessToken: string | null;
  refreshToken: string | null;
  profile: AuthProfile | null;
  pendingEmail: string | null;
  lastEmail: string | null;
};

type AuthActions = {
  hydrate: () => Promise<void>;
  setLastEmail: (email: string) => Promise<void>;
  beginOtp: (email: string) => Promise<void>;
  clearPendingOtp: () => Promise<void>;
  completeAuth: (tokens: { accessToken: string; refreshToken: string }) => Promise<void>;
  updateAccessTokenFromRefresh: (accessToken: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<(AuthState & AuthActions) | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthState['status']>('loading');
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [lastEmail, setLastEmailState] = useState<string | null>(null);

  const hydrate = useCallback(async () => {
    setStatus('loading');

    const [storedAccess, storedRefresh, storedPending, storedLast] = await Promise.all([
      getItem(authKeys.accessToken),
      getItem(authKeys.refreshToken),
      getItem(authKeys.pendingEmail),
      getItem(authKeys.lastEmail),
    ]);

    setPendingEmail(storedPending);
    setLastEmailState(storedLast);

    if (storedAccess) {
      setAccessToken(storedAccess);
      setHttpAccessToken(storedAccess);

      const payload = decodeJwt(storedAccess);
      if (payload.sub && payload.role) {
        setProfile({ userId: payload.sub, role: payload.role });
      }

      setRefreshToken(storedRefresh);
      setStatus('signedIn');
      return;
    }

    setAccessToken(null);
    setRefreshToken(null);
    setProfile(null);
    setHttpAccessToken(null);
    setStatus('signedOut');
  }, []);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const setLastEmail = useCallback(async (email: string) => {
    const normalized = email.trim().toLowerCase();
    setLastEmailState(normalized);
    await setItem(authKeys.lastEmail, normalized);
  }, []);

  const beginOtp = useCallback(async (email: string) => {
    const normalized = email.trim().toLowerCase();
    setPendingEmail(normalized);
    await setItem(authKeys.pendingEmail, normalized);
  }, []);

  const clearPendingOtp = useCallback(async () => {
    setPendingEmail(null);
    await setItem(authKeys.pendingEmail, null);
  }, []);

  const updateAccessTokenFromRefresh = useCallback(async (nextAccessToken: string) => {
    setAccessToken(nextAccessToken);
    setHttpAccessToken(nextAccessToken);
    await setItem(authKeys.accessToken, nextAccessToken);

    const payload = decodeJwt(nextAccessToken);
    if (payload.sub && payload.role) {
      setProfile({ userId: payload.sub, role: payload.role });
    }
  }, []);

  const completeAuth = useCallback(async (tokens: { accessToken: string; refreshToken: string }) => {
    setAccessToken(tokens.accessToken);
    setRefreshToken(tokens.refreshToken);
    setHttpAccessToken(tokens.accessToken);

    await Promise.all([
      setItem(authKeys.accessToken, tokens.accessToken),
      setItem(authKeys.refreshToken, tokens.refreshToken),
      setItem(authKeys.pendingEmail, null),
    ]);

    const payload = decodeJwt(tokens.accessToken);
    if (payload.sub && payload.role) {
      setProfile({ userId: payload.sub, role: payload.role });
    } else {
      setProfile(null);
    }

    setPendingEmail(null);
    setStatus('signedIn');
  }, []);

  const signOut = useCallback(async () => {
    await clearAuthStorage();
    setAccessToken(null);
    setRefreshToken(null);
    setProfile(null);
    setPendingEmail(null);
    setHttpAccessToken(null);
    setStatus('signedOut');
  }, []);

  useEffect(() => {
    setHttpRefreshHooks({
      getRefreshToken: () => refreshToken,
      onNewAccessToken: (t) => updateAccessTokenFromRefresh(t),
      onAuthFailure: () => signOut(),
    });

    return () => {
      setHttpRefreshHooks(null);
    };
  }, [refreshToken, signOut, updateAccessTokenFromRefresh]);

  const value = useMemo(
    () => ({
      status,
      accessToken,
      refreshToken,
      profile,
      pendingEmail,
      lastEmail,
      hydrate,
      setLastEmail,
      beginOtp,
      clearPendingOtp,
      completeAuth,
      updateAccessTokenFromRefresh,
      signOut,
    }),
    [
      accessToken,
      beginOtp,
      clearPendingOtp,
      completeAuth,
      hydrate,
      lastEmail,
      pendingEmail,
      profile,
      refreshToken,
      setLastEmail,
      signOut,
      status,
      updateAccessTokenFromRefresh,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
