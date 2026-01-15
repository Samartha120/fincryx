import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import TransferScreen from '@/app/(tabs)/transfer';
import * as accountsApi from '@/src/api/accountsApi';

jest.mock('@/src/api/accountsApi');

describe('TransferScreen', () => {
  beforeEach(() => {
    (accountsApi.getAccounts as jest.Mock).mockResolvedValue({
      items: [
        {
          _id: 'acc1',
          accountNumber: '1234567890',
          type: 'checking',
          currency: 'INR',
          balanceMinor: 100000,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    });
  });

  it('shows validation error for missing toAccountNumber', async () => {
    (accountsApi.transfer as jest.Mock).mockResolvedValue({ reference: 'TXN-1' });

    const screen = render(<TransferScreen />);

    // Wait for accounts to load and default account to be set.
    await waitFor(() => expect(screen.getByText('Transfer')).toBeTruthy());

    fireEvent.changeText(screen.getByTestId('transfer-amount'), '10');
    fireEvent.press(screen.getByTestId('transfer-submit'));

    await waitFor(() => {
      expect(screen.getByText(/Account number looks too short|Account number looks too long|Account number looks too short/)).toBeTruthy();
    });

    expect(accountsApi.transfer).not.toHaveBeenCalled();
  });

  it('submits a valid transfer and converts amount to minor units', async () => {
    (accountsApi.transfer as jest.Mock).mockResolvedValue({ reference: 'REF-123' });

    const screen = render(<TransferScreen />);

    await waitFor(() => expect(screen.getByText('Transfer')).toBeTruthy());

    fireEvent.changeText(screen.getByTestId('transfer-toAccountNumber'), '99999999');
    fireEvent.changeText(screen.getByTestId('transfer-amount'), '10.50');

    fireEvent.press(screen.getByTestId('transfer-submit'));

    await waitFor(() => {
      expect(accountsApi.transfer).toHaveBeenCalledWith(
        expect.objectContaining({
          fromAccountId: 'acc1',
          toAccountNumber: '99999999',
          amountMinor: 1050,
        }),
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Transfer completed')).toBeTruthy();
      expect(screen.getByText('REF-123')).toBeTruthy();
    });
  });
});
