import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';

import { AnimatedIn } from '@/src/components/ui/AnimatedIn';
import { PrimaryButton } from '@/src/components/ui/PrimaryButton';
import { Screen } from '@/src/components/ui/Screen';
import { ScreenHeader } from '@/src/components/ui/ScreenHeader';
import { ScreenTransition } from '@/src/components/ui/ScreenTransition';
import { TextInputField } from '@/src/components/ui/TextInputField';

export default function ChangePasswordScreen() {
    const router = useRouter();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) return;
        if (newPassword !== confirmPassword) {
            // Show error
            return;
        }

        setSubmitting(true);
        // Simulate API call
        setTimeout(() => {
            setSubmitting(false);
            router.back();
        }, 1500);
    };

    return (
        <Screen edges={['top', 'left', 'right']} className="bg-background-subtle">
            <ScreenTransition>
                <View className="flex-1 px-md pt-md">
                    <ScreenHeader
                        title="Change Password"
                        onBack={() => router.back()}
                    />

                    <View className="mt-8 gap-4">
                        <AnimatedIn delayMs={100}>
                            <TextInputField
                                label="Current Password"
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                                secureTextEntry
                                placeholder="Enter current password"
                            />
                        </AnimatedIn>

                        <AnimatedIn delayMs={200}>
                            <TextInputField
                                label="New Password"
                                value={newPassword}
                                onChangeText={setNewPassword}
                                secureTextEntry
                                placeholder="Enter new password"
                            />
                        </AnimatedIn>

                        <AnimatedIn delayMs={300}>
                            <TextInputField
                                label="Confirm New Password"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                                placeholder="Confirm new password"
                            />
                        </AnimatedIn>

                        <AnimatedIn delayMs={400}>
                            <View className="mt-4">
                                <PrimaryButton
                                    title="Update Password"
                                    onPress={handleSubmit}
                                    loading={submitting}
                                    disabled={!currentPassword || !newPassword || !confirmPassword}
                                />
                            </View>
                        </AnimatedIn>
                    </View>
                </View>
            </ScreenTransition>
        </Screen>
    );
}
