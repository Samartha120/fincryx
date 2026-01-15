import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme as useNWColorScheme } from 'nativewind';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../global.css';

import { useColorScheme } from '@/components/useColorScheme';
import { usePreferencesStore } from '@/src/store/usePreferencesStore';
import { configureNotifications } from '@/src/lib/pushNotifications';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Custom Themes to match global.css
const CustomDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#3B82F6',
    background: '#0B1020',
    card: '#111A33',
    text: '#EAF0FF',
    border: '#273353',
    notification: '#DC2626',
  },
};

const CustomDefaultTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#1E40AF',
    background: '#F9FAFB',
    card: '#FFFFFF',
    text: '#111827',
    border: '#E5E7EB',
    notification: '#DC2626',
  },
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    void usePreferencesStore.getState().initialize();
  }, []);

  useEffect(() => {
    configureNotifications();
  }, []);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const systemScheme = useColorScheme();
  const themePref = usePreferencesStore((s) => s.theme);
  const { setColorScheme } = useNWColorScheme();

  useEffect(() => {
    // Keep NativeWind's color scheme in sync so dark variants + tokens can respond.
    void setColorScheme(themePref);
  }, [setColorScheme, themePref]);

  const effectiveScheme = themePref === 'system' ? systemScheme : themePref;

  return (
    <SafeAreaProvider>
      <ThemeProvider value={effectiveScheme === 'dark' ? CustomDarkTheme : CustomDefaultTheme}>
        <StatusBar style={effectiveScheme === 'dark' ? 'light' : 'dark'} key={effectiveScheme} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(admin)" />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        </Stack>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
