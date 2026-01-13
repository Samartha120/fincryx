import { Types } from 'mongoose';

import { ApiError } from '../../middlewares/errorMiddleware';
import { AccountModel } from '../../models/Account';
import { RefreshTokenModel } from '../../models/RefreshToken';
import { UserModel } from '../../models/User';
import { sha256Base64Url } from '../../utils/crypto';
import { hashPassword, verifyPassword } from '../../utils/password';
import { generateAccountNumber } from '../../utils/refs';

import { refreshTokenExpiryDate, signAccessToken, signRefreshToken, verifyRefreshToken } from './jwtService';
import { issueMockOtp, verifyMockOtp } from './otpService';

export async function registerCustomer(input: {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
}): Promise<{ userId: string; otp: string; otpExpiresAt: Date }> {
  const email = input.email.toLowerCase();
  const existing = await UserModel.findOne({ email });
  if (existing) throw new ApiError(409, 'Email already registered');

  const passwordHash = await hashPassword(input.password);
  const user = await UserModel.create({
    role: 'customer',
    fullName: input.fullName,
    email,
    phone: input.phone,
    passwordHash,
    isOtpVerified: false,
  });

  await AccountModel.create({
    userId: user._id,
    accountNumber: generateAccountNumber(),
    type: 'checking',
    currency: 'INR',
    balanceMinor: 0,
  });

  const otpIssued = await issueMockOtp(email);
  return { userId: user._id.toString(), otp: otpIssued.otp, otpExpiresAt: otpIssued.expiresAt };
}

export async function login(input: { email: string; password: string }): Promise<
  | { requiresOtp: true; otp: string; otpExpiresAt: Date }
  | { requiresOtp: false; accessToken: string; refreshToken: string }
> {
  const email = input.email.toLowerCase();
  const user = await UserModel.findOne({ email });
  if (!user) throw new ApiError(401, 'Invalid credentials');

  const ok = await verifyPassword(input.password, user.passwordHash);
  if (!ok) throw new ApiError(401, 'Invalid credentials');

  if (!user.isOtpVerified) {
    const otpIssued = await issueMockOtp(email);
    return { requiresOtp: true, otp: otpIssued.otp, otpExpiresAt: otpIssued.expiresAt };
  }

  const accessToken = signAccessToken(user._id.toString(), user.role);
  const { token: refreshToken } = signRefreshToken(user._id.toString(), user.role);

  await RefreshTokenModel.create({
    userId: user._id,
    tokenHash: sha256Base64Url(refreshToken),
    expiresAt: refreshTokenExpiryDate(),
  });

  return { requiresOtp: false, accessToken, refreshToken };
}

export async function verifyOtpAndIssueTokens(input: {
  email: string;
  otp: string;
}): Promise<{ accessToken: string; refreshToken: string }> {
  const email = input.email.toLowerCase();
  await verifyMockOtp(email, input.otp);

  const user = await UserModel.findOne({ email });
  if (!user) throw new ApiError(404, 'User not found');

  const accessToken = signAccessToken(user._id.toString(), user.role);
  const { token: refreshToken } = signRefreshToken(user._id.toString(), user.role);

  await RefreshTokenModel.create({
    userId: user._id,
    tokenHash: sha256Base64Url(refreshToken),
    expiresAt: refreshTokenExpiryDate(),
  });

  return { accessToken, refreshToken };
}

export async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
  let payload: ReturnType<typeof verifyRefreshToken>;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new ApiError(401, 'Invalid refresh token');
  }

  const tokenHash = sha256Base64Url(refreshToken);
  const userObjectId = new Types.ObjectId(payload.sub);
  const stored = await RefreshTokenModel.findOne({
    userId: userObjectId,
    tokenHash,
    revokedAt: { $exists: false },
  });
  if (!stored) throw new ApiError(401, 'Refresh token revoked');
  if (stored.expiresAt.getTime() < Date.now()) throw new ApiError(401, 'Refresh token expired');

  const accessToken = signAccessToken(payload.sub, payload.role);
  return { accessToken };
}

export async function logout(refreshToken: string): Promise<void> {
  const tokenHash = sha256Base64Url(refreshToken);
  await RefreshTokenModel.updateOne(
    { tokenHash, revokedAt: { $exists: false } },
    { $set: { revokedAt: new Date() } },
  );
}
