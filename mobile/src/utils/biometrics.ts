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
    AuthenticationType: {
        FINGERPRINT: 1,
        FACIAL_RECOGNITION: 2,
    }
};

// Export the real module or the mock
export const SafeLocalAuthentication = LocalAuthentication || mockLocalAuthentication;

// Helper to check if it's actually available
export const isBiometricsAvailable = async () => {
    if (!LocalAuthentication) return false;
    try {
        return await LocalAuthentication.hasHardwareAsync();
    } catch (e) {
        return false;
    }
};
