import React from 'react';
import { ScrollView, Text, Pressable, ViewStyle } from 'react-native';

import { cn } from '@/src/lib/cn';

interface Option {
    label: string;
    value: string;
}

interface FilterChipsProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    style?: ViewStyle;
}

export function FilterChips({ options, value, onChange, style }: FilterChipsProps) {
    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
            style={style}
        >
            {options.map((opt) => {
                const isActive = value === opt.value;
                return (
                    <Pressable
                        key={opt.value}
                        onPress={() => onChange(opt.value)}
                        className={cn(
                            "px-4 py-2 rounded-full border",
                            isActive
                                ? "bg-primary border-primary"
                                : "bg-white border-neutral-200 dark:bg-neutral-800 dark:border-neutral-700"
                        )}
                    >
                        <Text
                            className={cn(
                                "text-xs font-semibold",
                                isActive ? "text-white" : "text-text-secondary"
                            )}
                        >
                            {opt.label}
                        </Text>
                    </Pressable>
                );
            })}
        </ScrollView>
    );
}
