import { render, waitFor } from '@testing-library/react-native';
import React from 'react';

import DashboardScreen from '@/app/(tabs)/index';
import * as accountsApi from '@/src/api/accountsApi';
import * as analyticsApi from '@/src/api/analyticsApi';
import * as transactionsApi from '@/src/api/transactionsApi';

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    // Dashboard uses useFocusEffect to refresh on tab focus. In unit tests we don't
    // render inside a NavigationContainer, so treat it as a no-op.
    useFocusEffect: () => {},
  };
});

jest.mock('@/src/api/analyticsApi');
jest.mock('@/src/api/accountsApi');
jest.mock('@/src/api/transactionsApi');

describe('DashboardScreen', () => {
  it('renders empty state when no accounts/transactions', async () => {
    (accountsApi.getAccounts as jest.Mock).mockResolvedValue({ items: [] });
    (transactionsApi.getTransactions as jest.Mock).mockResolvedValue({ page: 1, limit: 10, total: 0, items: [] });
    (analyticsApi.getTransactionAnalyticsWithParams as jest.Mock).mockResolvedValue({ labels: [], credit: [], debit: [] });
    (analyticsApi.getLoanAnalytics as jest.Mock).mockResolvedValue({ totalLoan: 0, paid: 0, pending: 0 });

    const screen = render(<DashboardScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-no-accounts')).toBeTruthy();
    });
  });
});
