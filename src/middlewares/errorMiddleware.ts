import type { NextFunction, Request as ExpressRequest, Response as ExpressResponse } from 'express';

export type ApiErrorPayload = {
  message: string;
  details?: unknown;
};

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function notFoundHandler(req: ExpressRequest, res: ExpressResponse): void {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.path}` } satisfies ApiErrorPayload);
}

export function errorHandler(
  err: unknown,
  _req: ExpressRequest,
  res: ExpressResponse,
  _next: NextFunction,
): void {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({ message: err.message, details: err.details } satisfies ApiErrorPayload);
    return;
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const message = isProduction ? 'Internal Server Error' : err instanceof Error ? err.message : 'Internal Server Error';
  res.status(500).json({ message } satisfies ApiErrorPayload);
}
