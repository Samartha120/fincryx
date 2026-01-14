"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
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
