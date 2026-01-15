import Constants from 'expo-constants';

let didLogBaseUrl = false;

function normalizeBaseUrl(value: string): string {
  const trimmed = value.trim();
  // Remove trailing slashes so axios joins paths predictably.
  return trimmed.replace(/\/+$/g, '');
}

function sanitizeBaseUrl(value: string): string {
  const normalized = normalizeBaseUrl(value);

  // Common misconfiguration: setting the base URL to .../auth or .../api/auth.
  // Our API helpers already prefix paths with /auth, so that would become /auth/auth/* and 404.
  const stripped = normalized.replace(/\/(api\/)?auth$/i, '');
  return normalizeBaseUrl(stripped);
}

export function getApiBaseUrl(): string {
  // Preferred: EXPO_PUBLIC_API_URL
  // Back-compat: EXPO_PUBLIC_API_BASE_URL
  const envBaseUrl = process.env.EXPO_PUBLIC_API_URL ?? process.env.EXPO_PUBLIC_API_BASE_URL;

  // Optional config fallback: app.json -> expo.extra.apiUrl
  const extraBaseUrl =
    ((Constants.expoConfig as any)?.extra?.apiUrl as string | undefined) ??
    ((Constants.manifest as any)?.extra?.apiUrl as string | undefined) ??
    ((Constants.manifest2 as any)?.extra?.apiUrl as string | undefined);

  const raw = envBaseUrl ?? extraBaseUrl;

  if (!raw) {
    // Default to the Render backend for this repo.
    // (Render service name in render.yaml: fincryx-backend)
    const fallback = 'https://fincyrx.onrender.com';
    if (__DEV__ && !didLogBaseUrl) {
      didLogBaseUrl = true;
      console.log('[config] API base URL:', fallback);
    }
    return fallback;
  }

  const baseUrl = sanitizeBaseUrl(raw);
  if (__DEV__ && !didLogBaseUrl) {
    didLogBaseUrl = true;
    console.log('[config] API base URL:', baseUrl);
  }
  return baseUrl;
}
