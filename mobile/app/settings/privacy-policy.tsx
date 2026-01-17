import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';

import { AnimatedIn } from '@/src/components/ui/AnimatedIn';
import { Screen } from '@/src/components/ui/Screen';
import { ScreenHeader } from '@/src/components/ui/ScreenHeader';
import { ScreenTransition } from '@/src/components/ui/ScreenTransition';
import { useAuthStore } from '@/src/store/useAuthStore';

function Section({ title, delay = 0, children }: { title: string; delay?: number; children: React.ReactNode }) {
    return (
        <AnimatedIn delayMs={delay}>
            <View className="mb-6 bg-surface p-4 rounded-xl border border-border/50 shadow-sm">
                <Text className="text-lg font-bold text-text-primary mb-3">{title}</Text>
                {children}
            </View>
        </AnimatedIn>
    );
}

export default function PrivacyPolicyScreen() {
    const router = useRouter();
    const { user } = useAuthStore();

    return (
        <Screen edges={['top', 'left', 'right']} className="bg-background-subtle">
            <ScreenTransition>
                <ScrollView contentContainerClassName="px-md pt-md pb-xl">
                    <ScreenHeader
                        title="Privacy Policy"
                        onBack={() => router.back()}
                    />

                    <View className="mt-6">
                        <Text className="text-body text-text-secondary mb-6 px-1">
                            Your privacy is important to us. This policy outlines how we collect, use, and protect your data.
                        </Text>

                        <Section title="Personal Information" delay={100}>
                            <View className="gap-2">
                                <Text className="text-body text-text-secondary">
                                    <Text className="font-semibold text-text-primary">Name: </Text>
                                    {user?.fullName || 'Not provided'}
                                </Text>
                                <Text className="text-body text-text-secondary">
                                    <Text className="font-semibold text-text-primary">Email: </Text>
                                    {user?.email || 'Not provided'}
                                </Text>
                                <Text className="text-body text-text-secondary">
                                    <Text className="font-semibold text-text-primary">User ID: </Text>
                                    {user?.id || '---'}
                                </Text>
                            </View>
                        </Section>

                        <Section title="Contact Synchronization" delay={200}>
                            <Text className="text-body text-text-secondary leading-6">
                                We may request access to your contacts to facilitate easy money transfers to your friends and family.
                                We do not store your contacts on our servers without your explicit permission.
                            </Text>
                        </Section>

                        <Section title="Bank Data Privacy" delay={300}>
                            <Text className="text-body text-text-secondary leading-6 mb-2">
                                All financial transactions are encrypted using industry-standard protocols (AES-256).
                                We adhere to strict banking regulations to ensure your funds and data are safe.
                            </Text>
                            <Text className="text-body text-text-secondary leading-6">
                                We do not sell your personal or financial data to third parties.
                            </Text>
                        </Section>

                        <Section title="Terms of Use" delay={400}>
                            <Text className="text-body text-text-secondary leading-6">
                                By using this application, you agree to our Terms of Service.
                                Violations of these terms may result in account suspension.
                            </Text>
                        </Section>

                    </View>
                </ScrollView>
            </ScreenTransition>
        </Screen>
    );
}
