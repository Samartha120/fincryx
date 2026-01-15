import { useColorScheme } from 'nativewind';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, Text, View, type ViewProps } from 'react-native';

import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

import { cn } from '@/src/lib/cn';

export type SegmentedOption<T extends string> = {
  label: string;
  value: T;
  testID?: string;
  disabled?: boolean;
};

type SegmentItemProps<T extends string> = {
  option: SegmentedOption<T>;
  selected: boolean;
  disabled: boolean;
  canAnimate: boolean;
  isCompact: boolean;
  paddingClass: string;
  textClass: string;
  marginLeft: number;
  flex: number | undefined;
  onPress: () => void;
};

function SegmentItem<T extends string>({
  option,
  selected,
  disabled,
  canAnimate,
  isCompact,
  paddingClass,
  textClass,
  marginLeft,
  flex,
  onPress,
}: SegmentItemProps<T>) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (toValue: number) => {
    Animated.spring(scale, {
      toValue,
      useNativeDriver: true,
      stiffness: 260,
      damping: 22,
      mass: 0.35,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }], marginLeft, flex }}>
      <Pressable
        testID={option.testID}
        accessibilityRole="button"
        accessibilityState={{ selected, disabled }}
        disabled={disabled}
        onPress={onPress}
        onPressIn={() => {
          if (disabled) return;
          animateTo(0.97);
        }}
        onPressOut={() => {
          if (disabled) return;
          animateTo(1);
        }}
        className={cn(
          'rounded-full items-center justify-center border border-transparent',
          paddingClass,
          canAnimate
            ? 'bg-transparent'
            : selected
              ? 'bg-primary shadow-sm border-primary/25'
              : 'bg-transparent',
          disabled ? 'opacity-50' : 'active:opacity-80',
        )}
      >
        <Text className={cn(textClass, 'font-semibold', selected ? 'text-white' : 'text-text-secondary')} numberOfLines={1}>
          {option.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

type Size = 'sm' | 'md';

type Props<T extends string> = ViewProps & {
  options: ReadonlyArray<SegmentedOption<T>>;
  value: T;
  onChange: (value: T) => void;
  size?: Size;
  haptics?: boolean;
  animated?: boolean;
  className?: string;
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
  haptics = true,
  animated = true,
  className,
  ...props
}: Props<T>) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const isCompact = options.length <= 4;

  const selectedIndex = useMemo(() => {
    const idx = options.findIndex((o) => o.value === value);
    return idx < 0 ? 0 : idx;
  }, [options, value]);

  const [containerWidth, setContainerWidth] = useState(0);
  const animX = useRef(new Animated.Value(0)).current;

  const padding = size === 'sm' ? 'px-3 py-2' : 'px-4 py-2.5';
  const text = size === 'sm' ? 'text-caption' : 'text-label';

  const Container: React.ComponentType<any> = options.length > 4 ? ScrollView : View;
  const containerProps =
    options.length > 4
      ? {
          horizontal: true,
          showsHorizontalScrollIndicator: false,
          contentContainerClassName: 'flex-row',
        }
      : {};

  const canAnimate = animated && isCompact && containerWidth > 0;
  const segmentWidth = canAnimate ? (containerWidth - 2) / options.length : 0; // subtract container padding border-ish

  useEffect(() => {
    if (!canAnimate) return;

    Animated.spring(animX, {
      toValue: selectedIndex * segmentWidth,
      useNativeDriver: true,
      stiffness: 220,
      damping: 26,
      mass: 0.7,
    }).start();
  }, [animX, canAnimate, segmentWidth, selectedIndex]);

  return (
    <View
      className={cn('rounded-full border border-border bg-surface p-1', className)}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
      {...props}
    >
      {canAnimate ? (
        <Animated.View
          pointerEvents="none"
          className="absolute left-1 top-1 bottom-1 rounded-full overflow-hidden shadow-sm border border-primary/25"
          style={{ width: segmentWidth, transform: [{ translateX: animX }] }}
        >
          <LinearGradient
            colors={isDark ? ['#2F5BFF', '#6D8CFF'] : ['#1E40AF', '#2563EB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: 1 }}
          />

          {/* glossy highlight */}
          <LinearGradient
            colors={['rgba(255,255,255,0.35)', 'rgba(255,255,255,0.0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}
          />

          {/* inner stroke */}
          <View className="absolute inset-0 rounded-full border border-white/15" />
        </Animated.View>
      ) : null}

      <Container {...containerProps}>
        {options.map((opt, idx) => {
          const selected = opt.value === value;
          const disabled = Boolean(opt.disabled);

          return (
            <SegmentItem
              key={opt.value}
              option={opt}
              selected={selected}
              disabled={disabled}
              canAnimate={canAnimate}
              isCompact={isCompact}
              paddingClass={padding}
              textClass={text}
              marginLeft={idx > 0 ? 4 : 0}
              flex={isCompact ? 1 : undefined}
              onPress={() => {
                if (haptics) {
                  void Haptics.selectionAsync();
                }
                onChange(opt.value);
              }}
            />
          );
        })}
      </Container>
    </View>
  );
}
