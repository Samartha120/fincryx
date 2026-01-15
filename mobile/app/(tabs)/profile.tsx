import React from 'react';
import { ScrollView, Text, View } from 'react-native';

import { Card } from '@/src/components/ui/Card';
import { Screen } from '@/src/components/ui/Screen';
import { ScreenTransition } from '@/src/components/ui/ScreenTransition';
import { useAuthStore } from '@/src/store/useAuthStore';

type ProfileField = {
  label: string;
  value: string;
};

export default function ProfileScreen() {
  const { user } = useAuthStore();

  const fields: ProfileField[] = [
    { label: 'Full name', value: user?.fullName ?? 'Not provided' },
    { label: 'Email', value: user?.email ?? 'Not provided' },
    { label: 'About', value: 'Finoryx customer' },
    { label: 'Location', value: 'Not provided' },
    { label: 'Contact number', value: 'Not provided' },
    { label: 'Date of birth', value: 'Not provided' },
  ];

  return (
    <Screen edges={['top', 'left', 'right']}>
      <ScreenTransition>
        <ScrollView contentContainerClassName="px-md pt-md pb-lg">
          <View className="gap-1">
            <Text className="text-caption text-text-secondary">Profile</Text>
            <Text className="text-heading text-text-primary">{user?.fullName ?? 'Your profile'}</Text>
            <Text className="text-body text-text-secondary">Manage your personal information</Text>
          </View>

          <Card className="mt-md gap-3">
            {fields.map((field) => (
              <View key={field.label} className="gap-1">
                <Text className="text-caption text-text-secondary">{field.label}</Text>
                <Text className="text-body text-text-primary">{field.value}</Text>
              </View>
            ))}
          </Card>
        </ScrollView>
      </ScreenTransition>
    </Screen>
  );
}
