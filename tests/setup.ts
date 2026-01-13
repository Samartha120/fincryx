import { MongoMemoryReplSet } from 'mongodb-memory-server';

import { connectDb, disconnectDb } from '../src/config/db';
import { getEnv } from '../src/config/env';

let replset: MongoMemoryReplSet;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test_access_secret_1234567890';
  process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test_refresh_secret_1234567890';
  process.env.JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
  process.env.JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost';

  replset = await MongoMemoryReplSet.create({
    replSet: { count: 1 },
  });
  process.env.MONGO_URI = replset.getUri('finoryx_test');

  const env = getEnv();
  await connectDb(env);
});

afterAll(async () => {
  await disconnectDb();
  if (replset) await replset.stop();
});

afterEach(async () => {
  const { default: mongoose } = await import('mongoose');
  const db = mongoose.connection.db;
  if (!db) return;

  const collections = await db.collections();
  for (const c of collections) {
    await c.deleteMany({});
  }
});
