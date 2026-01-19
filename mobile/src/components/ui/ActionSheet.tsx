import { FontAwesome } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

interface ActionSheetOption {
    label: string;
    value: string;
    icon?: React.ComponentProps<typeof FontAwesome>['name'];
    color?: string;
}

interface ActionSheetProps {
    visible: boolean;
    onClose: () => void;
    title?: string;
    options: ActionSheetOption[];
    onSelect: (value: string) => void;
    selectedValue?: string;
}

export function ActionSheet({
    visible,
    onClose,
    title,
    options,
    onSelect,
    selectedValue,
}: ActionSheetProps) {
    const slideAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;
    const [showModal, setShowModal] = useState(visible);

    useEffect(() => {
        if (visible) {
            setShowModal(true);
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                damping: 20,
                stiffness: 90,
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: Dimensions.get('window').height,
                duration: 250,
                useNativeDriver: true,
            }).start(() => setShowModal(false));
        }
    }, [visible, slideAnim]);

    if (!showModal) return null;

    return (
        <Modal transparent visible={showModal} onRequestClose={onClose} animationType="none">
            <View style={styles.overlay}>
                <Pressable style={styles.backdrop} onPress={onClose} />
                <Animated.View
                    style={[
                        styles.sheet,
                        { transform: [{ translateY: slideAnim }] },
                    ]}
                    className="bg-surface"
                >
                    <View className="w-12 h-1 bg-neutral-200 dark:bg-border rounded-full self-center my-3" />

                    {title && (
                        <Text className="text-center text-lg font-bold text-text-primary mb-4 px-4">
                            {title}
                        </Text>
                    )}

                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {options.map((option, index) => {
                            const isSelected = option.value === selectedValue;
                            return (
                                <Pressable
                                    key={option.value}
                                    onPress={() => {
                                        onSelect(option.value);
                                        onClose();
                                    }}
                                    className={`flex-row items-center p-4 rounded-xl mb-2 ${isSelected
                                            ? 'bg-primary/10'
                                            : 'active:bg-background-subtle'
                                        }`}
                                >
                                    <View className="w-8 items-center justify-center mr-3">
                                        {option.icon ? (
                                            <FontAwesome
                                                name={option.icon}
                                                size={20}
                                                color={isSelected ? '#3B82F6' : option.color || '#6B7280'}
                                            />
                                        ) : (
                                            isSelected && <FontAwesome name="check" size={16} color="#3B82F6" />
                                        )}
                                    </View>
                                    <Text
                                        className={`text-base font-medium flex-1 ${isSelected ? 'text-primary' : 'text-text-primary'
                                            }`}
                                    >
                                        {option.label}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </ScrollView>
                    <View style={{ height: 30 }} />
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    sheet: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '80%',
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    scrollContent: {
        paddingBottom: 20,
    },
});
