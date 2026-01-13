import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import LoginScreen from '@/app/(auth)/login';
import * as authApi from '@/src/api/authApi';

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
};

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
}));

jest.mock('@/src/api/authApi');

const storeState: {
  pendingEmail: string | null;
  lastEmail: string | null;
  role: 'admin' | 'customer' | null;
} = {
  pendingEmail: null,
  lastEmail: null,
  role: null,
};

jest.mock('@/src/store/authStore', () => {
  const actions = {
    setTokens: jest.fn(),
    setProfile: jest.fn(),
    beginOtp: ({ email }: { email: string }) => {
      storeState.pendingEmail = email;
    },
    clearPendingOtp: () => {
      storeState.pendingEmail = null;
    },
    setLastEmail: (email: string) => {
      storeState.lastEmail = email;
    },
    clear: () => {
      storeState.pendingEmail = null;
      storeState.lastEmail = null;
      storeState.role = null;
    },
  };

  const useAuthStore = (selector: any) => selector({ ...storeState, ...actions });
  (useAuthStore as any).getState = () => ({ ...storeState, ...actions });
  return { useAuthStore };
});

describe('LoginScreen', () => {
  beforeEach(() => {
    mockRouter.push.mockClear();
    mockRouter.replace.mockClear();
    storeState.pendingEmail = null;
    storeState.lastEmail = null;
    storeState.role = null;
  });

  it('routes to OTP when login requiresOtp', async () => {
    (authApi.login as jest.Mock).mockResolvedValue({
      requiresOtp: true,
      otp: '123456',
      otpExpiresAt: new Date().toISOString(),
    });

    const screen = render(<LoginScreen />);

    fireEvent.changeText(screen.getByTestId('login-email'), 'user@example.com');
    fireEvent.changeText(screen.getByTestId('login-password'), 'password123');
    fireEvent.press(screen.getByTestId('login-submit'));

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/(auth)/otp');
    });

    expect(storeState.pendingEmail).toBe('user@example.com');
  });
});
