import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { registerPushToken } from '@/src/api/pushApi';

export async function configureNotifications(): Promise<void> {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.HIGH,
      });
    }
  } catch (error) {
    console.warn('Failed to configure notifications:', error);
    // App continues functioning even if notifications fail
  }
}

export async function registerForPushNotifications(): Promise<void> {
  try {
    if (!Constants.isDevice) {
      return;
    }

    if (Constants.appOwnership === 'expo') {
      return;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return;
    }

    const projectId = (Constants.expoConfig as any)?.extra?.eas?.projectId
      ?? (Constants.easConfig as any)?.projectId;
    const token = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    if (token?.data) {
      await registerPushToken(token.data);
    }
  } catch (error) {
    console.warn('Failed to register for push notifications:', error);
    // App continues functioning even if push registration fails
  }
}
