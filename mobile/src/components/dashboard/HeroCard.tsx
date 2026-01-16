import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Text, View, ViewStyle } from 'react-native';

import { formatMoneyMinor } from '@/src/lib/money';

interface HeroCardProps {
    totalBalanceMinor: number;
    currency: string;
    accountType?: string;
    style?: ViewStyle;
}

export function HeroCard({ totalBalanceMinor, currency, accountType = 'Total Balance', style }: HeroCardProps) {
    return (
        <View style={style} className="shadow-lg shadow-blue-900/20">
            <LinearGradient
                colors={['#1E40AF', '#3B82F6']} // Deep blue to lighter blue
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="rounded-3xl p-6"
            >
                <Text className="text-blue-100 text-sm font-medium tracking-wide uppercase opacity-80">
                    {accountType}
                </Text>
                <Text className="text-white text-4xl font-bold mt-2 tracking-tight">
                    {formatMoneyMinor(totalBalanceMinor, currency)}
                </Text>
                <View className="flex-row items-center mt-6 bg-white/10 self-start px-3 py-1 rounded-full border border-white/20">
                    <Text className="text-white text-xs font-medium">
                        Active • {currency}
                    </Text>
                </View>
            </LinearGradient>
        </View>
    );
}
