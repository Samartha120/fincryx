import { Modal, Text, View, Pressable, Platform, Dimensions } from 'react-native';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

interface PermissionModalProps {
    visible: boolean;
    type: 'notification' | 'biometric';
    onClose: () => void;
    onAccept: () => void;
}

export function PermissionModal({ visible, type, onClose, onAccept }: PermissionModalProps) {
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';

    const content = type === 'notification' ? {
        icon: 'bell-o',
        family: 'FontAwesome',
        title: 'Stay Updated',
        description: 'Enable notifications to get instant alerts for transactions, security updates, and loan approvals.',
        allowText: 'Enable Notifications',
        denyText: 'Maybe Later'
    } : {
        icon: 'fingerprint',
        family: 'MaterialCommunityIcons',
        title: 'Quick Access',
        description: 'Enable biometric login to access your account securely and quickly without typing your password.',
        allowText: 'Enable Biometrics',
        denyText: 'No Thanks'
    };

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-center items-center bg-black/60 px-6">
                <View className="w-full max-w-sm bg-surface rounded-3xl p-6 shadow-xl border border-border/50 overflow-hidden">

                    {/* Icon Header */}
                    <View className="items-center mb-5">
                        <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center mb-4">
                            {content.family === 'MaterialCommunityIcons' ? (
                                <MaterialCommunityIcons
                                    name={content.icon as any}
                                    size={32}
                                    color="#4F46E5"
                                />
                            ) : (
                                <FontAwesome
                                    name={content.icon as any}
                                    size={32}
                                    color="#4F46E5"
                                />
                            )}
                        </View>
                        <Text className="text-xl font-bold text-text-primary text-center mb-2">
                            {content.title}
                        </Text>
                        <Text className="text-body text-text-secondary text-center px-4 leading-6">
                            {content.description}
                        </Text>
                    </View>

                    {/* Actions */}
                    <View className="gap-3">
                        <Pressable
                            onPress={onAccept}
                            className="w-full py-3.5 bg-primary rounded-xl items-center active:opacity-90"
                        >
                            <Text className="text-white font-semibold text-base">
                                {content.allowText}
                            </Text>
                        </Pressable>

                        <Pressable
                            onPress={onClose}
                            className="w-full py-3.5 items-center active:opacity-50"
                        >
                            <Text className="text-text-secondary font-medium text-base">
                                {content.denyText}
                            </Text>
                        </Pressable>
                    </View>

                </View>
            </View>
        </Modal>
    );
}
