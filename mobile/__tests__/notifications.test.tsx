
import { registerForPushNotifications } from '@/src/lib/pushNotifications';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { registerPushToken } from '@/src/api/pushApi';

// Mock dependencies
jest.mock('expo-notifications');
jest.mock('expo-constants', () => ({
  isDevice: true,
  appOwnership: 'standalone',
  expoConfig: {
    extra: {
      eas: {
        projectId: 'test-project-id',
      },
    },
  },
}));
jest.mock('@/src/api/pushApi');

describe('Notifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registerForPushNotifications gets token and registers it if permission granted', async () => {
    // Mock permissions granted
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({ data: 'test-push-token' });
    
    await registerForPushNotifications();

    expect(Notifications.getExpoPushTokenAsync).toHaveBeenCalledWith({ projectId: 'test-project-id' });
    expect(registerPushToken).toHaveBeenCalledWith('test-push-token');
  });

  it('registerForPushNotifications requests permission if not initially granted', async () => {
    // Mock initially denied, then granted
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'undetermined' });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({ data: 'test-push-token' });

    await registerForPushNotifications();

    expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
    expect(registerPushToken).toHaveBeenCalledWith('test-push-token');
  });

  it('registerForPushNotifications does nothing if permission denied', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });

    await registerForPushNotifications();

    expect(Notifications.getExpoPushTokenAsync).not.toHaveBeenCalled();
    expect(registerPushToken).not.toHaveBeenCalled();
  });
});
