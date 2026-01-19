import { BiometricService } from '@/src/services/biometric.service';
import { useAuthStore } from '@/src/store/useAuthStore';
import { usePreferencesStore } from '@/src/store/usePreferencesStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus, Dimensions, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function BiometricLockOverlay() {
    const { isLocked, setLocked, isAuthenticated, unlockWithBiometrics } = useAuthStore();
    const biometricEnabled = usePreferencesStore((s) => s.biometricEnabled);
    const appState = useRef(AppState.currentState);
    const insets = useSafeAreaInsets();

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
    useEffect(() => {
        if (isLocked) {
            handleUnlock();
        }
    }, [isLocked]);

    const handleUnlock = async () => {
        try {
            const success = await unlockWithBiometrics();
            if (success) {
                setLocked(false);
            }
        } catch (e) {
            console.error('Unlock failed', e);
        }
    };

    if (!isLocked) return null;

    return (
        <Animated.View
            entering={FadeIn}
            exiting={FadeOut}
            style={[styles.container, { paddingTop: insets.top }]}
        >
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <MaterialCommunityIcons name="shield-lock" size={64} color="#4F46E5" />
                </View>
                <Text style={styles.title}>App Locked</Text>
                <Text style={styles.subtitle}>Unlock securely to continue</Text>

                <Pressable onPress={handleUnlock} style={styles.button}>
                    <MaterialCommunityIcons name="fingerprint" size={24} color="#FFFFFF" />
                    <Text style={styles.buttonText}>Unlock with Biometrics</Text>
                </Pressable>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.98)', // Or use theme colors
        zIndex: 9999, // Ensure it covers everything
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
        padding: 20,
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
        marginBottom: 32,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4F46E5',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
    },
    buttonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        marginLeft: 8,
        fontSize: 16,
    },
});
