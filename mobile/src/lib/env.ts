export function getApiBaseUrl(): string {
  // Preferred: EXPO_PUBLIC_API_URL
  // Back-compat: EXPO_PUBLIC_API_BASE_URL
  const baseUrl = process.env.EXPO_PUBLIC_API_URL ?? process.env.EXPO_PUBLIC_API_BASE_URL;

  if (!baseUrl) {
    // Sensible default for local dev. For Android emulators, callers should
    // override with EXPO_PUBLIC_API_URL=http://10.0.2.2:4000
    return 'https://fincyrx.onrender.com';
  }

  return baseUrl;
}
