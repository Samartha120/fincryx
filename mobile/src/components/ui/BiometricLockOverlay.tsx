import { BiometricService } from '@/src/services/biometric.service';
import { useAuthStore } from '@/src/store/useAuthStore';
import { usePreferencesStore } from '@/src/store/usePreferencesStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';

export function BiometricLockOverlay() {
    const { isLocked, setLocked, isAuthenticated, unlockWithBiometrics, logoutUser } = useAuthStore();
    const biometricEnabled = usePreferencesStore((s) => s.biometricEnabled);
    const router = useRouter();
    const appState = useRef(AppState.currentState);
    const insets = useSafeAreaInsets();
    const [biometricType, setBiometricType] = useState('Biometrics');
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';

    useEffect(() => {
        BiometricService.getBiometricTypeAsync()
            .then(setBiometricType)
            .catch((error) => {
                console.warn('Failed to get biometric type:', error);
                setBiometricType('Biometrics');
            });
    }, []);

    // 1. Listen to AppState to auto-lock
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState) => {
            if (
                appState.current.match(/active/) &&
                nextAppState.match(/inactive|background/)
            ) {
                // App going to background -> LOCK if logged in & bio enabled
                if (isAuthenticated && biometricEnabled) {
                    setLocked(true);
                }
            }

            // App coming to foreground -> Try to Unlock automatically if locked
            if (
                appState.current.match(/inactive|background/) &&
                nextAppState === 'active'
            ) {
                if (isAuthenticated && biometricEnabled) {
                    // We can trigger an unlock attempt here
                    // But usually the overlay being present is enough to trigger the prompt
                    // via the other useEffect below.
                }
            }

            appState.current = nextAppState;
        });

        return () => {
            subscription.remove();
        };
    }, [isAuthenticated, biometricEnabled, setLocked]);


    // 2. Trigger Biometric Prompt when Locked
    const [hasTriedUnlock, setHasTriedUnlock] = useState(false);
    const [isAuthenticating, setIsAuthenticating] = useState(false);

    const handleUnlock = useCallback(async () => {
        // Prevent concurrent authentication attempts
        if (isAuthenticating) {
            console.log('Authentication already in progress, skipping');
            return;
        }

        try {
            setIsAuthenticating(true);
            const success = await unlockWithBiometrics();
            if (success) {
                setLocked(false);
            } else {
                // Reset so user can try again
                setHasTriedUnlock(false);
            }
        } catch (e) {
            console.error('Unlock failed', e);
            // Reset so user can try again
            setHasTriedUnlock(false);
        } finally {
            setIsAuthenticating(false);
        }
    }, [unlockWithBiometrics, setLocked, isAuthenticating]);

    useEffect(() => {
        if (isLocked && !hasTriedUnlock && !isAuthenticating) {
            setHasTriedUnlock(true);
            void handleUnlock();
        }

        // Reset when unlocked
        if (!isLocked) {
            setHasTriedUnlock(false);
            setIsAuthenticating(false);
        }
    }, [isLocked, hasTriedUnlock, isAuthenticating, handleUnlock]);

    const handleLogout = async () => {
        setLocked(false);
        await logoutUser();
        router.replace('/(auth)/login');
    };

    if (!isLocked) return null;

    // Theme-aware colors
    const colors = {
        background: isDark ? 'rgba(11, 16, 32, 0.98)' : 'rgba(249, 250, 251, 0.98)',
        iconBg: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(79, 70, 229, 0.1)',
        icon: isDark ? '#6D8CFF' : '#4F46E5',
        title: isDark ? '#EAF0FF' : '#111827',
        subtitle: isDark ? '#B0BFE4' : '#6B7280',
        button: isDark ? '#3B82F6' : '#4F46E5',
        buttonText: '#FFFFFF',
        secondaryBorder: isDark ? '#273353' : '#E5E7EB',
        secondaryText: isDark ? '#B0BFE4' : '#6B7280',
    };

    return (
        <View
            style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}
        >
            <View style={styles.content}>
                <View style={[styles.iconContainer, { backgroundColor: colors.iconBg }]}>
                    <MaterialCommunityIcons name="shield-lock" size={64} color={colors.icon} />
                </View>
                <Text style={[styles.title, { color: colors.title }]}>App Locked</Text>
                <Text style={[styles.subtitle, { color: colors.subtitle }]}>Unlock securely to continue</Text>

                <Pressable onPress={handleUnlock} style={[styles.button, { backgroundColor: colors.button }]}>
                    <MaterialCommunityIcons
                        name={biometricType === 'Face ID' ? 'face-recognition' : 'fingerprint'}
                        size={24}
                        color={colors.buttonText}
                    />
                    <Text style={[styles.buttonText, { color: colors.buttonText }]}>Unlock with {biometricType}</Text>
                </Pressable>

                <Pressable onPress={handleLogout} style={[styles.button, styles.secondaryButton, { borderColor: colors.secondaryBorder }]}>
                    <Text style={[styles.buttonText, styles.secondaryButtonText, { color: colors.secondaryText }]}>Log Out</Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 9999,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        width: '80%',
        alignItems: 'center',
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        marginBottom: 32,
    },
    button: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        width: '100%',
        justifyContent: 'center',
        gap: 8,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        marginTop: 12,
    },
    secondaryButtonText: {
        fontWeight: '600',
    },
});
