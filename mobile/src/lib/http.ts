import axios from 'axios';

import { getApiBaseUrl } from '@/src/lib/env';

let currentAccessToken: string | null = null;

type RefreshHooks = {
  getRefreshToken: () => string | null;
  onNewAccessToken: (accessToken: string) => void | Promise<void>;
  onAuthFailure?: () => void | Promise<void>;
};

let refreshHooks: RefreshHooks | null = null;
let refreshPromise: Promise<string> | null = null;

export function setHttpAccessToken(token: string | null) {
  currentAccessToken = token;
}

export function setHttpRefreshHooks(hooks: RefreshHooks | null) {
  refreshHooks = hooks;
}

export const http = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 20_000,
});

const authHttp = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 20_000,
});

type NetworkError = Error & {
  kind: 'network';
  target: string;
  code?: string;
  isTimeout?: boolean;
};

function makeNetworkError(message: string, target: string, code?: string, isTimeout?: boolean): NetworkError {
  const err = new Error(message) as NetworkError;
  err.kind = 'network';
  err.target = target;
  if (code) err.code = code;
  if (isTimeout) err.isTimeout = true;
  return err;
}

async function warmUpServer(baseUrl: string): Promise<void> {
  // Best-effort ping to wake Render / cold instances.
  // Never throw; this is only a preflight.
  const url = baseUrl.replace(/\/+$/g, '');
  const healthUrl = `${url}/health`;
  const startedAt = Date.now();
  const maxWaitMs = 18_000;
  const intervalMs = 1_500;

  while (Date.now() - startedAt < maxWaitMs) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6_000);

    try {
      const res = await fetch(healthUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });

      if (typeof res.status === 'number' && res.status > 0) {
        return;
      }
    } catch {
      // ignore
    } finally {
      clearTimeout(timeout);
    }

    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

http.interceptors.request.use((config) => {
  if (currentAccessToken) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${currentAccessToken}`;
  }
  return config;
});

function normalizeAxiosError(error: unknown): Error {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error : new Error('Something went wrong');
  }

  const status = error.response?.status;
  const messageFromApi = (error.response?.data as any)?.message as string | undefined;
  const baseUrl = (error.config?.baseURL as string | undefined) ?? getApiBaseUrl();
  const path = (error.config?.url as string | undefined) ?? '';
  const target = path.startsWith('http') ? path : `${baseUrl}${path}`;

  const apiError = new Error(messageFromApi || error.message || 'Request failed') as Error & {
    status?: number;
    data?: unknown;
  };
  apiError.status = status;
  apiError.data = error.response?.data;

  console.log('API Error:', {
    status,
    message: messageFromApi,
    url: error.config?.url,
    method: error.config?.method,
    data: error.response?.data,
  });

  if (status === 0 || !status) {
    const code = (error as any).code as string | undefined;

    if (code === 'ECONNABORTED') {
      return makeNetworkError('Request timed out. Please try again.', target, code, true);
    }

    // Axios often reports DNS/SSL/connectivity issues as "Network Error" with no status.
    return makeNetworkError('Can’t reach the server. Check your connection and try again.', target, code);
  }

  if (status === 404) {
    const notFound = new Error(
      `Endpoint not found (404). Check your API base URL.\nRequest: ${target}`,
    ) as Error & { status?: number; data?: unknown };
    notFound.status = status;
    notFound.data = error.response?.data;
    return notFound;
  }

  return apiError;
}

http.interceptors.response.use(
  (res) => res,
  async (error) => {
    const isAxios = axios.isAxiosError(error);
    const status = isAxios ? error.response?.status : undefined;

    if (isAxios && status === 404) {
      const originalRequest = (error.config as any) as (Record<string, any> & { _apiRetry?: boolean }) | undefined;
      const path = (originalRequest?.url as string | undefined) ?? '';

      if (originalRequest && !originalRequest._apiRetry && path.startsWith('/auth')) {
        originalRequest._apiRetry = true;

        const currentBase = (originalRequest.baseURL as string | undefined) ?? getApiBaseUrl();
        const normalizedBase = currentBase.replace(/\/+$/g, '');
        const nextBase = /\/api$/i.test(normalizedBase)
          ? normalizedBase.replace(/\/api$/i, '')
          : `${normalizedBase}/api`;

        originalRequest.baseURL = nextBase;

        try {
          return http.request(originalRequest as any);
        } catch (retryError) {
          throw normalizeAxiosError(retryError);
        }
      }
    }

    // Handle true network failures (no response): warm up Render and retry.
    if (isAxios && !error.response) {
      const originalRequest = (error.config as any) as (Record<string, any> & { _netRetryCount?: number }) | undefined;
      if (originalRequest) {
        const path = (originalRequest.url as string | undefined) ?? '';
        const isAuth = typeof path === 'string' && path.startsWith('/auth');
        const maxRetries = isAuth ? 2 : 1;
        const nextRetry = (originalRequest._netRetryCount ?? 0) + 1;

        if (nextRetry <= maxRetries) {
          originalRequest._netRetryCount = nextRetry;

          const baseUrl = (originalRequest.baseURL as string | undefined) ?? getApiBaseUrl();
          if (/onrender\.com/i.test(baseUrl)) {
            await warmUpServer(baseUrl);
          }

          if (isAuth) {
            originalRequest.timeout = Math.max(originalRequest.timeout ?? 0, 45_000);
          }

          const backoff = isAuth ? 1500 : 500;
          await new Promise((r) => setTimeout(r, backoff));
          try {
            return http.request(originalRequest as any);
          } catch (retryError) {
            throw normalizeAxiosError(retryError);
          }
        }
      }

      throw normalizeAxiosError(error);
    }

    if (status !== 401) {
      throw normalizeAxiosError(error);
    }

    const originalRequest = (axios.isAxiosError(error) ? (error.config as any) : null) as
      | (Record<string, any> & { headers?: any; _retry?: boolean })
      | null;

    if (!originalRequest || originalRequest._retry) {
      throw normalizeAxiosError(error);
    }

    if (!refreshHooks) {
      throw normalizeAxiosError(error);
    }

    const refreshToken = refreshHooks.getRefreshToken();
    if (!refreshToken) {
      await refreshHooks.onAuthFailure?.();
      throw normalizeAxiosError(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = (async () => {
          const res = await authHttp.post('/auth/refresh', { refreshToken });
          const nextAccessToken = (res.data as any)?.accessToken as string | undefined;
          if (!nextAccessToken) {
            throw new Error('Session expired. Please sign in again.');
          }
          return nextAccessToken;
        })().finally(() => {
          refreshPromise = null;
        });
      }

      const nextAccessToken = await refreshPromise;
      currentAccessToken = nextAccessToken;
      await refreshHooks.onNewAccessToken(nextAccessToken);

      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;
      return http.request(originalRequest);
    } catch (refreshError) {
      await refreshHooks.onAuthFailure?.();
      throw normalizeAxiosError(refreshError);
    }
  },
);
