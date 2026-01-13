import type { NextFunction, Request as ExpressRequest, Response as ExpressResponse } from 'express';

import { ApiError } from './errorMiddleware';

export function requireRole(...roles: Array<'customer' | 'admin'>) {
  return (req: ExpressRequest, _res: ExpressResponse, next: NextFunction): void => {
    const role = req.auth?.role;
    if (!role) {
      next(new ApiError(401, 'Unauthorized'));
      return;
    }
    if (!roles.includes(role)) {
      next(new ApiError(403, 'Forbidden'));
      return;
    }
    next();
  };
}
