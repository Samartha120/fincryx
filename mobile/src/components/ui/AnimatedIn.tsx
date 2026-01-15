import React from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';

type Props = {
  children: React.ReactNode;
  delayMs?: number;
};

export function AnimatedIn({ children, delayMs = 0 }: Props) {
  return (
    <Animated.View entering={FadeInDown.duration(320).delay(delayMs)}>
      {children}
    </Animated.View>
  );
}
