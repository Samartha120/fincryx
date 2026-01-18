// Standard export for expo-camera logic
// This assumes expo-camera is correctly installed and linked.
// If running in Expo Go or Development Client, ensure the camera permission plugin is configured (it is).

import { CameraView as ExpoCameraView, useCameraPermissions as useExpoCameraPermissions, type CameraViewProps } from 'expo-camera';
import React from 'react';
import { Text, View } from 'react-native';

// Re-export hook
export const useCameraPermissions = useExpoCameraPermissions;

// Export CameraView safely? 
// We will export it directly. If it fails, it means the native module is legitimately missing.
// However, to keep the app from crashing entirely on import (rare in Expo), we export directly.
// The previous "require" strategy is good for optional modules but Camera is core here.

export const CameraView = ExpoCameraView;

// Helper to check availability (always true if installed, but permission is separate)
export const isCameraAvailable = true;

// If you really need a mock for web/simulator where camera might be missing:
/*
export const CameraView = (props: CameraViewProps) => {
    if (!ExpoCameraView) return <View><Text>Camera module missing</Text></View>;
    return <ExpoCameraView {...props} />;
}
*/
