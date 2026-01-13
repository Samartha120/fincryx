import axios from 'axios';

import { getApiBaseUrl } from '@/src/lib/env';
import { useAuthStore } from '@/src/store/authStore';
import { refresh } from '@/src/api/authApi';

export const http = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 20_000,
});

http.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshInFlight: Promise<string> | null = null;

function normalizeAxiosError(error: unknown): Error {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error : new Error('Something went wrong');
  }

  const status = error.response?.status;
  const messageFromApi = (error.response?.data as any)?.message as string | undefined;

  if (status === 0 || !status) {
    return new Error('Network error. Check your connection and try again.');
  }

  return new Error(messageFromApi || error.message || 'Request failed');
}

http.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config as (typeof error.config & { _finoryxRetried?: boolean }) | undefined;
    const status = error.response?.status as number | undefined;

    if (!originalRequest || status !== 401) {
      throw normalizeAxiosError(error);
    }

    if (originalRequest._finoryxRetried) {
      useAuthStore.getState().clear();
      throw normalizeAxiosError(error);
    }

    const url = String(originalRequest.url || '');
    if (url.includes('/auth/refresh') || url.includes('/auth/login') || url.includes('/auth/otp/verify')) {
      useAuthStore.getState().clear();
      throw normalizeAxiosError(error);
    }

    const { refreshToken } = useAuthStore.getState();
    if (!refreshToken) {
      useAuthStore.getState().clear();
      throw normalizeAxiosError(error);
    }

    if (!refreshInFlight) {
      refreshInFlight = refresh({ refreshToken })
        .then((r) => {
          useAuthStore.getState().setAccessToken(r.accessToken);
          return r.accessToken;
        })
        .catch((refreshError) => {
          useAuthStore.getState().clear();
          throw refreshError;
        })
        .finally(() => {
          refreshInFlight = null;
        });
    }

    const newAccessToken = await refreshInFlight;
    originalRequest._finoryxRetried = true;
    originalRequest.headers = originalRequest.headers ?? {};
    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
    return http(originalRequest);
  },
);
