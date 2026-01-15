import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Defs, Path, Stop, LinearGradient as SvgLinearGradient } from 'react-native-svg';

type LogoProps = {
  size?: number;
  showText?: boolean;
};

export function Logo({ size = 64, showText = true }: LogoProps) {
  const textSize = size * 0.4;
  
  return (
    <View className="items-center">
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Defs>
            <SvgLinearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#4A80FF" stopOpacity="1" />
              <Stop offset="100%" stopColor="#2F6BFF" stopOpacity="1" />
            </SvgLinearGradient>
          </Defs>
          
          {/* Background Circle */}
          <Path
            d="M 50 5 A 45 45 0 1 1 49.99 5"
            fill="url(#grad1)"
          />
          
          {/* Letter F */}
          <Path
            d="M 35 30 L 65 30 L 65 38 L 45 38 L 45 46 L 60 46 L 60 54 L 45 54 L 45 70 L 35 70 Z"
            fill="#EAF0FF"
          />
        </Svg>
      </View>
      
      {showText && (
        <Text className="text-title text-text-primary mt-sm" style={{ fontSize: textSize }}>
          Finoryx
        </Text>
      )}
    </View>
  );
}
