import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';

import { ApiError } from '../../middlewares/errorMiddleware';
import { login, logout, refreshAccessToken, registerCustomer, verifyOtpAndIssueTokens } from '../../services/auth/authService';

export async function register(req: ExpressRequest, res: ExpressResponse): Promise<void> {
  const result = await registerCustomer(req.body);
  res.status(201).json({
    userId: result.userId,
    otp: result.otp,
    otpExpiresAt: result.otpExpiresAt.toISOString(),
  });
}

export async function loginHandler(req: ExpressRequest, res: ExpressResponse): Promise<void> {
  const result = await login(req.body);
  if (result.requiresOtp) {
    res.status(200).json({ requiresOtp: true, otp: result.otp, otpExpiresAt: result.otpExpiresAt.toISOString() });
    return;
  }

  res.status(200).json({ requiresOtp: false, accessToken: result.accessToken, refreshToken: result.refreshToken });
}

export async function verifyOtp(req: ExpressRequest, res: ExpressResponse): Promise<void> {
  const tokens = await verifyOtpAndIssueTokens(req.body);
  res.status(200).json(tokens);
}

export async function refresh(req: ExpressRequest, res: ExpressResponse): Promise<void> {
  const token = (req.body?.refreshToken as string | undefined) || (req.cookies?.refreshToken as string | undefined);
  if (!token) throw new ApiError(400, 'Missing refreshToken');

  const result = await refreshAccessToken(token);
  res.status(200).json(result);
}

export async function logoutHandler(req: ExpressRequest, res: ExpressResponse): Promise<void> {
  const token = (req.body?.refreshToken as string | undefined) || (req.cookies?.refreshToken as string | undefined);
  if (!token) throw new ApiError(400, 'Missing refreshToken');

  await logout(token);
  res.status(204).send();
}
