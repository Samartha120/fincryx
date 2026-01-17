import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { AnimatedIn } from '@/src/components/ui/AnimatedIn';
import { Screen } from '@/src/components/ui/Screen';
import { ScreenHeader } from '@/src/components/ui/ScreenHeader';
import { ScreenTransition } from '@/src/components/ui/ScreenTransition';

interface HelpItemProps {
    icon: React.ComponentProps<typeof FontAwesome>['name'];
    title: string;
    subtitle: string;
    onPress: () => void;
    color: string;
}

function HelpItem({ icon, title, subtitle, onPress, color }: HelpItemProps) {
    return (
        <Pressable
            onPress={onPress}
            className="bg-surface p-4 rounded-xl border border-border/50 shadow-sm flex-row items-center mb-3 active:opacity-70"
        >
            <View className="w-10 h-10 rounded-full items-center justify-center mr-4" style={{ backgroundColor: `${color}15` }}>
                <FontAwesome name={icon} size={20} color={color} />
            </View>
            <View className="flex-1">
                <Text className="text-base font-semibold text-text-primary">{title}</Text>
                <Text className="text-caption text-text-secondary mt-0.5">{subtitle}</Text>
            </View>
            <FontAwesome name="angle-right" size={16} color="#9CA3AF" />
        </Pressable>
    );
}

export default function HelpSupportScreen() {
    const router = useRouter();

    return (
        <Screen edges={['top', 'left', 'right']} className="bg-background-subtle">
            <ScreenTransition>
                <ScrollView contentContainerClassName="px-md pt-md pb-xl">
                    <ScreenHeader
                        title="Help & Support"
                        onBack={() => router.back()}
                    />

                    <View className="mt-6">
                        <AnimatedIn delayMs={100}>
                            <HelpItem
                                icon="book"
                                color="#3B82F6"
                                title="Help Centre"
                                subtitle="FAQs and Guides"
                                onPress={() => { }}
                            />
                        </AnimatedIn>

                        <AnimatedIn delayMs={200}>
                            <HelpItem
                                icon="envelope-o"
                                color="#8B5CF6"
                                title="Send Feedback"
                                subtitle="Report bugs or suggest features"
                                onPress={() => { }}
                            />
                        </AnimatedIn>

                        <AnimatedIn delayMs={300}>
                            <HelpItem
                                icon="file-text-o"
                                color="#10B981"
                                title="Terms & Policy"
                                subtitle="Read our terms of service"
                                onPress={() => router.push('/settings/privacy-policy')}
                            />
                        </AnimatedIn>

                        <AnimatedIn delayMs={400}>
                            <HelpItem
                                icon="flag-o"
                                color="#F59E0B"
                                title="Channel Reports"
                                subtitle="Status of our services"
                                onPress={() => { }}
                            />
                        </AnimatedIn>

                        <AnimatedIn delayMs={500}>
                            <HelpItem
                                icon="info-circle"
                                color="#EF4444"
                                title="App Info"
                                subtitle="Version 1.2.0 • Build 245"
                                onPress={() => { }}
                            />
                        </AnimatedIn>

                    </View>
                </ScrollView>
            </ScreenTransition>
        </Screen>
    );
}
