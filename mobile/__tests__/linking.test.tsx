import * as Linking from 'expo-linking';

// Mock expo-linking to verify usage in tests
jest.mock('expo-linking', () => ({
  createURL: jest.fn((path) => `mobile://${path}`),
  openURL: jest.fn(),
  addEventListener: jest.fn(),
  getInitialURL: jest.fn(),
}));

describe('Linking Integration', () => {
  it('should have access to createURL', () => {
    const url = Linking.createURL('path/to/screen');
    expect(url).toBe('mobile://path/to/screen');
    expect(Linking.createURL).toHaveBeenCalledWith('path/to/screen');
  });

  it('should have access to openURL', async () => {
    expect(Linking.openURL).toBeDefined();
  });
});
