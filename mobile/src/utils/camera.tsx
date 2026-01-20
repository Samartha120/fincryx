// Safe wrapper for expo-camera
// This prevents the app from crashing if the native module is missing (e.g. in Expo Go without the proper SDK match or a stale Dev Client).

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

let CameraPackage: any = null;
let cameraError: any = null;

try {
    CameraPackage = require('expo-camera');
} catch (error) {
    // Silent catch to prevent console spam. 
    // The UI will show a helpful error message if the camera is needed.
    cameraError = error;
}

// Export a flag to let consumers know if the real camera is available
export const isCameraMock = !CameraPackage;
export const initializationError = cameraError;


// Mock CameraView component for fallback
const MockCameraView = (props: any) => {
    return (
        <View style={[styles.container, props.style]}>
            <Text style={styles.text}>
                Camera unavailable.{'\n'}Native module not found.
            </Text>
            <Text style={styles.subText}>
                If you are using a Development Build, please rebuild the app.
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
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subText: {
        color: '#ccc',
        textAlign: 'center',
        fontSize: 12,
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
