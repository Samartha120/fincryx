import 'dotenv/config';

import { createApp } from './app';
import { connectDb } from './config/db';
import { getEnv } from './config/env';

async function bootstrap() {
  const env = getEnv();
  await connectDb(env);

  const app = createApp();

  app.listen(env.PORT, () => {
    console.log(`Finoryx API listening on port ${env.PORT}`);
  });
}

void bootstrap();
