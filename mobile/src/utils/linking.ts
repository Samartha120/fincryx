/**
 * Safe wrapper for expo-linking
 * Provides fallback implementations when the native module is not available
 */

let Linking: any;
let isLinkingAvailable = false;

try {
    Linking = require('expo-linking');
    isLinkingAvailable = true;
} catch (error) {
    console.warn('expo-linking native module not available, using fallback');
    // Provide mock implementations
    Linking = {
        createURL: (path: string) => `exp://mock/${path}`,
        parse: (url: string) => ({ path: url, queryParams: {} }),
        openURL: async (url: string) => {
            console.warn('Linking.openURL called but native module unavailable:', url);
        },
        canOpenURL: async (url: string) => false,
        addEventListener: () => ({ remove: () => { } }),
        removeEventListener: () => { },
        getInitialURL: async () => null,
        useURL: () => null,
    };
}

export const SafeLinking = Linking;
export { isLinkingAvailable };
export default SafeLinking;
