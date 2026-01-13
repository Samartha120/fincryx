import { http } from '@/src/lib/http';

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type LoginResult =
  | { requiresOtp: true; otp: string; otpExpiresAt: string }
  | { requiresOtp: false; accessToken: string; refreshToken: string };

export async function register(payload: { fullName: string; email: string; password: string }) {
  const res = await http.post('/auth/register', payload);
  return res.data as { userId: string; otp: string; otpExpiresAt: string };
}

export async function login(payload: { email: string; password: string }) {
  const res = await http.post('/auth/login', payload);
  return res.data as LoginResult;
}

export async function verifyOtp(payload: { email: string; otp: string }) {
  const res = await http.post('/auth/otp/verify', payload);
  return res.data as AuthTokens;
}

export async function refresh(payload: { refreshToken: string }) {
  const res = await http.post('/auth/refresh', payload);
  return res.data as { accessToken: string };
}

export async function logout(payload: { refreshToken: string }) {
  await http.post('/auth/logout', payload);
}
