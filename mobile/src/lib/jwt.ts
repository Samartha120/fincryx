export type JwtPayload = {
  sub?: string;
  role?: 'admin' | 'customer';
  exp?: number;
  iat?: number;
  [key: string]: unknown;
};

function base64UrlDecode(input: string): string {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);

  // atob is available in React Native / Hermes; fall back if needed.
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (typeof atob === 'function') return atob(padded);

  // Minimal fallback for environments that don't expose atob.
  // eslint-disable-next-line no-undef
  return Buffer.from(padded, 'base64').toString('utf-8');
}

export function decodeJwt(token: string): JwtPayload {
  const parts = token.split('.');
  if (parts.length < 2) return {};

  try {
    const json = base64UrlDecode(parts[1]);
    return JSON.parse(json) as JwtPayload;
  } catch {
    return {};
  }
}
