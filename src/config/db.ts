import mongoose from 'mongoose';

import type { Env } from './env';

export async function connectDb(env: Env): Promise<void> {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.MONGO_URI);
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}
