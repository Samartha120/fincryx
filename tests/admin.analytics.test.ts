import request from 'supertest';

import { createApp } from '../src/app';
import { AccountModel } from '../src/models/Account';
import { UserModel } from '../src/models/User';
import { hashPassword } from '../src/utils/password';

describe('admin analytics', () => {
  it('requires admin role and returns stats', async () => {
    const app = createApp();

    // customer
    await UserModel.create({
      role: 'customer',
      fullName: 'Cust',
      email: 'a.cust@example.com',
      passwordHash: await hashPassword('Password123!'),
      isOtpVerified: true,
    });

    // admin
    await UserModel.create({
      role: 'admin',
      fullName: 'Admin',
      email: 'a.admin@example.com',
      passwordHash: await hashPassword('Password123!'),
      isOtpVerified: true,
    });

    const customer = await UserModel.findOne({ email: 'a.cust@example.com' });
    await AccountModel.create({
      userId: customer!._id,
      accountNumber: '1234500000',
      type: 'checking',
      currency: 'INR',
      balanceMinor: 1000,
    });

    const adminLogin = await request(app).post('/auth/login').send({
      email: 'a.admin@example.com',
      password: 'Password123!',
    });
    expect(adminLogin.status).toBe(200);
    expect(adminLogin.body.requiresOtp).toBe(false);

    const customerLogin = await request(app).post('/auth/login').send({
      email: 'a.cust@example.com',
      password: 'Password123!',
    });
    expect(customerLogin.status).toBe(200);
    expect(customerLogin.body.requiresOtp).toBe(false);

    const unauth = await request(app).get('/admin/stats');
    expect(unauth.status).toBe(401);

    const forbidden = await request(app)
      .get('/admin/stats')
      .set('Authorization', `Bearer ${customerLogin.body.accessToken}`);
    expect(forbidden.status).toBe(403);

    const statsRes = await request(app)
      .get('/admin/stats')
      .set('Authorization', `Bearer ${adminLogin.body.accessToken}`);
    expect(statsRes.status).toBe(200);
    expect(statsRes.body.users.total).toBeGreaterThanOrEqual(2);
    expect(statsRes.body.accounts.total).toBeGreaterThanOrEqual(1);
    expect(statsRes.body.accounts.totalBalanceMinor).toBeGreaterThanOrEqual(1000);
  });
});
