import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { decodeJwt } from '@/src/lib/jwt';

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  userId: string | null;
  role: 'admin' | 'customer' | null;
  pendingEmail: string | null;
  lastEmail: string | null;
  hydrated: boolean;
  beginOtp: (input: { email: string }) => void;
  clearPendingOtp: () => void;
  setTokens: (tokens: { accessToken: string; refreshToken: string }) => void;
  setProfile: (profile: { userId: string; role: 'admin' | 'customer' }) => void;
  setLastEmail: (email: string) => void;
  setAccessToken: (accessToken: string) => void;
  setHydrated: () => void;
  clear: () => void;
};

const secureStorage = {
  getItem: async (name: string) => {
    return SecureStore.getItemAsync(name);
  },
  setItem: async (name: string, value: string) => {
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name: string) => {
    await SecureStore.deleteItemAsync(name);
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      userId: null,
      role: null,
      pendingEmail: null,
      lastEmail: null,
      hydrated: false,
      beginOtp: ({ email }) => set({ pendingEmail: email }),
      clearPendingOtp: () => set({ pendingEmail: null }),
      setTokens: ({ accessToken, refreshToken }) => set({ accessToken, refreshToken }),
      setProfile: ({ userId, role }) => set({ userId, role }),
      setLastEmail: (email) => set({ lastEmail: email }),
      setAccessToken: (accessToken) => set({ accessToken }),
      setHydrated: () => set({ hydrated: true }),
      clear: () =>
        set({
          accessToken: null,
          refreshToken: null,
          userId: null,
          role: null,
          pendingEmail: null,
          lastEmail: null,
        }),
    }),
    {
      name: 'finoryx.auth',
      storage: createJSONStorage(() => secureStorage),
      onRehydrateStorage: () => (state, error) => {
        if (error) return;
        const token = state?.accessToken;
        if (token && (!state?.role || !state?.userId)) {
          const payload = decodeJwt(token);
          if (payload.sub && payload.role) {
            state?.setProfile({ userId: payload.sub, role: payload.role });
          }
        }
        state?.setHydrated();
      },
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        userId: state.userId,
        role: state.role,
        lastEmail: state.lastEmail,
      }),
    },
  ),
);

