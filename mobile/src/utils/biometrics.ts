// Safe wrapper for expo-local-authentication
// This prevents the app from crashing if the native module is missing

let LocalAuthentication: any = null;

try {
    // Try to require the module
    LocalAuthentication = require('expo-local-authentication');
} catch (error) {
    console.warn('expo-local-authentication module not found or failed to load:', error);
}

const mockLocalAuthentication = {
    hasHardwareAsync: async () => false,
    isEnrolledAsync: async () => false,
    authenticateAsync: async () => ({ success: false, error: 'Module not found' }),
};

// Export the real module or the mock
export const SafeLocalAuthentication = LocalAuthentication || mockLocalAuthentication;

// Helper to check if it's actually available
export const isBiometricsAvailable = !!LocalAuthentication;
