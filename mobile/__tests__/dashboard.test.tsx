import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

import DashboardScreen from '@/app/(tabs)/index';
import * as accountsApi from '@/src/api/accountsApi';
import * as transactionsApi from '@/src/api/transactionsApi';

jest.mock('@/src/api/accountsApi');
jest.mock('@/src/api/transactionsApi');

describe('DashboardScreen', () => {
  it('renders empty state when no accounts/transactions', async () => {
    (accountsApi.getAccounts as jest.Mock).mockResolvedValue({ items: [] });
    (transactionsApi.getTransactions as jest.Mock).mockResolvedValue({ page: 1, limit: 10, total: 0, items: [] });

    const screen = render(<DashboardScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-no-accounts')).toBeTruthy();
    });
  });
});
