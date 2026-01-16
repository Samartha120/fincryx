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
    loanStatus?: { paid: number; total: number; currency: string };
}

export function InsightSummary({ monthlySpend, monthlySpendCurrency = 'INR', loanStatus }: InsightSummaryProps) {
    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 4, gap: 12 }}
            className="flex-row"
        >
            {/* Monthly Spend Card */}
            <View className="bg-white p-4 rounded-2xl w-40 shadow-sm border border-neutral-100">
                <View className="flex-row justify-between items-start mb-2">
                    <View className="bg-red-50 p-2 rounded-full">
                        <FontAwesome name="arrow-down" size={14} color="#EF4444" />
                    </View>
                    <Text className="text-xs text-text-secondary font-medium bg-neutral-50 px-2 py-0.5 rounded-full">30d</Text>
                </View>
                <Text className="text-text-secondary text-xs mb-1">Monthly Spend</Text>
                <Text className="text-text-primary text-lg font-bold">
                    {monthlySpend ? formatMoneyMinor(monthlySpend, monthlySpendCurrency) : '—'}
                </Text>
            </View>

            {/* Loan Status Card */}
            <View className="bg-white p-4 rounded-2xl w-40 shadow-sm border border-neutral-100">
                <View className="flex-row justify-between items-start mb-2">
                    <View className="bg-emerald-50 p-2 rounded-full">
                        <FontAwesome name="check" size={14} color="#10B981" />
                    </View>
                </View>
                <Text className="text-text-secondary text-xs mb-1">Loans Paid</Text>
                <Text className="text-text-primary text-lg font-bold">
                    {loanStatus ? `${Math.round((loanStatus.paid / Math.max(1, loanStatus.total)) * 100)}%` : '0%'}
                </Text>
            </View>

            {/* Savings/Income Mock Card (To fill space and look good) */}
            <View className="bg-white p-4 rounded-2xl w-40 shadow-sm border border-neutral-100">
                <View className="flex-row justify-between items-start mb-2">
                    <View className="bg-blue-50 p-2 rounded-full">
                        <FontAwesome name="line-chart" size={14} color="#3B82F6" />
                    </View>
                </View>
                <Text className="text-text-secondary text-xs mb-1">Income Trend</Text>
                <Text className="text-text-primary text-lg font-bold">
                    +12%
                </Text>
            </View>
        </ScrollView>
    );
}
