import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { Text, View, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, Easing } from 'react-native-reanimated';

import { formatMoneyMinor } from '@/src/lib/money';

interface HeroCardProps {
    totalBalanceMinor: number;
    currency: string;
    accountType?: string;
    style?: ViewStyle;
}

export function HeroCard({ totalBalanceMinor, currency, accountType = 'Total Balance', style }: HeroCardProps) {
    return (
        <View style={style} className="shadow-xl shadow-blue-900/30 rounded-[40px]">
            <LinearGradient
                colors={['#1E40AF', '#3B82F6']} // Deep blue to lighter blue
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="rounded-[40px] p-8"
            >
                <Text className="text-blue-100 text-sm font-medium tracking-wide uppercase opacity-80">
                    {accountType}
                </Text>
                <Text className="text-white text-5xl font-bold mt-3 tracking-tight">
                    {formatMoneyMinor(totalBalanceMinor, currency)}
                </Text>
                <View className="flex-row items-center mt-8 bg-white/10 self-start px-4 py-1.5 rounded-full border border-white/20">
                    <View className="w-2 h-2 rounded-full bg-emerald-400 mr-2" />
                    <Text className="text-white text-xs font-medium">
                        Active Account
                    </Text>
                </View>
            </LinearGradient>
        </View>
    );
}
