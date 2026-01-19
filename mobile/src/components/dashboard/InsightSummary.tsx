import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';

import { formatMoneyMinor } from '@/src/lib/money';

interface InsightItem {
    label: string;
    value: string;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    icon: keyof typeof FontAwesome.glyphMap;
    color: string;
}

interface InsightSummaryProps {
    onSeeAllPress?: () => void;
    monthlySpend?: number;
    monthlySpendCurrency?: string;
    monthlyIncome?: number;
    loanStatus?: { paid: number; total: number; currency: string };
}

export function InsightSummary({ monthlySpend, monthlySpendCurrency = 'INR', monthlyIncome, loanStatus }: InsightSummaryProps) {
    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 4, gap: 12 }}
            className="flex-row"
        >
            {/* Monthly Spend Card */}
            <View className="rounded-3xl shadow-sm shadow-rose-500/20 overflow-hidden w-40 h-36">
                <LinearGradient
                    // User said "colourfull". Let's go bold but readable.
                    // Actually, let's try a bold gradient like the HeroCard but distinct colors.
                    colors={['#F43F5E', '#E11D48']} // Rose 500 -> 600
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="p-4 flex-1 justify-between"
                >
                    <View className="flex-row justify-between items-start">
                        <View className="bg-white/20 p-2 rounded-full">
                            <FontAwesome name="arrow-down" size={12} color="#fff" />
                        </View>
                        <Text className="text-[10px] text-white font-medium bg-white/20 px-2 py-0.5 rounded-full overflow-hidden">30d</Text>
                    </View>
                    <View>
                        <Text className="text-rose-100 text-xs font-medium mb-1">Monthly Spend</Text>
                        <Text className="text-white text-lg font-bold tracking-tight">
                            {monthlySpend ? formatMoneyMinor(monthlySpend, monthlySpendCurrency) : '—'}
                        </Text>
                    </View>
                </LinearGradient>
            </View>

            {/* Monthly Income Card */}
            <View className="rounded-3xl shadow-sm shadow-emerald-500/20 overflow-hidden w-40 h-36">
                <LinearGradient
                    colors={['#10B981', '#059669']} // Emerald 500 -> 600
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="p-4 flex-1 justify-between"
                >
                    <View className="flex-row justify-between items-start">
                        <View className="bg-white/20 p-2 rounded-full">
                            <FontAwesome name="arrow-up" size={12} color="#fff" />
                        </View>
                        <Text className="text-[10px] text-white font-medium bg-white/20 px-2 py-0.5 rounded-full overflow-hidden">30d</Text>
                    </View>
                    <View>
                        <Text className="text-emerald-100 text-xs font-medium mb-1">Monthly Income</Text>
                        <Text className="text-white text-lg font-bold tracking-tight">
                            {monthlyIncome ? formatMoneyMinor(monthlyIncome, monthlySpendCurrency) : formatMoneyMinor(0, monthlySpendCurrency)}
                        </Text>
                    </View>
                </LinearGradient>
            </View>

            {/* Loan Status Card */}
            <View className="rounded-3xl shadow-sm shadow-blue-500/20 overflow-hidden w-40 h-36">
                <LinearGradient
                    colors={['#3B82F6', '#2563EB']} // Blue 500 -> 600
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="p-4 flex-1 justify-between"
                >
                    <View className="flex-row justify-between items-start">
                        <View className="bg-white/20 p-2 rounded-full">
                            <FontAwesome name="pie-chart" size={12} color="#fff" />
                        </View>
                    </View>
                    <View>
                        <Text className="text-blue-100 text-xs font-medium mb-1">Loans Paid</Text>
                        <Text className="text-white text-lg font-bold tracking-tight">
                            {loanStatus ? `${Math.round((loanStatus.paid / Math.max(1, loanStatus.total)) * 100)}%` : '0%'}
                        </Text>
                    </View>
                </LinearGradient>
            </View>
        </ScrollView>
    );
}
