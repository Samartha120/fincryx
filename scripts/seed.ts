import 'dotenv/config';

import { connectDb, disconnectDb } from '../src/config/db';
import { getEnv } from '../src/config/env';
import { AccountModel } from '../src/models/Account';
import { UserModel } from '../src/models/User';
import { hashPassword } from '../src/utils/password';
import { generateAccountNumber } from '../src/utils/refs';

async function run() {
  const env = getEnv();
  await connectDb(env);

  const adminEmail = 'admin@finoryx.local';
  const customerEmail = 'customer@finoryx.local';

  await Promise.all([
    UserModel.deleteOne({ email: adminEmail }),
    UserModel.deleteOne({ email: customerEmail }),
  ]);

  const admin = await UserModel.create({
    role: 'admin',
    fullName: 'Finoryx Admin',
    email: adminEmail,
    passwordHash: await hashPassword('Password123!'),
    isOtpVerified: true,
  });

  const customer = await UserModel.create({
    role: 'customer',
    fullName: 'Finoryx Customer',
    email: customerEmail,
    passwordHash: await hashPassword('Password123!'),
    isOtpVerified: true,
  });

  await AccountModel.create({
    userId: customer._id,
    accountNumber: generateAccountNumber(),
    type: 'checking',
    currency: 'INR',
    balanceMinor: 250000,
  });

  console.log('Seeded users:');
  console.log(`Admin: ${admin.email} / Password123!`);
  console.log(`Customer: ${customer.email} / Password123!`);

  await disconnectDb();
}

run().catch(async (err) => {
  console.error(err);
  try {
    await disconnectDb();
  } catch {
    // ignore
  }
  process.exitCode = 1;
});
