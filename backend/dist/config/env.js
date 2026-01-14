"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnv = getEnv;
const zod_1 = require("zod");
const envSchema = zod_1.z.object({
    PORT: zod_1.z.coerce.number().int().positive().default(4000),
    NODE_ENV: zod_1.z.enum(['development', 'test', 'production']).default('development'),
    MONGO_URI: zod_1.z.string().min(1),
    JWT_ACCESS_SECRET: zod_1.z.string().min(10),
    JWT_REFRESH_SECRET: zod_1.z.string().min(10),
    JWT_ACCESS_EXPIRES_IN: zod_1.z.string().min(1).default('15m'),
    JWT_REFRESH_EXPIRES_IN: zod_1.z.string().min(1).default('7d'),
    // Comma-separated list of allowed browser origins.
    // Example: "http://localhost:19006,https://your-web-app.com"
    CORS_ORIGIN: zod_1.z.string().optional().default('http://localhost:19006'),
});
function getEnv() {
    const parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
        const issues = parsed.error.issues
            .map((i) => `${i.path.join('.') || 'env'}: ${i.message}`)
            .join('\n');
        throw new Error(`Invalid environment variables:\n${issues}`);
    }
    return parsed.data;
}
