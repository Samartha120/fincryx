import * as Notifications from 'expo-notifications';
import { Platform, Linking } from 'react-native';

// Configure notification handler
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

// Define channel IDs
export const CHANNELS = {
    DEFAULT: 'default',
    TRANSACTIONS: 'transactions',
    SECURITY: 'security',
    LOANS: 'loans',
};

/**
 * Checks current permission status WITHOUT requesting it.
 * Safe to call on app launch.
 */
export async function checkNotificationPermissions(): Promise<Notifications.PermissionStatus> {
    const { status } = await Notifications.getPermissionsAsync();
    return status;
}

/**
 * Requests permissions. Should ONLY be called after user interaction (e.g. clicking "Enable Notifications").
 */
export async function requestNotificationPermissions(): Promise<boolean> {
    const { status } = await Notifications.requestPermissionsAsync();

    if (status !== 'granted') {
        return false;
    }

    // specific android channel setup
    if (Platform.OS === 'android') {
        await setupAndroidChannels();
    }

    return true;
}

/**
 * Opens system settings if permission is permanently denied
 */
export async function openSystemSettings() {
    await Linking.openSettings();
}

/**
 * Schedule a local notification
 */
export async function scheduleLocalNotification(
    title: string,
    body: string,
    channelId: string = CHANNELS.DEFAULT,
    data = {}
) {
    // Double check permission before trying to send
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;

    await Notifications.scheduleNotificationAsync({
        content: {
            title,
            body,
            data,
            sound: 'default',
        },
        trigger: {
            channelId: Platform.OS === 'android' ? channelId : undefined,
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: 1, // show immediately (after minimal delay)
        },
    });
}

/**
 * Setup Android Channels
 */
async function setupAndroidChannels() {
    if (Platform.OS !== 'android') return;

    await Notifications.setNotificationChannelAsync(CHANNELS.DEFAULT, {
        name: 'General',
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: 'default',
    });

    await Notifications.setNotificationChannelAsync(CHANNELS.TRANSACTIONS, {
        name: 'Transactions',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        enableVibrate: true,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
    });

    await Notifications.setNotificationChannelAsync(CHANNELS.SECURITY, {
        name: 'Security Alerts',
        importance: Notifications.AndroidImportance.MAX,
        sound: 'default', // could be a custom alert sound if added to project
        enableVibrate: true,
        vibrationPattern: [0, 500, 200, 500],
        lightColor: '#FF0000',
    });

    await Notifications.setNotificationChannelAsync(CHANNELS.LOANS, {
        name: 'Loan Updates',
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: 'default',
    });
}
