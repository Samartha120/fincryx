import { NavigationContext } from '@react-navigation/native';
import React, { useCallback, useContext, useEffect } from 'react';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withTiming,
} from 'react-native-reanimated';

type Props = {
  children: React.ReactNode;
  enabled?: boolean;
  durationMs?: number;
  delayMs?: number;
  offsetY?: number;
};

export function ScreenTransition({
  children,
  enabled = true,
  durationMs = 220,
  delayMs = 0,
  offsetY = 8,
}: Props) {
  const navigation = useContext(NavigationContext);
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);

  const run = useCallback(() => {
    if (!enabled) {
      opacity.value = 1;
      translateY.value = 0;
      return;
    }

    opacity.value = 0;
    translateY.value = offsetY;

    opacity.value = withDelay(
      delayMs,
      withTiming(1, { duration: durationMs, easing: Easing.out(Easing.cubic) }),
    );
    translateY.value = withDelay(
      delayMs,
      withTiming(0, { duration: durationMs, easing: Easing.out(Easing.cubic) }),
    );
  }, [delayMs, durationMs, enabled, offsetY, opacity, translateY]);

  // Always animate on mount (works in tests where no Navigation provider exists).
  useEffect(() => {
    run();
  }, [run]);

  // Re-animate on focus when inside a navigator.
  useEffect(() => {
    if (!enabled) return;
    const addListener = (navigation as any)?.addListener as undefined | ((event: string, cb: () => void) => () => void);
    if (typeof addListener !== 'function') return;

    const unsubscribe = addListener('focus', run);
    return unsubscribe;
  }, [enabled, navigation, run]);

  const style = useAnimatedStyle(() => {
    'worklet';
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });

  return <Animated.View style={[{ flex: 1 }, style]}>{children}</Animated.View>;
}
