// Standard export for expo-local-authentication
import * as LocalAuthentication from 'expo-local-authentication';

export const SafeLocalAuthentication = LocalAuthentication;

export const isBiometricsAvailable = async () => {
    try {
        return await LocalAuthentication.hasHardwareAsync();
    } catch (e) {
        console.warn('Biometrics check failed:', e);
        return false;
    }
};
