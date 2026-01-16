import React, { memo, useMemo } from 'react';
import { Platform, Text, useWindowDimensions, View } from 'react-native';
import { Line, G } from 'react-native-svg';
import { VictoryAxis, VictoryBar, VictoryChart, VictoryGroup, VictoryLabel } from 'victory-native';

import { Card } from '@/src/components/ui/Card';
import type { Transaction } from '@/src/api/transactionsApi';

type Props = {
    transactions: Transaction[];
    loading?: boolean;
};

export const TransferActivityChart = memo(function TransferActivityChart({ transactions, loading }: Props) {
    const { width: windowWidth } = useWindowDimensions();
    const chartWidth = Math.max(320, windowWidth - 48);

    const data = useMemo(() => {
        // Filter for transfers only
        // Assuming type 'transfer' and distinctions based on amount sign or other props
        // For this mock/impl, we'll assume negative is sent, positive is received (standard logic)
        // Or check if we have distinct types. If API returns generic 'transfer', usually:
        // Credit (+) = Received, Debit (-) = Sent.

        // Let's aggregate by last 4 weeks or months for simplicity, or just show totals if not time-series capable yet.
        // For "Activity", a daily/weekly bar chart of Sent vs Received is best.

        const relevant = transactions.filter(t => t.type === 'transfer' && t.status === 'completed');

        // Group by Day (Last 7 days active)
        const grouped: Record<string, { sent: number; received: number }> = {};

        relevant.forEach(t => {
            // Mock date parsing if string
            const date = new Date(t.createdAt);
            const key = `${date.getMonth() + 1}/${date.getDate()}`; // MM/DD

            if (!grouped[key]) grouped[key] = { sent: 0, received: 0 };

            if (t.amountMinor < 0) {
                grouped[key].sent += Math.abs(t.amountMinor);
            } else {
                grouped[key].received += t.amountMinor;
            }
        });

        // Convert to arrays
        const chartData = Object.keys(grouped).slice(-7).map(key => ({
            x: key,
            sent: grouped[key].sent,
            received: grouped[key].received
        }));

        return chartData.length > 0 ? chartData : [{ x: 'No Data', sent: 0, received: 0 }];
    }, [transactions]);

    const hasData = data.length > 1 || (data[0].x !== 'No Data');

    if (loading) {
        return (
            <Card className="gap-3">
                <View className="h-4 w-40 rounded bg-border-light animate-pulse" />
                <View className="h-48 w-full rounded-lg bg-gray-100 dark:bg-neutral-800 animate-pulse" />
            </Card>
        );
    }

    return (
        <Card>
            <View className="flex-row justify-between items-center mb-4">
                <View>
                    <Text className="text-label text-text-primary font-semibold">Transfers</Text>
                    <Text className="text-caption text-text-secondary">Sent vs Received</Text>
                </View>
                <View className="flex-row gap-3">
                    <View className="flex-row items-center gap-1">
                        <View className="w-2 h-2 rounded-full bg-blue-500" />
                        <Text className="text-xs text-text-secondary">Sent</Text>
                    </View>
                    <View className="flex-row items-center gap-1">
                        <View className="w-2 h-2 rounded-full bg-purple-500" />
                        <Text className="text-xs text-text-secondary">Received</Text>
                    </View>
                </View>
            </View>

            {hasData ? (
                <View className="-ml-3 relative" pointerEvents="box-none">
                    <VictoryChart
                        width={chartWidth}
                        height={200}
                        padding={{ top: 10, bottom: 40, left: 50, right: 20 }}
                        groupComponent={<G />}
                    >
                        <VictoryAxis
                            style={{
                                axis: { stroke: 'transparent' },
                                tickLabels: { fill: '#9CA3AF', fontSize: 10 },
                                grid: { stroke: 'transparent' },
                            }}
                            axisComponent={<Line />}
                            gridComponent={<Line />}
                            tickLabelComponent={<VictoryLabel />}
                            groupComponent={<G />}
                        />
                        <VictoryAxis
                            dependentAxis
                            tickFormat={(t) => `${(Number(t) / 1000).toFixed(0)}k`} // Very compact
                            style={{
                                axis: { stroke: 'transparent' },
                                tickLabels: { fill: '#9CA3AF', fontSize: 10, padding: 5 },
                                grid: { stroke: '#E5E7EB', strokeDasharray: '4, 4' },
                            }}
                            axisComponent={<Line />}
                            gridComponent={<Line />}
                            tickLabelComponent={<VictoryLabel />}
                            groupComponent={<G />}
                        />

                        <VictoryGroup offset={12} groupComponent={<G />}>
                            <VictoryBar
                                data={data}
                                x="x"
                                y="sent"
                                style={{ data: { fill: '#3B82F6', width: 10 } }} // Blue for Sent
                                cornerRadius={{ top: 4 }}
                                animate={{ duration: 500 }}
                            />
                            <VictoryBar
                                data={data}
                                x="x"
                                y="received"
                                style={{ data: { fill: '#A855F7', width: 10 } }} // Purple for Received
                                cornerRadius={{ top: 4 }}
                                animate={{ duration: 500 }}
                            />
                        </VictoryGroup>
                    </VictoryChart>
                </View>
            ) : (
                <View className="h-32 items-center justify-center">
                    <Text className="text-text-secondary">No recent transfer activity</Text>
                </View>
            )}
        </Card>
    );
});
