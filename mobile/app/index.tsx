import { Logo } from '@/src/components/ui/Logo';
import { useAuthStore } from '@/src/store/useAuthStore';
import { usePreferencesStore } from '@/src/store/usePreferencesStore';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function SplashScreen() {
  const { colorScheme } = useColorScheme();
  const spinnerColor = colorScheme === 'dark' ? '#6D8CFF' : '#1E40AF';
  const router = useRouter();
  const { isLoading, isAuthenticated, initialize, user } = useAuthStore();
  const { initialize: initPreferences } = usePreferencesStore();
  const [hasInitialized, setHasInitialized] = React.useState(false);

  useEffect(() => {
    const init = async () => {
      await Promise.all([initialize(), initPreferences()]);
      setHasInitialized(true);
    };
    init();
  }, []);

  useEffect(() => {
    if (!hasInitialized || isLoading) {
      console.log('Waiting for auth initialization...');
      return;
    }

    console.log('Auth state:', { isAuthenticated, userRole: user?.role });

    if (isAuthenticated && user) {
      // Redirect based on role
      console.log('Redirecting authenticated user, role:', user.role);
      if (user.role === 'admin') {
        router.replace('/(admin)');
      } else {
        router.replace('/(tabs)');
      }
    } else {
      console.log('Redirecting to login');
      router.replace('/(auth)/login');
    }
  }, [hasInitialized, isLoading, isAuthenticated, user, router]);

  return (
    <View className="flex-1 items-center justify-center bg-background">
      <View className="items-center gap-6">
        <Logo size={100} showText={true} />
        <ActivityIndicator color={spinnerColor} size="large" />
      </View>
    </View>
  );
}
