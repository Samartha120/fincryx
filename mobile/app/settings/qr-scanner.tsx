import { CameraView, useCameraPermissions, isCameraMock, initializationError } from '@/src/utils/camera';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/src/components/ui/Avatar';
import { PrimaryButton } from '@/src/components/ui/PrimaryButton';
import { Screen } from '@/src/components/ui/Screen';
import { ScreenHeader } from '@/src/components/ui/ScreenHeader';
import { useAuthStore } from '@/src/store/useAuthStore';

export default function QRScannerScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);

    // Explicitly handle loading state for permissions
    const isLoadingPermission = !permission;

    const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
        if (scanned) return;
        setScanned(true);
        // Navigate to the PUBLIC profile of the scanned user ID
        router.push(`/user/${data}` as any);
    };

    // Handle missing native module (Mock Mode)
    if (isCameraMock) {
        return (
            <Screen edges={['top', 'left', 'right']} className="bg-background items-center justify-center p-md">
                <View className="absolute top-10 left-4 z-50">
                    <ScreenHeader title="" onBack={() => router.back()} />
                </View>
                <View className="items-center justify-center gap-4">
                    <Text className="text-5xl">⚠️</Text>
                    <Text className="text-center text-text-primary text-heading font-bold">
                        Camera Unavailable
                    </Text>
                    <Text className="text-center text-text-secondary">
                        The native camera module could not be loaded. This text confirms the 'Mock' fallback is active.
                    </Text>
                    <View className="bg-error/10 p-3 rounded-lg w-full">
                        <Text className="text-error font-mono text-xs text-center">
                            Error: {initializationError?.message || String(initializationError)}
                        </Text>
                    </View>
                    <Text className="text-center text-text-secondary text-caption bg-surface p-2 rounded border border-border">
                        Possible cause: Expo Go version mismatch or missing Development Build.
                    </Text>

                    <View className="w-full gap-3 mt-4">
                        <PrimaryButton
                            title="Simulate Scan (Jane Doe)"
                            onPress={() => handleBarCodeScanned({ type: 'qr', data: 'Simulated User ID' })}
                        />
                        <PrimaryButton
                            variant="secondary"
                            onPress={() => router.back()}
                            title="Go Back"
                        />
                    </View>
                </View>
            </Screen>
        );
    }



    if (isLoadingPermission) {
        return (
            <Screen edges={['top', 'left', 'right']} className="items-center justify-center">
                <Text className="text-text-secondary">Requesting camera permission...</Text>
            </Screen>
        );
    }

    if (!permission.granted) {
        return (
            <Screen edges={['top', 'left', 'right']} className="bg-background items-center justify-center p-md">
                <Text className="text-center text-text-primary text-heading font-bold mb-2">
                    Camera Access Needed
                </Text>
                <Text className="text-center text-text-secondary mb-6">
                    To scan QR codes and verify your profile, please allow camera access.
                </Text>
                <PrimaryButton onPress={requestPermission} title="Grant Permission" />
                <View className="mt-4">
                    <PrimaryButton variant="secondary" onPress={() => router.back()} title="Cancel" />
                </View>
            </Screen>
        );
    }

    return (
        <Screen edges={['top', 'left', 'right']} className="bg-black">
            <View className="absolute top-10 left-4 z-50">
                <ScreenHeader title="" onBack={() => router.back()} />
            </View>

            <View style={styles.container}>
                <CameraView
                    style={StyleSheet.absoluteFillObject}
                    onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                    barcodeScannerSettings={{
                        barcodeTypes: ['qr'],
                    }}
                />
                <View style={styles.overlay}>
                    <View style={styles.unfocusedContainer}></View>
                    <View style={styles.middleContainer}>
                        <View style={styles.unfocusedContainer}></View>
                        <View style={styles.focusedContainer}></View>
                        <View style={styles.unfocusedContainer}></View>
                    </View>
                    <View style={styles.unfocusedContainer}></View>
                </View>

                <View className="absolute bottom-10 left-4 right-4 items-center">
                    <View className="bg-surface/90 backdrop-blur-md p-4 rounded-2xl flex-row items-center border border-white/20 shadow-lg w-full max-w-sm">
                        <Avatar name={user?.fullName || user?.email || 'User'} size="lg" />
                        <View className="ml-4 flex-1">
                            <Text className="text-lg font-bold text-text-primary mb-0.5" numberOfLines={1}>
                                {user?.fullName || 'User'}
                            </Text>
                            <Text className="text-body text-text-secondary mb-1" numberOfLines={1}>
                                {user?.email || 'email@example.com'}
                            </Text>
                            <View className="flex-row">
                                <View className="bg-primary/20 px-2 py-0.5 rounded-md">
                                    <Text className="text-xs font-semibold text-primary uppercase">
                                        {user?.role || 'Member'}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                    <Text className="text-white/80 text-sm mt-4 font-medium shadow-black shadow-md">
                        Align QR code within the frame to scan
                    </Text>
                </View>
            </View>
        </Screen>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    unfocusedContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    middleContainer: {
        flexDirection: 'row',
        flex: 1.5,
    },
    focusedContainer: {
        flex: 10,
    },
});
