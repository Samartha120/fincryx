"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePagination = parsePagination;
const zod_1 = require("zod");
const errorMiddleware_1 = require("../middlewares/errorMiddleware");
const paginationSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(20),
});
function parsePagination(query) {
    const raw = (query ?? {});
    const parsed = paginationSchema.safeParse({ page: raw.page, limit: raw.limit });
    if (!parsed.success) {
        throw new errorMiddleware_1.ApiError(400, 'Invalid pagination parameters', parsed.error.flatten());
    }
    return parsed.data;
}
