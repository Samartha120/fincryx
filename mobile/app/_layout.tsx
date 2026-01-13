import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { useAuthStore } from '@/src/store/authStore';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  const hydrated = useAuthStore((s) => s.hydrated);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      if (hydrated) SplashScreen.hideAsync();
    }
  }, [loaded, hydrated]);

  if (!loaded || !hydrated) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  const router = useRouter();
  const segments = useSegments();
  const accessToken = useAuthStore((s) => s.accessToken);
  const role = useAuthStore((s) => s.role);
  const pendingEmail = useAuthStore((s) => s.pendingEmail);

  useEffect(() => {
    const group = segments[0];

    const inAuth = group === '(auth)';
    const inTabs = group === '(tabs)';
    const inAdmin = group === '(admin)';

    const isAuthed = Boolean(accessToken);

    // Allow OTP flow even before tokens are present.
    const otpAllowed = Boolean(pendingEmail);

    if (!isAuthed) {
      if (!inAuth) router.replace('/(auth)/login');
      // If we're in auth group, allow navigation (login/otp) to handle its own screens.
      if (inAuth && !otpAllowed && segments[1] === 'otp') router.replace('/(auth)/login');
      return;
    }

    if (role === 'admin') {
      if (!inAdmin) router.replace('/(admin)');
      return;
    }

    // Default: customer
    if (!inTabs) router.replace('/(tabs)');
  }, [accessToken, pendingEmail, role, router, segments]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(admin)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
