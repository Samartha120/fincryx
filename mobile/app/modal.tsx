import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { View, Text } from 'react-native';

export default function ModalScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-background p-4">
      <Text className="text-xl font-bold text-text-primary mb-4">Modal</Text>

      <View className="h-[1px] w-[80%] bg-border-light my-8" />

      <Text className="text-body text-text-secondary text-center">
        This is a modal screen. It now uses the same dark mode theme as the rest of the app.
      </Text>

      {/* Use a light status bar on iOS to account for the black space above the modal */}
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </View>
  );
}
