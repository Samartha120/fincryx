"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// In production (e.g. Render), env vars are typically injected by the platform.
// Keep dotenv optional so missing dependency doesn't crash the process.
try {
    const path_1 = require("path");
    const dotenv_1 = require("dotenv");
    // Load env from backend/.env even when started from repo root.
    (0, dotenv_1.config)({ path: (0, path_1.resolve)(__dirname, '..', '.env') });
}
catch (_a) {
    // Ignore: rely on process.env (platform-provided env vars).
}
const app_1 = require("./app");
const db_1 = require("./config/db");
const env_1 = require("./config/env");
async function bootstrap() {
    const env = (0, env_1.getEnv)();
    await (0, db_1.connectDb)(env);
    const app = (0, app_1.createApp)();
    app.listen(env.PORT, () => {
        console.log(`Finoryx API listening on port ${env.PORT}`);
    });
}
void bootstrap();
