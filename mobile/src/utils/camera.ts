// Safe wrapper for expo-camera
// This prevents the app from crashing if the native module is missing

import React from 'react';
import { View, Text } from 'react-native';

let CameraPackage: any = null;

try {
    CameraPackage = require('expo-camera');
} catch (error) {
    console.warn('expo-camera module not found or failed to load:', error);
}

// Mock CameraView component
// Using React.createElement to allow this file to remain .ts without JSX errors
const MockCameraView = (props: any) => {
    return React.createElement(View, {
        style: [{ backgroundColor: 'black', alignItems: 'center', justifyContent: 'center' }, props.style]
    },
        React.createElement(Text, { style: { color: 'white', padding: 20, textAlign: 'center' } },
            "Camera Not Available - Native Module Missing"
        )
    );
};

// Exports
export const CameraView = CameraPackage?.CameraView || MockCameraView;
export const useCameraPermissions = CameraPackage?.useCameraPermissions || (() => [
    { granted: false, status: 'denied', canAskAgain: false, expires: 'never' },
    async () => ({ granted: false, status: 'denied', canAskAgain: false, expires: 'never' })
]);
export const isCameraAvailable = !!CameraPackage;
