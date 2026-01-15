import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { useColorScheme } from 'nativewind';
import React from 'react';

import { useClientOnlyValue } from '@/components/useClientOnlyValue';

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const nav = {
    background: isDark ? '#0B1020' : '#FFFFFF',
    border: isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB',
    text: isDark ? '#EAF0FF' : '#111827',
    active: isDark ? '#6D8CFF' : '#1E40AF',
    inactive: isDark ? 'rgba(234,240,255,0.55)' : '#6B7280',
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: nav.active,
        tabBarInactiveTintColor: nav.inactive,
        tabBarStyle: {
          backgroundColor: nav.background,
          borderTopColor: nav.border,
          borderTopWidth: 1,
          height: 64,
          paddingTop: 6,
        },
        headerStyle: {
          backgroundColor: nav.background,
          borderBottomColor: nav.border,
          borderBottomWidth: 1,
        },
        headerTintColor: nav.text,
        // Disable the static render of the header on web
        // to prevent a hydration error in React Navigation v6.
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
        }}
      />

      <Tabs.Screen
        name="transfer"
        options={{
          // Hidden from tab bar; accessible via Dashboard quick actions.
          href: null,
          title: 'Transfer',
          tabBarIcon: ({ color }) => <TabBarIcon name="exchange" color={color} />,
        }}
      />

      <Tabs.Screen
        name="transactions"
        options={{
          // Hidden from tab bar; accessible via Dashboard quick actions.
          href: null,
          title: 'History',
          tabBarIcon: ({ color }) => <TabBarIcon name="list" color={color} />,
        }}
      />

      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color }) => <TabBarIcon name="line-chart" color={color} />,
        }}
      />

      <Tabs.Screen
        name="loans"
        options={{
          title: 'Loans',
          tabBarIcon: ({ color }) => <TabBarIcon name="money" color={color} />,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          // Profile is consolidated into Settings.
          href: null,
          title: 'Profile',
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <TabBarIcon name="cog" color={color} />,
        }}
      />

      <Tabs.Screen
        name="notifications"
        options={{
          // Hidden from tab bar; opened from dashboard header.
          href: null,
          title: 'Notifications',
          tabBarIcon: ({ color }) => <TabBarIcon name="bell" color={color} />,
        }}
      />

      <Tabs.Screen
        name="two"
        options={{
          // Legacy route: do not show in tabs.
          href: null,
          title: 'More',
        }}
      />
    </Tabs>
  );
}
