import React from 'react';
import { Image, Text, View } from 'react-native';

type LogoProps = {
  size?: number;
  showText?: boolean;
};

export function Logo({ size = 64, showText = true }: LogoProps) {
  const textSize = size * 0.35;

  return (
    <View className="items-center">
      <Image
        source={require('@/assets/images/logo.jpg')}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        resizeMode="contain"
      />

      {showText && (
        <Text
          className="text-text-primary mt-sm font-bold"
          style={{ fontSize: textSize, letterSpacing: 1 }}
        >
          FINORYX
        </Text>
      )}
    </View>
  );
}
