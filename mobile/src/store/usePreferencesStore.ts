import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

export type ThemePreference = 'system' | 'light' | 'dark';

type PreferencesState = {
  ready: boolean;
  theme: ThemePreference;
  notificationsEnabled: boolean;
  biometricEnabled: boolean;

  initialize: () => Promise<void>;
  setTheme: (theme: ThemePreference) => Promise<void>;
  setNotificationsEnabled: (enabled: boolean) => Promise<void>;
  setBiometricEnabled: (enabled: boolean) => Promise<void>;
};

const STORAGE_KEY = 'finoryx.preferences.v1';

type Persisted = {
  theme: ThemePreference;
  notificationsEnabled: boolean;
  biometricEnabled: boolean;
};

function safeParse(raw: string | null): Persisted | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<Persisted>;
    const theme = parsed.theme;
    return {
      theme: theme === 'dark' || theme === 'light' || theme === 'system' ? theme : 'system',
      notificationsEnabled: typeof parsed.notificationsEnabled === 'boolean' ? parsed.notificationsEnabled : true,
      biometricEnabled: typeof parsed.biometricEnabled === 'boolean' ? parsed.biometricEnabled : false,
    };
  } catch {
    return null;
  }
}

async function persist(next: Persisted): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  ready: false,
  theme: 'system',
  notificationsEnabled: true,
  biometricEnabled: false,

  initialize: async () => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = safeParse(raw);
    if (parsed) {
      set({ ...parsed, ready: true });
    } else {
      set({ ready: true });
    }
  },

  setTheme: async (theme) => {
    set({ theme });
    const { notificationsEnabled, biometricEnabled } = get();
    await persist({ theme, notificationsEnabled, biometricEnabled });
  },

  setNotificationsEnabled: async (enabled) => {
    set({ notificationsEnabled: enabled });
    const { theme, biometricEnabled } = get();
    await persist({ theme, notificationsEnabled: enabled, biometricEnabled });
  },

  setBiometricEnabled: async (enabled) => {
    set({ biometricEnabled: enabled });
    const { theme, notificationsEnabled } = get();
    await persist({ theme, notificationsEnabled, biometricEnabled: enabled });
  },
}));
