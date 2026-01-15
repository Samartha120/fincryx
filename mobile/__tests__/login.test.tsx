import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import LoginScreen from '@/app/(auth)/login';
import * as authApi from '@/src/api/authApi';
import { authKeys } from '@/src/auth/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/src/store/useAuthStore';

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
};

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
}));

jest.mock('@/src/api/authApi');

describe('LoginScreen', () => {
  beforeEach(() => {
    mockRouter.push.mockClear();
    mockRouter.replace.mockClear();

    useAuthStore.setState({
      token: null,
      refreshToken: null,
      isLoading: false,
      isAuthenticated: false,
      user: null,
      pendingVerificationEmail: null,
    });

    (AsyncStorage.getItem as jest.Mock).mockClear();
    (AsyncStorage.setItem as jest.Mock).mockClear();
    (AsyncStorage.removeItem as jest.Mock).mockClear();
    (AsyncStorage.multiRemove as jest.Mock).mockClear();

    // Default: no persisted auth.
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
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
      expect(mockRouter.push).toHaveBeenCalledWith({
        pathname: '/(auth)/verify-otp',
        params: { email: 'user@example.com' },
      });
    });

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(authKeys.lastEmail, 'user@example.com');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(authKeys.pendingEmail, 'user@example.com');
    expect(useAuthStore.getState().pendingVerificationEmail).toBe('user@example.com');
  });
});
