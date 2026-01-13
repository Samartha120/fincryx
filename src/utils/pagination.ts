import { z } from 'zod';

import { ApiError } from '../middlewares/errorMiddleware';

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export function parsePagination(query: unknown): { page: number; limit: number } {
  const raw = (query ?? {}) as Record<string, unknown>;

  const parsed = paginationSchema.safeParse({ page: raw.page, limit: raw.limit });
  if (!parsed.success) {
    throw new ApiError(400, 'Invalid pagination parameters', parsed.error.flatten());
  }

  return parsed.data;
}
