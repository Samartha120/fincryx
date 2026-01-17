import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/src/components/ui/Avatar';
import { PrimaryButton } from '@/src/components/ui/PrimaryButton';
import { Screen } from '@/src/components/ui/Screen';
import { ScreenHeader } from '@/src/components/ui/ScreenHeader';

export default function QRScannerScreen() {
    const router = useRouter();
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [scannedData, setScannedData] = useState<string | null>(null);

    if (!permission) {
        // Camera permissions are still loading.
        return <View />;
    }

    if (!permission.granted) {
        return (
            <Screen edges={['top', 'left', 'right']} className="bg-background-subtle items-center justify-center p-md">
                <Text className="text-center text-text-primary text-lg font-bold mb-4">
                    We need your permission to show the camera
                </Text>
                <PrimaryButton onPress={requestPermission} title="Grant Permission" />
            </Screen>
        );
    }

    const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
        setScanned(true);
        setScannedData(data);
        // In a real app, you'd fetch user details here based on 'data'
    };

    return (
        <Screen edges={['top', 'left', 'right']} className="bg-black">
            <View className="absolute top-10 left-4 z-50">
                <ScreenHeader title="" onBack={() => router.back()} />
            </View>

            {!scanned ? (
                <View style={styles.container}>
                    <CameraView
                        style={StyleSheet.absoluteFillObject}
                        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                        barcodeScannerSettings={{
                            barcodeTypes: ["qr"],
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
                    <Text className="absolute bottom-20 self-center text-white text-base font-medium bg-black/50 px-4 py-2 rounded-full overflow-hidden">
                        Scan a Profile QR Code
                    </Text>
                </View>
            ) : (
                <View className="flex-1 items-center justify-center bg-background px-md">
                    <View className="bg-surface w-full p-6 rounded-3xl items-center shadow-lg border border-border/50">
                        <Avatar name="Scanned User" size="xl" />
                        <Text className="text-xl font-bold text-text-primary mt-4">Scanned User</Text>
                        <Text className="text-body text-text-secondary mb-6">{scannedData || 'ID: 12345'}</Text>

                        <View className="w-full gap-3">
                            <PrimaryButton
                                title="Send Money"
                                onPress={() => router.push('/(tabs)/transfer')}
                            />
                            <PrimaryButton
                                title="Scan Again"
                                variant="secondary"
                                onPress={() => {
                                    setScanned(false);
                                    setScannedData(null);
                                }}
                            />
                        </View>
                    </View>
                </View>
            )}
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
