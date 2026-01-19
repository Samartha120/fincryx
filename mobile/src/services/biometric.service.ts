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
            const hasHardware = await SafeLocalAuthentication.hasHardwareAsync();
            if (!hasHardware) return { success: false, error: 'hardware_unavailable' };

            const isEnrolled = await SafeLocalAuthentication.isEnrolledAsync();
            if (!isEnrolled) return { success: false, error: 'not_enrolled' };

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
    // Authenticates user -> Retrieves Refresh Token -> Returns it for auto-login
    unlockSessionWithBiometrics: async () => {
        try {
            // Check if we even have a token stored
            const hasToken = await SecureStore.getItemAsync(BIOMETRIC_TOKEN_KEY);
            if (!hasToken) {
                return { success: false, error: 'no_token_stored' };
            }

            // Authenticate
            const authResult = await BiometricService.authenticateAsync('Unlock Finoryx');
            if (!authResult.success) {
                return authResult;
            }

            // Retrieve Token (The strict `requireAuthentication` in setItem ensures system handling)
            // On Android, simply retrieving it after auth should work if checking access control.
            // But expo-secure-store handled the auth prompt above mostly for UI flow.
            // If we used `requireAuthentication: true` in setItem, getItemAsync might prompt AGAIN on some versions
            // if we didn't use `authenticateAsync` above. 
            // However, to be safe and consistent with UX:
            // We use the `authenticateAsync` for the UI feedback, and `getItemAsync` to actually get data.

            const refreshToken = await SecureStore.getItemAsync(BIOMETRIC_TOKEN_KEY, {
                requireAuthentication: true // Ensures system level protection
            });

            return { success: true, token: refreshToken };

        } catch (e) {
            console.error('Biometric unlock failed', e);
            return { success: false, error: 'storage_error' };
        }
    }
};
