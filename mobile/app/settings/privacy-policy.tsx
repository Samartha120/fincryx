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
                            This Privacy Policy explains how Finoryx collects, uses, protects, and shares your
                            information when you use this finance application. We follow banking-grade security
                            practices and never sell your personal or financial data.
                        </Text>

                        <Section title="Your Profile Details" delay={100}>
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
                                    <Text className="font-semibold text-text-primary">Customer ID: </Text>
                                    {user?.id || 'Not assigned'}
                                </Text>
                            </View>
                        </Section>

                        <Section title="What Data We Collect" delay={180}>
                            <View className="gap-2">
                                <Text className="text-body text-text-secondary leading-6">
                                    • Identification data such as your name, email address, and contact details.
                                </Text>
                                <Text className="text-body text-text-secondary leading-6">
                                    • Account and transaction data, including balances, transfers, repayments and bill payments made using Finoryx.
                                </Text>
                                <Text className="text-body text-text-secondary leading-6">
                                    • Device and usage data such as app version, device type and basic diagnostics to keep the service secure and reliable.
                                </Text>
                            </View>
                        </Section>

                        <Section title="How We Use Your Data" delay={230}>
                            <View className="gap-2">
                                <Text className="text-body text-text-secondary leading-6">
                                    • To process payments, transfers and loan repayments you initiate in the app.
                                </Text>
                                <Text className="text-body text-text-secondary leading-6">
                                    • To show insights such as analytics, notifications and statements related to your financial activity.
                                </Text>
                                <Text className="text-body text-text-secondary leading-6">
                                    • To prevent fraud, secure your account and comply with legal and regulatory requirements.
                                </Text>
                            </View>
                        </Section>

                        <Section title="Contacts & Permissions" delay={280}>
                            <Text className="text-body text-text-secondary leading-6">
                                We may request access to your contacts only to help you send money to people you know.
                                Contact data is used locally for search and is not stored on our servers without your
                                explicit consent.
                            </Text>
                        </Section>

                        <Section title="Banking-Grade Security" delay={330}>
                            <View className="gap-2">
                                <Text className="text-body text-text-secondary leading-6">
                                    • All sensitive information is transmitted over secure, encrypted connections using
                                    industry-standard protocols (such as TLS and AES-256).
                                </Text>
                                <Text className="text-body text-text-secondary leading-6">
                                    • Access to your data inside Finoryx is restricted to authorized systems only, strictly on a need-to-know basis.
                                </Text>
                                <Text className="text-body text-text-secondary leading-6">
                                    • We do not sell or rent your personal or financial data to advertisers or other third parties.
                                </Text>
                            </View>
                        </Section>

                        <Section title="Third-Party Services" delay={380}>
                            <Text className="text-body text-text-secondary leading-6">
                                We may share limited information with trusted infrastructure partners such as payment
                                gateways, banks and cloud providers as required to process your transactions. These
                                partners are bound by strict confidentiality and data-protection obligations.
                            </Text>
                        </Section>

                        <Section title="Your Rights & Choices" delay={430}>
                            <View className="gap-2">
                                <Text className="text-body text-text-secondary leading-6">
                                    You can update basic profile information from your account settings and manage
                                    notification and biometric preferences from the Settings screen.
                                </Text>
                                <Text className="text-body text-text-secondary leading-6">
                                    If you believe any account information is inaccurate or you want to request deletion
                                    of your data where applicable, you can contact support through the Help & Support
                                    section in the app.
                                </Text>
                            </View>
                        </Section>

                        <Section title="Policy Updates" delay={480}>
                            <Text className="text-body text-text-secondary leading-6">
                                We may update this policy as Finoryx adds new features or as regulations change.
                                When we make significant updates, we will notify you in the app or via email so you
                                can review the latest version.
                            </Text>
                        </Section>

                    </View>
                </ScrollView>
            </ScreenTransition>
        </Screen>
    );
}
