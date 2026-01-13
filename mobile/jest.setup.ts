import '@testing-library/jest-native/extend-expect';

// Prevent warnings from reanimated in Jest.
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

// SecureStore mock for Zustand persist.
const secureStore: Record<string, string | null> = {};

jest.mock('expo-secure-store', () => ({
  getItemAsync: async (key: string) => (key in secureStore ? secureStore[key] : null),
  setItemAsync: async (key: string, value: string) => {
    secureStore[key] = value;
  },
  deleteItemAsync: async (key: string) => {
    delete secureStore[key];
  },
}));

// Expo Router mock helpers used by screens.
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useSegments: () => [],
  Redirect: () => null,
  Link: ({ children }: any) => children,
  Stack: ({ children }: any) => children,
  Tabs: ({ children }: any) => children,
}));
