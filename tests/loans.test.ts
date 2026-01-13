import request from 'supertest';

import { createApp } from '../src/app';
import { AccountModel } from '../src/models/Account';
import { UserModel } from '../src/models/User';
import { hashPassword } from '../src/utils/password';

describe('loans', () => {
  it('customer can apply; admin can approve; disbursement credits account', async () => {
    const app = createApp();

    // Customer (OTP-verified)
    await UserModel.create({
      role: 'customer',
      fullName: 'Loan Customer',
      email: 'loan.cust@example.com',
      passwordHash: await hashPassword('Password123!'),
      isOtpVerified: true,
    });

    const customer = await UserModel.findOne({ email: 'loan.cust@example.com' });
    const customerAccount = await AccountModel.create({
      userId: customer!._id,
      accountNumber: '9990001111',
      type: 'checking',
      currency: 'INR',
      balanceMinor: 0,
    });

    const customerLogin = await request(app).post('/auth/login').send({
      email: 'loan.cust@example.com',
      password: 'Password123!',
    });
    expect(customerLogin.status).toBe(200);
    expect(customerLogin.body.requiresOtp).toBe(false);

    // Admin
    await UserModel.create({
      role: 'admin',
      fullName: 'Loan Admin',
      email: 'loan.admin@example.com',
      passwordHash: await hashPassword('Password123!'),
      isOtpVerified: true,
    });

    const adminLogin = await request(app).post('/auth/login').send({
      email: 'loan.admin@example.com',
      password: 'Password123!',
    });
    expect(adminLogin.status).toBe(200);
    expect(adminLogin.body.requiresOtp).toBe(false);

    const applyRes = await request(app)
      .post('/loans')
      .set('Authorization', `Bearer ${customerLogin.body.accessToken}`)
      .send({
        accountId: customerAccount._id.toString(),
        principalMinor: 50000,
        annualInterestBps: 1200,
        termMonths: 12,
      });

    expect(applyRes.status).toBe(201);
    expect(applyRes.body.loan.status).toBe('pending');
    expect(applyRes.body.emi.monthlyPaymentMinor).toBeDefined();

    const loanId = applyRes.body.loan._id;

    // Customer cannot access admin decision
    const customerDecisionAttempt = await request(app)
      .post(`/loans/admin/${loanId}/decision`)
      .set('Authorization', `Bearer ${customerLogin.body.accessToken}`)
      .send({ decision: 'approved' });
    expect(customerDecisionAttempt.status).toBe(403);

    const approveRes = await request(app)
      .post(`/loans/admin/${loanId}/decision`)
      .set('Authorization', `Bearer ${adminLogin.body.accessToken}`)
      .send({ decision: 'approved', decisionNote: 'Approved for demo' });

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.loan.status).toBe('approved');

    const accountAfter = await AccountModel.findById(customerAccount._id);
    expect(accountAfter!.balanceMinor).toBe(50000);

    const txRes = await request(app)
      .get('/transactions')
      .set('Authorization', `Bearer ${customerLogin.body.accessToken}`);
    expect(txRes.status).toBe(200);
    expect(txRes.body.total).toBe(1);
    expect(txRes.body.items[0].type).toBe('loan_disbursement');
    expect(txRes.body.items[0].amountMinor).toBe(50000);
  });
});
