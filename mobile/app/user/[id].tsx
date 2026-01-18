import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

import { Screen } from '@/src/components/ui/Screen';
import { ScreenHeader } from '@/src/components/ui/ScreenHeader';
import { PrimaryButton } from '@/src/components/ui/PrimaryButton';
import { Card } from '@/src/components/ui/Card';
import { AnimatedIn } from '@/src/components/ui/AnimatedIn';

export default function PublicProfileScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();

    // Mock data simulation based on the scanned ID
    // In a real app, this would be an API call: useQuery(['user', id], fetchUser)
    const isMockUser = id === 'Simulated User ID';
    const userData = {
        name: isMockUser ? 'Jane Doe' : `User ${id}`,
        id: id,
        initials: isMockUser ? 'JD' : 'U',
        verified: true,
        joinDate: 'Jan 2024',
    };

    return (
        <Screen className="bg-background">
            <ScreenHeader title="Scanned Profile" onBack={() => router.back()} />

            <ScrollView contentContainerClassName="p-md gap-6">
                {/* Identity Section */}
                <AnimatedIn delayMs={100}>
                    <View className="items-center py-6">
                        <View className="w-24 h-24 rounded-full bg-primary/10 items-center justify-center mb-4 border-2 border-primary/20">
                            <Text className="text-3xl font-bold text-primary">{userData.initials}</Text>
                        </View>

                        <View className="flex-row items-center gap-2 mb-1">
                            <Text className="text-2xl font-bold text-text-primary">{userData.name}</Text>
                            {userData.verified && (
                                <FontAwesome name="check-circle" size={20} color="#10B981" />
                            )}
                        </View>

                        <Text className="text-text-secondary">App ID: {userData.id}</Text>
                    </View>
                </AnimatedIn>

                {/* Info Card */}
                <AnimatedIn delayMs={200}>
                    <Card className="p-4 gap-4">
                        <View className="flex-row items-center gap-4 border-b border-border-light pb-4">
                            <View className="w-10 h-10 rounded-full bg-surface items-center justify-center">
                                <FontAwesome name="shield" size={20} color="#64748B" />
                            </View>
                            <View>
                                <Text className="text-text-secondary text-sm">Status</Text>
                                <Text className="text-text-primary font-medium">Verified Citizen</Text>
                            </View>
                        </View>

                        <View className="flex-row items-center gap-4">
                            <View className="w-10 h-10 rounded-full bg-surface items-center justify-center">
                                <FontAwesome name="calendar" size={18} color="#64748B" />
                            </View>
                            <View>
                                <Text className="text-text-secondary text-sm">Member Since</Text>
                                <Text className="text-text-primary font-medium">{userData.joinDate}</Text>
                            </View>
                        </View>
                    </Card>
                </AnimatedIn>

                {/* Actions */}
                <AnimatedIn delayMs={300}>
                    <View className="gap-3 mt-4">
                        <PrimaryButton
                            title="Transfer Money"
                            onPress={() => alert('Transfer flow would start here!')}
                        />
                        <PrimaryButton
                            variant="secondary"
                            title="Close"
                            onPress={() => router.back()}
                        />
                    </View>
                </AnimatedIn>
            </ScrollView>
        </Screen>
    );
}
