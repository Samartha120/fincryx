// Safe wrapper for expo-camera
// This prevents the app from crashing if the native module is missing (e.g. in Expo Go without the proper SDK match or a stale Dev Client).

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

let CameraPackage: any = null;

try {
    CameraPackage = require('expo-camera');
} catch (error) {
    console.warn('expo-camera module not found or failed to load:', error);
}

// Mock CameraView component for fallback
const MockCameraView = (props: any) => {
    return (
        <View style= { [styles.container, props.style]} >
        <Text style={ styles.text }>
            Camera unavailable.{ '\n' }Native module not found.
            </Text>
                </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    text: {
        color: 'white',
        textAlign: 'center',
    }
});

// Exports
export const CameraView = CameraPackage?.CameraView || MockCameraView;

// Safe permission hook
export const useCameraPermissions = CameraPackage?.useCameraPermissions || (() => [
    { granted: false, status: 'denied', canAskAgain: false, expires: 'never' },
    async () => ({ granted: false, status: 'denied', canAskAgain: false, expires: 'never' })
]);

export const isCameraAvailable = !!CameraPackage?.CameraView;
