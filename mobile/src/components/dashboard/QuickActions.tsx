import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

interface ActionItem {
    icon: keyof typeof FontAwesome.glyphMap;
    label: string;
    route: string;
    color?: string;
}

const ACTIONS: ActionItem[] = [
    { icon: 'exchange', label: 'Transfer', route: '/(tabs)/transfer', color: '#3B82F6' },
    { icon: 'money', label: 'Loans', route: '/(tabs)/loans', color: '#10B981' }, // emerald-500
    { icon: 'list', label: 'History', route: '/(tabs)/transactions', color: '#F59E0B' }, // amber-500
    { icon: 'bar-chart', label: 'Analytics', route: '/(tabs)/analytics', color: '#8B5CF6' }, // violet-500
];

export function QuickActions() {
    const router = useRouter();

    return (
        <View className="flex-row justify-between items-start px-2">
            {ACTIONS.map((action, index) => (
                <View key={index} className="items-center gap-2">
                    <Pressable
                        onPress={() => router.push(action.route as any)}
                        className="w-14 h-14 rounded-full bg-white items-center justify-center shadow-sm shadow-black/5 active:scale-95 transition-transform"
                        style={{
                            shadowColor: "#000",
                            shadowOffset: {
                                width: 0,
                                height: 2,
                            },
                            shadowOpacity: 0.1,
                            shadowRadius: 3.84,
                            elevation: 5,
                        }}
                    >
                        <FontAwesome name={action.icon} size={20} color={action.color} />
                    </Pressable>
                    <Text className="text-xs text-text-secondary font-medium">{action.label}</Text>
                </View>
            ))}
        </View>
    );
}
