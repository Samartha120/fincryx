import '@testing-library/jest-native/extend-expect';

// Prevent warnings from reanimated in Jest.
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

// SVG is used by victory-native charts.
jest.mock('react-native-svg', () => require('react-native-svg-mock'));

// AsyncStorage mock for AuthContext.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

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

// Haptics should not run in Jest.
jest.mock('expo-haptics', () => ({
  selectionAsync: async () => {},
  impactAsync: async () => {},
  notificationAsync: async () => {},
}));

// Keep vector icons from causing setState/act warnings in tests.
jest.mock('@expo/vector-icons/Ionicons', () => {
  const React = require('react');
  return function MockIonicons() {
    return React.createElement('Text', null, '');
  };
});

jest.mock('expo-linear-gradient', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    LinearGradient: ({ children, ...props }: any) => React.createElement(View, props, children),
  };
});
