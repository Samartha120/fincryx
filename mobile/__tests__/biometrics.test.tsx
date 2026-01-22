
import { BiometricService } from '@/src/services/biometric.service';
import { useAuthStore } from '@/src/store/useAuthStore';
import * as SecureStore from 'expo-secure-store';
import { SafeLocalAuthentication } from '@/src/utils/biometrics';

// Mock dependencies
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
}));

jest.mock('@/src/utils/biometrics', () => ({
  SafeLocalAuthentication: {
    hasHardwareAsync: jest.fn(),
    isEnrolledAsync: jest.fn(),
    authenticateAsync: jest.fn(),
    supportedAuthenticationTypesAsync: jest.fn(),
    AuthenticationType: {
      FINGERPRINT: 1,
      FACIAL_RECOGNITION: 2,
    },
  },
}));

describe('BiometricService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('checkHardwareAsync returns true only if hardware exists and is enrolled', async () => {
    (SafeLocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
    (SafeLocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
    const result = await BiometricService.checkHardwareAsync();
    expect(result).toBe(true);
  });

  it('checkHardwareAsync returns false if hardware missing', async () => {
    (SafeLocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(false);
    const result = await BiometricService.checkHardwareAsync();
    expect(result).toBe(false);
  });

  it('enableBiometricLogin authenticates first then saves token', async () => {
    // Mock successful auth
    (SafeLocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({ success: true });
    (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);

    const result = await BiometricService.enableBiometricLogin('refresh-token-123');

    expect(SafeLocalAuthentication.authenticateAsync).toHaveBeenCalled();
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'finoryx_bio_refresh_token',
      'refresh-token-123',
      expect.objectContaining({
        keychainAccessible: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
        requireAuthentication: true,
      })
    );
    expect(result).toBe(true);
  });

  it('enableBiometricLogin fails if initial auth fails', async () => {
    (SafeLocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({ success: false });

    const result = await BiometricService.enableBiometricLogin('refresh-token-123');

    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
    expect(result).toBe(false);
  });

  it('unlockSessionWithBiometrics retrieves token', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('refresh-token-123');

    const result = await BiometricService.unlockSessionWithBiometrics();

    expect(SecureStore.getItemAsync).toHaveBeenCalledWith(
      'finoryx_bio_refresh_token',
      expect.objectContaining({
        requireAuthentication: true,
      })
    );
    expect(result).toEqual({ success: true, token: 'refresh-token-123' });
  });
});

describe('useAuthStore Biometrics', () => {
    beforeEach(() => {
        useAuthStore.setState({
            token: 'test-token',
            refreshToken: 'test-refresh-token',
            isAuthenticated: true,
        });
        jest.clearAllMocks();
    });

    it('enableBiometrics calls service with refresh token', async () => {
        const spy = jest.spyOn(BiometricService, 'enableBiometricLogin').mockResolvedValue(true);
        
        const success = await useAuthStore.getState().enableBiometrics();
        
        expect(spy).toHaveBeenCalledWith('test-refresh-token');
        expect(success).toBe(true);
    });
});
