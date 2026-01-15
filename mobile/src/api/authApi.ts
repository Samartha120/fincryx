import { http } from '@/src/lib/http';

export type AuthTokens = {
  accessToken: string;
  refreshToken?: string;
};

function extractAuthTokens(data: unknown): AuthTokens {
  const payload = data as any;
  const maybeToken =
    payload?.accessToken ??
    payload?.access_token ??
    payload?.token ??
    payload?.data?.accessToken ??
    payload?.data?.access_token ??
    payload?.data?.token;

  const maybeRefresh =
    payload?.refreshToken ??
    payload?.refresh_token ??
    payload?.data?.refreshToken ??
    payload?.data?.refresh_token;

  if (typeof maybeToken !== 'string' || maybeToken.length === 0) {
    throw new Error('Invalid response from server');
  }

  const tokens: AuthTokens = { accessToken: maybeToken };
  if (typeof maybeRefresh === 'string' && maybeRefresh.length > 0) {
    tokens.refreshToken = maybeRefresh;
  }

  return tokens;
}

export type RegisterPayload = {
  fullName: string;
  email: string;
  password: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResult =
  | ({ requiresOtp: false } & AuthTokens)
  | {
      requiresOtp: true;
      otpExpiresAt?: string;
    };

export type VerifyOtpPayload = {
  email: string;
  otp: string;
};

export type UserProfile = {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'customer';
};

export async function register(payload: RegisterPayload) {
  const res = await http.post('/auth/register', payload);
  return res.data;
}

export async function verifyOtp(payload: VerifyOtpPayload) {
  const res = await http.post('/auth/otp/verify', payload);
  return extractAuthTokens(res.data);
}

export async function requestOtp(payload: { email: string }) {
  const res = await http.post('/auth/otp/request', payload);
  return res.data as { otp?: string; otpExpiresAt?: string };
}

export async function requestPasswordReset(payload: { email: string }) {
  const res = await http.post('/auth/password/reset/request', payload);
  return res.data as { otp?: string; otpExpiresAt?: string };
}

export async function confirmPasswordReset(payload: { email: string; otp: string; newPassword: string }) {
  await http.post('/auth/password/reset/confirm', payload);
}

export async function login(payload: LoginPayload): Promise<LoginResult> {
  const res = await http.post('/auth/login', payload);
  const data = res.data as any;

  if (data?.requiresOtp) {
    return {
      requiresOtp: true,
      otpExpiresAt: typeof data.otpExpiresAt === 'string' ? data.otpExpiresAt : undefined,
    };
  }

  return { requiresOtp: false, ...extractAuthTokens(data) };
}

export async function getUserProfile() {
  const res = await http.get('/user/me');
  return res.data as UserProfile;
}

export async function logout() {
  await http.post('/auth/logout');
}
