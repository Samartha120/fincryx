import type { NextFunction, Request as ExpressRequest, Response as ExpressResponse } from 'express';
import type { ZodSchema } from 'zod';

import { ApiError } from './errorMiddleware';

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: ExpressRequest, _res: ExpressResponse, next: NextFunction): void => {
    const candidate = (req.body ?? {}) as unknown;
    const parsed = schema.safeParse(candidate);
    if (!parsed.success) {
      next(new ApiError(400, 'Validation error', parsed.error.flatten()));
      return;
    }
    req.body = parsed.data as unknown;
    next();
  };
}
