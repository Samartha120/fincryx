import nodeCrypto from 'crypto';

import jwt from 'jsonwebtoken';

import type { UserRole } from '../../models/User';

export type AccessTokenClaims = {
  sub: string;
  role: UserRole;
  typ: 'access';
};

export type RefreshTokenClaims = {
  sub: string;
  role: UserRole;
  typ: 'refresh';
  jti: string;
};

export function signAccessToken(userId: string, role: UserRole): string {
  const secret = process.env.JWT_ACCESS_SECRET;
  const expiresIn = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
  if (!secret) throw new Error('JWT_ACCESS_SECRET missing');

  const claims: AccessTokenClaims = { sub: userId, role, typ: 'access' };
  return jwt.sign(claims, secret, { expiresIn: expiresIn as unknown as jwt.SignOptions['expiresIn'] });
}

export function signRefreshToken(userId: string, role: UserRole): { token: string; jti: string } {
  const secret = process.env.JWT_REFRESH_SECRET;
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  if (!secret) throw new Error('JWT_REFRESH_SECRET missing');

  const jti = nodeCrypto.randomUUID();
  const claims: RefreshTokenClaims = { sub: userId, role, typ: 'refresh', jti };
  const token = jwt.sign(claims, secret, { expiresIn: expiresIn as unknown as jwt.SignOptions['expiresIn'] });
  return { token, jti };
}

export function verifyRefreshToken(token: string): RefreshTokenClaims {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error('JWT_REFRESH_SECRET missing');

  const payload = jwt.verify(token, secret) as RefreshTokenClaims;
  if (payload.typ !== 'refresh' || !payload.jti) {
    throw new Error('Invalid refresh token');
  }
  return payload;
}

export function refreshTokenExpiryDate(): Date {
  const raw = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  const match = raw.match(/^(\d+)([smhd])$/i);
  if (!match) {
    // fallback: 7 days
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }

  const value = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return new Date(Date.now() + value * multipliers[unit]);
}
