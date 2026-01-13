import type { NextFunction, Request as ExpressRequest, Response as ExpressResponse } from 'express';
import jwt from 'jsonwebtoken';

import { ApiError } from './errorMiddleware';

type AccessTokenPayload = {
  sub: string;
  role: 'customer' | 'admin';
  typ: 'access';
  iat: number;
  exp: number;
};

export function requireAuth(req: ExpressRequest, _res: ExpressResponse, next: NextFunction): void {
  const header = req.header('authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    next(new ApiError(401, 'Missing Authorization header'));
    return;
  }

  const token = match[1];
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) {
    next(new ApiError(500, 'Server misconfigured'));
    return;
  }

  try {
    const payload = jwt.verify(token, secret) as AccessTokenPayload;
    if (payload.typ !== 'access') {
      next(new ApiError(401, 'Invalid token type'));
      return;
    }

    req.auth = { userId: payload.sub, role: payload.role };
    next();
  } catch {
    next(new ApiError(401, 'Invalid or expired token'));
  }
}
