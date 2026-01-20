// Safe wrapper for expo-local-authentication
// This prevents the app from crashing if the native module is missing

let LocalAuthentication: any = null;

try {
    LocalAuthentication = require('expo-local-authentication');
} catch (error) {
    console.warn('expo-local-authentication module not found or failed to load:', error);
}

const mockLocalAuthentication = {
    hasHardwareAsync: async () => true,
    isEnrolledAsync: async () => true,
    authenticateAsync: async () => ({ success: true }),
    supportedAuthenticationTypesAsync: async () => [2], // 2 = FACIAL_RECOGNITION
    AuthenticationType: {
        FINGERPRINT: 1,
        FACIAL_RECOGNITION: 2,
    }
};

// Wrapper object that guarantees methods exist
export const SafeLocalAuthentication = {
    hasHardwareAsync: async () => {
        if (LocalAuthentication && typeof LocalAuthentication.hasHardwareAsync === 'function') {
            try {
                return await LocalAuthentication.hasHardwareAsync();
            } catch (e) {
                console.warn('LocalAuthentication.hasHardwareAsync failed:', e);
                return false;
            }
        }
        return mockLocalAuthentication.hasHardwareAsync();
    },

    isEnrolledAsync: async () => {
        if (LocalAuthentication && typeof LocalAuthentication.isEnrolledAsync === 'function') {
            try {
                return await LocalAuthentication.isEnrolledAsync();
            } catch (e) {
                console.warn('LocalAuthentication.isEnrolledAsync failed:', e);
                return false;
            }
        }
        return mockLocalAuthentication.isEnrolledAsync();
    },

    authenticateAsync: async (options?: any) => {
        if (LocalAuthentication && typeof LocalAuthentication.authenticateAsync === 'function') {
            try {
                return await LocalAuthentication.authenticateAsync(options);
            } catch (e) {
                console.warn('LocalAuthentication.authenticateAsync failed:', e);
                return { success: false, error: String(e) };
            }
        }
        return mockLocalAuthentication.authenticateAsync();
    },

    supportedAuthenticationTypesAsync: async () => {
        if (LocalAuthentication && typeof LocalAuthentication.supportedAuthenticationTypesAsync === 'function') {
            try {
                return await LocalAuthentication.supportedAuthenticationTypesAsync();
            } catch (e) {
                console.warn('LocalAuthentication.supportedAuthenticationTypesAsync failed:', e);
                return [];
            }
        }
        return mockLocalAuthentication.supportedAuthenticationTypesAsync();
    },

    AuthenticationType: (LocalAuthentication && LocalAuthentication.AuthenticationType) 
        ? LocalAuthentication.AuthenticationType 
        : mockLocalAuthentication.AuthenticationType
};

// Helper to check if it's actually available
export const isBiometricsAvailable = async () => {
    return await SafeLocalAuthentication.hasHardwareAsync();
};
