import React from 'react';
import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Admin', headerShown: true }} />
      <Stack.Screen name="users" options={{ title: 'Users', headerShown: true }} />
      <Stack.Screen name="transactions" options={{ title: 'Transactions', headerShown: true }} />
    </Stack>
  );
}
