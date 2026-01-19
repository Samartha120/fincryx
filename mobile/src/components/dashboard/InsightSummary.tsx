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
            <View className="bg-white dark:bg-neutral-800 p-5 rounded-3xl w-44 shadow-sm border border-neutral-100 dark:border-neutral-700">
                <View className="flex-row justify-between items-start mb-3">
                    <View className="bg-rose-50 dark:bg-rose-900/20 p-2.5 rounded-full">
                        <FontAwesome name="arrow-down" size={14} color="#EF4444" />
                    </View>
                    <Text className="text-[10px] text-text-secondary font-medium bg-neutral-50 dark:bg-neutral-900 px-2 py-1 rounded-full overflow-hidden">30d</Text>
                </View>
                <Text className="text-text-secondary text-xs mb-1 font-medium">Monthly Spend</Text>
                <Text className="text-text-primary text-xl font-bold tracking-tight">
                    {monthlySpend ? formatMoneyMinor(monthlySpend, monthlySpendCurrency) : '—'}
                </Text>
            </View>

            {/* Monthly Income Card */}
            <View className="bg-white dark:bg-neutral-800 p-5 rounded-3xl w-44 shadow-sm border border-neutral-100 dark:border-neutral-700">
                <View className="flex-row justify-between items-start mb-3">
                    <View className="bg-emerald-50 dark:bg-emerald-900/20 p-2.5 rounded-full">
                        <FontAwesome name="arrow-up" size={14} color="#10B981" />
                    </View>
                    <Text className="text-[10px] text-text-secondary font-medium bg-neutral-50 dark:bg-neutral-900 px-2 py-1 rounded-full overflow-hidden">30d</Text>
                </View>
                <Text className="text-text-secondary text-xs mb-1 font-medium">Monthly Income</Text>
                <Text className="text-text-primary text-xl font-bold tracking-tight">
                    {monthlyIncome ? formatMoneyMinor(monthlyIncome, monthlySpendCurrency) : formatMoneyMinor(0, monthlySpendCurrency)}
                </Text>
            </View>

            {/* Loan Status Card */}
            <View className="bg-white dark:bg-neutral-800 p-5 rounded-3xl w-44 shadow-sm border border-neutral-100 dark:border-neutral-700">
                <View className="flex-row justify-between items-start mb-3">
                    <View className="bg-blue-50 dark:bg-blue-900/20 p-2.5 rounded-full">
                        <FontAwesome name="pie-chart" size={14} color="#3B82F6" />
                    </View>
                </View>
                <Text className="text-text-secondary text-xs mb-1 font-medium">Loans Paid</Text>
                <Text className="text-text-primary text-xl font-bold tracking-tight">
                    {loanStatus ? `${Math.round((loanStatus.paid / Math.max(1, loanStatus.total)) * 100)}%` : '0%'}
                </Text>
            </View>
        </ScrollView>
    );
}
