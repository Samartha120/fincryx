import request from 'supertest';

import { createApp } from '../src/app';
import { AccountModel } from '../src/models/Account';
import { UserModel } from '../src/models/User';
import { hashPassword } from '../src/utils/password';

describe('auth', () => {
  it('register -> login requires OTP -> verify OTP -> receives tokens', async () => {
    const app = createApp();

    const registerRes = await request(app).post('/auth/register').send({
      fullName: 'Jane Customer',
      email: 'jane@example.com',
      password: 'Password123!',
    });

    expect(registerRes.status).toBe(201);
    expect(registerRes.body.userId).toBeDefined();
    // In test/dev we expose OTP for mock verification.
    expect(registerRes.body.otp).toBe('123456');

    const loginRes = await request(app).post('/auth/login').send({
      email: 'jane@example.com',
      password: 'Password123!',
    });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.requiresOtp).toBe(true);

    const otpRes = await request(app).post('/auth/otp/verify').send({
      email: 'jane@example.com',
      otp: '123456',
    });

    expect(otpRes.status).toBe(200);
    expect(otpRes.body.accessToken).toBeDefined();
    expect(otpRes.body.refreshToken).toBeDefined();

    const refreshRes = await request(app).post('/auth/refresh').send({
      refreshToken: otpRes.body.refreshToken,
    });

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.accessToken).toBeDefined();

    // Cookie-based refresh should work too (body optional).
    const refreshCookieRes = await request(app)
      .post('/auth/refresh')
      .set('Cookie', [`refreshToken=${otpRes.body.refreshToken}`]);
    expect(refreshCookieRes.status).toBe(200);
    expect(refreshCookieRes.body.accessToken).toBeDefined();

    const logoutRes = await request(app).post('/auth/logout').send({
      refreshToken: otpRes.body.refreshToken,
    });
    expect(logoutRes.status).toBe(204);

    // Cookie-based logout should also work.
    const logoutCookieRes = await request(app)
      .post('/auth/logout')
      .set('Cookie', [`refreshToken=${otpRes.body.refreshToken}`]);
    expect(logoutCookieRes.status).toBe(204);

    const refreshAfterLogout = await request(app).post('/auth/refresh').send({
      refreshToken: otpRes.body.refreshToken,
    });
    expect(refreshAfterLogout.status).toBe(401);
  });

  it('protects admin routes (401 without token, 403 for customer, 200 for admin)', async () => {
    const app = createApp();

    // Create customer user that is OTP-verified
    await UserModel.create({
      role: 'customer',
      fullName: 'Cust',
      email: 'cust@example.com',
      passwordHash: await hashPassword('Password123!'),
      isOtpVerified: true,
    });

    const customerLogin = await request(app).post('/auth/login').send({
      email: 'cust@example.com',
      password: 'Password123!',
    });
    expect(customerLogin.status).toBe(200);
    expect(customerLogin.body.requiresOtp).toBe(false);

    const noAuth = await request(app).get('/admin/users');
    expect(noAuth.status).toBe(401);

    const asCustomer = await request(app)
      .get('/admin/users')
      .set('Authorization', `Bearer ${customerLogin.body.accessToken}`);
    expect(asCustomer.status).toBe(403);

    // Create admin user
    await UserModel.create({
      role: 'admin',
      fullName: 'Admin',
      email: 'admin@example.com',
      passwordHash: await hashPassword('Password123!'),
      isOtpVerified: true,
    });

    const adminLogin = await request(app).post('/auth/login').send({
      email: 'admin@example.com',
      password: 'Password123!',
    });
    expect(adminLogin.status).toBe(200);
    expect(adminLogin.body.requiresOtp).toBe(false);

    const asAdmin = await request(app)
      .get('/admin/users?limit=10&page=1')
      .set('Authorization', `Bearer ${adminLogin.body.accessToken}`);

    expect(asAdmin.status).toBe(200);
    expect(asAdmin.body.items).toBeDefined();
    expect(Array.isArray(asAdmin.body.items)).toBe(true);
  });

  it('transfer moves balance and creates a transaction', async () => {
    const app = createApp();

    // Sender
    await request(app).post('/auth/register').send({
      fullName: 'Sender',
      email: 'sender@example.com',
      password: 'Password123!',
    });
    await request(app).post('/auth/otp/verify').send({ email: 'sender@example.com', otp: '123456' });
    const senderLogin = await request(app).post('/auth/login').send({
      email: 'sender@example.com',
      password: 'Password123!',
    });
    expect(senderLogin.body.requiresOtp).toBe(false);

    // Receiver
    await request(app).post('/auth/register').send({
      fullName: 'Receiver',
      email: 'receiver@example.com',
      password: 'Password123!',
    });
    await request(app).post('/auth/otp/verify').send({ email: 'receiver@example.com', otp: '123456' });

    const senderUser = await UserModel.findOne({ email: 'sender@example.com' });
    const receiverUser = await UserModel.findOne({ email: 'receiver@example.com' });
    expect(senderUser).toBeTruthy();
    expect(receiverUser).toBeTruthy();

    const senderAccount = await AccountModel.findOne({ userId: senderUser!._id });
    const receiverAccount = await AccountModel.findOne({ userId: receiverUser!._id });
    expect(senderAccount).toBeTruthy();
    expect(receiverAccount).toBeTruthy();

    await AccountModel.updateOne({ _id: senderAccount!._id }, { $set: { balanceMinor: 10000 } });

    const transferRes = await request(app)
      .post('/accounts/transfer')
      .set('Authorization', `Bearer ${senderLogin.body.accessToken}`)
      .send({
        fromAccountId: senderAccount!._id.toString(),
        toAccountNumber: receiverAccount!.accountNumber,
        amountMinor: 2500,
        note: 'Test transfer',
      });

    expect(transferRes.status).toBe(201);
    expect(transferRes.body.reference).toBeDefined();

    const senderAfter = await AccountModel.findById(senderAccount!._id);
    const receiverAfter = await AccountModel.findById(receiverAccount!._id);
    expect(senderAfter!.balanceMinor).toBe(7500);
    expect(receiverAfter!.balanceMinor).toBe(2500);

    const txRes = await request(app)
      .get('/transactions')
      .set('Authorization', `Bearer ${senderLogin.body.accessToken}`);
    expect(txRes.status).toBe(200);
    expect(txRes.body.total).toBe(1);
    expect(txRes.body.items[0].type).toBe('transfer');
    expect(txRes.body.items[0].amountMinor).toBe(2500);

    const txInvalidPage = await request(app)
      .get('/transactions?page=abc')
      .set('Authorization', `Bearer ${senderLogin.body.accessToken}`);
    expect(txInvalidPage.status).toBe(400);
    expect(txInvalidPage.body.message).toBe('Invalid pagination parameters');
  });
});
