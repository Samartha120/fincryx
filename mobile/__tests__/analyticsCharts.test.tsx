import React from 'react';
import { render } from '@testing-library/react-native';

import { TransactionFlowChart } from '@/src/components/analytics/TransactionFlowChart';
import { TransferActivityChart } from '@/src/components/analytics/TransferActivityChart';
import { SpendingPatternChart } from '@/src/components/analytics/SpendingPatternChart';
import { LoanOverviewChart } from '@/src/components/analytics/LoanOverviewChart';
import type { TransactionAnalytics, LoanAnalytics } from '@/src/api/analyticsApi';
import type { Transaction } from '@/src/api/transactionsApi';
import type { Account } from '@/src/api/accountsApi';

describe('Analytics charts render without crashing', () => {
  it('renders TransactionFlowChart with sample data', () => {
    const data: TransactionAnalytics = {
      labels: ['Jan', 'Feb'],
      credit: [1000, 2000],
      debit: [500, 1500],
    };

    const { getByText } = render(
      <TransactionFlowChart title="Transaction flow" data={data} loading={false} error={null} />,
    );

    expect(getByText('Transaction flow')).toBeTruthy();
  });

  it('renders TransferActivityChart with sample transfers', () => {
    const txs: Transaction[] = [
      {
        _id: '1',
        type: 'transfer',
        status: 'completed',
        amountMinor: -10000,
        currency: 'INR',
        reference: 'ref1',
        createdAt: new Date().toISOString(),
        note: '',
      },
      {
        _id: '2',
        type: 'transfer',
        status: 'completed',
        amountMinor: 5000,
        currency: 'INR',
        reference: 'ref2',
        createdAt: new Date().toISOString(),
        note: '',
      },
    ];

    const { getByText } = render(<TransferActivityChart transactions={txs} loading={false} />);

    expect(getByText('Transfers')).toBeTruthy();
  });

  it('renders SpendingPatternChart with sample accounts and transactions', () => {
    const now = new Date().toISOString();
    const accounts: Account[] = [
      {
        _id: 'acc1',
        accountNumber: '1234567890',
        type: 'checking',
        currency: 'INR',
        balanceMinor: 100000,
        createdAt: now,
        updatedAt: now,
      },
    ];

    const txs: Transaction[] = [
      {
        _id: 't1',
        type: 'transfer',
        status: 'completed',
        amountMinor: -2000,
        currency: 'INR',
        reference: 'ref',
        createdAt: new Date().toISOString(),
        note: '',
        fromAccountId: 'acc1',
      } as any,
    ];

    const { getByText } = render(
      <SpendingPatternChart
        title="Spending pattern"
        currency="INR"
        accounts={accounts}
        transactions={txs}
      />,
    );

    expect(getByText('No spending data available.')).toBeTruthy();
  });

  it('renders LoanOverviewChart with sample analytics', () => {
    const data: LoanAnalytics = {
      totalLoan: 100000,
      paid: 40000,
      pending: 60000,
    };

    const { getByText } = render(
      <LoanOverviewChart title="Loan overview" currency="INR" data={data} loading={false} error={null} />,
    );

    expect(getByText('Loan overview')).toBeTruthy();
  });
});
