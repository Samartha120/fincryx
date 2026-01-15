import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_PREFIX = 'finoryx.';

export const authKeys = {
  accessToken: `${KEY_PREFIX}accessToken`,
  refreshToken: `${KEY_PREFIX}refreshToken`,
  pendingEmail: `${KEY_PREFIX}pendingEmail`,
  lastEmail: `${KEY_PREFIX}lastEmail`,
} as const;

export async function setItem(key: string, value: string | null): Promise<void> {
  if (value === null) {
    await AsyncStorage.removeItem(key);
    return;
  }
  await AsyncStorage.setItem(key, value);
}

export async function getItem(key: string): Promise<string | null> {
  return AsyncStorage.getItem(key);
}

export async function clearAuthStorage(): Promise<void> {
  await AsyncStorage.multiRemove([authKeys.accessToken, authKeys.refreshToken, authKeys.pendingEmail]);
}
