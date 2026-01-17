import { FontAwesome } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { PrimaryButton } from '@/src/components/ui/PrimaryButton';

interface RateAppModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (rating: number) => void;
}

export function RateAppModal({ visible, onClose, onSubmit }: RateAppModalProps) {
    const [rating, setRating] = useState(0);
    const scaleAnims = useRef([0, 1, 2, 3, 4].map(() => new Animated.Value(1))).current;

    useEffect(() => {
        if (!visible) {
            // Reset after close
            setTimeout(() => setRating(0), 200);
        }
    }, [visible]);

    const handleRate = (index: number) => {
        setRating(index + 1);

        // Bounce animation for the selected star
        Animated.sequence([
            Animated.spring(scaleAnims[index], {
                toValue: 1.4,
                friction: 3,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnims[index], {
                toValue: 1,
                friction: 3,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const handleSubmit = () => {
        onSubmit(rating);
        onClose();
    };

    return (
        <Modal transparent visible={visible} onRequestClose={onClose} animationType="fade">
            <View style={styles.overlay}>
                <Pressable style={styles.backdrop} onPress={onClose} />
                <View className="bg-white dark:bg-neutral-800 w-[90%] rounded-3xl p-6 items-center shadow-lg">

                    <View className="mb-6 items-center">
                        <View className="w-16 h-16 bg-yellow-100 rounded-full items-center justify-center mb-4">
                            <FontAwesome name="star" size={32} color="#FBBF24" />
                        </View>
                        <Text className="text-xl font-bold text-text-primary mb-2 text-center">
                            Enjoying the app?
                        </Text>
                        <Text className="text-sm text-text-secondary text-center">
                            Tap a star to rate it on the App Store.
                        </Text>
                    </View>

                    <View className="flex-row justify-center gap-2 mb-8">
                        {[0, 1, 2, 3, 4].map((index) => (
                            <Pressable key={index} onPress={() => handleRate(index)}>
                                <Animated.View style={{ transform: [{ scale: scaleAnims[index] }] }}>
                                    <FontAwesome
                                        name={index < rating ? 'star' : 'star-o'}
                                        size={36}
                                        color="#FBBF24"
                                        style={{ marginHorizontal: 4 }}
                                    />
                                </Animated.View>
                            </Pressable>
                        ))}
                    </View>

                    <View className="w-full gap-3">
                        <PrimaryButton
                            title="Submit Review"
                            onPress={handleSubmit}
                            disabled={rating === 0}
                        />
                        <Pressable onPress={onClose} className="py-3 items-center">
                            <Text className="text-text-secondary font-medium">Not now</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
});
