import { SafeLocalAuthentication } from '@/src/utils/biometrics';
import * as SecureStore from 'expo-secure-store';
import { Alert, Platform } from 'react-native';

const BIOMETRIC_TOKEN_KEY = 'finoryx_bio_refresh_token';

export const BiometricService = {
    // Check if hardware supports biometrics
    checkHardwareAsync: async () => {
        try {
            const hasHardware = await SafeLocalAuthentication.hasHardwareAsync();
            const isEnrolled = await SafeLocalAuthentication.isEnrolledAsync();
            return hasHardware && isEnrolled;
        } catch (e) {
            console.warn('Biometric hardware check failed', e);
            return false;
        }
    },

    // Authenticate user (Stateless check)
    authenticateAsync: async (promptMessage = 'Authenticate to continue') => {
        try {
            // We skip manual hardware/enrollment checks here to rely on the OS dialog
            // handling the "not available" states or falling back gracefully.
            const result = await SafeLocalAuthentication.authenticateAsync({
                promptMessage,
                fallbackLabel: 'Use Passcode',
                cancelLabel: 'Cancel',
                disableDeviceFallback: false,
            });
            return result;
        } catch (e) {
            console.error('Biometric auth failed', e);
            return { success: false, error: 'unknown_error' };
        }
    },

    // Enable Biometric Login
    // Requires User to Authenticate FIRST, then we save the Refresh Token securely
    enableBiometricLogin: async (refreshToken: string) => {
        // 1. Authenticate to prove ownership
        const authResult = await BiometricService.authenticateAsync('Authenticate to enable Touch/Face ID');

        if (!authResult.success) {
            return false;
        }

        // 2. Save Refresh Token Securely
        try {
            await SecureStore.setItemAsync(BIOMETRIC_TOKEN_KEY, refreshToken, {
                keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
                requireAuthentication: true, // Key requirement for Android strict mode
            });
            return true;
        } catch (e) {
            console.error('Failed to save biometric token', e);
            return false;
        }
    },

    // Disable Biometric Login
    disableBiometricLogin: async () => {
        try {
            await SecureStore.deleteItemAsync(BIOMETRIC_TOKEN_KEY);
            return true;
        } catch (e) {
            console.warn('Failed to delete biometric token', e);
            return false;
        }
    },

    // Unlock Session
    // Retrieves Refresh Token directly using SecureStore authentication
    unlockSessionWithBiometrics: async () => {
        try {
            // Retrieve Token (This triggers the system biometric prompt on Android)
            // We skip the separate authenticateAsync call to avoid double prompts
            const refreshToken = await SecureStore.getItemAsync(BIOMETRIC_TOKEN_KEY, {
                requireAuthentication: true,
                authenticationPrompt: 'Unlock Finoryx'
            });

            if (!refreshToken) {
                return { success: false, error: 'no_token_stored' };
            }

            return { success: true, token: refreshToken };

        } catch (e) {
            console.error('Biometric unlock failed', e);
            // Distinguish between cancel and other errors if possible, 
            // but for now return generic error which keeps overlay open
            return { success: false, error: 'storage_error' };
        }
    }
};
