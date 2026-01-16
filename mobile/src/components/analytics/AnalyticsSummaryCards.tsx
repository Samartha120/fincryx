import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { formatMoneyMinor } from '@/src/lib/money';
import { Card } from '@/src/components/ui/Card';

type SummaryData = {
    totalBalance: number;
    monthlySpend: number;
    activeLoans: number;
    savingsRate: number; // percentage (0-100)
    currency: string;
};

type Props = {
    data: SummaryData;
    loading?: boolean;
};

function SummaryCard({
    title,
    value,
    subtitle,
    colors,
}: {
    title: string;
    value: string;
    subtitle: string;
    colors: [string, string];
}) {
    return (
        <View className="mr-3 w-40 overflow-hidden rounded-2xl shadow-sm">
            <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="p-4 h-32 justify-between">
                <Text className="text-white/80 text-xs font-medium uppercase tracking-wider">{title}</Text>
                <View>
                    <Text className="text-white text-xl font-bold mb-1" numberOfLines={1} adjustsFontSizeToFit>
                        {value}
                    </Text>
                    <Text className="text-white/80 text-xs">{subtitle}</Text>
                </View>
            </LinearGradient>
        </View>
    );
}

function SkeletonCard() {
    return (
        <View className="mr-3 w-40 h-32 rounded-2xl bg-gray-200 dark:bg-neutral-800 animate-pulse" />
    );
}

export function AnalyticsSummaryCards({ data, loading }: Props) {
    if (loading) {
        return (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="px-md mb-2">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
            </ScrollView>
        );
    }

    const { totalBalance, monthlySpend, activeLoans, savingsRate, currency } = data;

    const fmt = (amount: number) =>
        new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);


    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="px-md pb-4 pt-1" // minimal padding for shadow visibility
            decelerationRate="fast"
            snapToInterval={160 + 12} // card width + margin
        >
            <SummaryCard
                title="Total Balance"
                value={fmt(totalBalance)}
                subtitle="Available now"
                colors={['#3B82F6', '#2563EB']} // Blue
            />
            <SummaryCard
                title="Monthly Spend"
                value={fmt(monthlySpend)}
                subtitle="This month"
                colors={['#EC4899', '#DB2777']} // Pink
            />
            <SummaryCard
                title="Active Loans"
                value={String(activeLoans)}
                subtitle="Open accounts"
                colors={['#F59E0B', '#D97706']} // Amber
            />
            <SummaryCard
                title="Savings Rate"
                value={`${savingsRate}%`}
                subtitle="Of income saved"
                colors={['#10B981', '#059669']} // Emerald
            />
        </ScrollView>
    );
}
