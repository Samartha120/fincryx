import { AuthCard } from '@/src/components/ui/AuthCard';
import { DividerText } from '@/src/components/ui/DividerText';
import { Logo } from '@/src/components/ui/Logo';
import { PrimaryButton } from '@/src/components/ui/PrimaryButton';
import { TextInputField } from '@/src/components/ui/TextInputField';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';

/**
 * Design System Preview
 * Shows all components and styles in action
 */
export default function DesignSystemPreview() {
  return (
    <View className="flex-1 bg-background">
      <ScrollView>
        <View className="px-md py-xl">
          {/* Header */}
          <View className="items-center mb-xl">
            <Logo size={80} showText />
            <Text className="text-display text-text-primary mt-md">Finoryx</Text>
            <Text className="text-body text-text-secondary mt-xs">
              Design System Preview
            </Text>
          </View>

          {/* Typography Showcase */}
          <View className="mb-lg">
            <Text className="text-title text-text-primary mb-sm">Typography</Text>
            <AuthCard className="gap-sm">
              <Text className="text-display text-text-primary">Display Text</Text>
              <Text className="text-title text-text-primary">Title Text</Text>
              <Text className="text-heading text-text-primary">Heading Text</Text>
              <Text className="text-body text-text-primary">Body Text</Text>
              <Text className="text-label text-text-secondary">Label Text</Text>
              <Text className="text-caption text-text-muted">Caption Text</Text>
            </AuthCard>
          </View>

          {/* Buttons Showcase */}
          <View className="mb-lg">
            <Text className="text-title text-text-primary mb-sm">Buttons</Text>
            <AuthCard className="gap-sm">
              <PrimaryButton title="Primary Button" onPress={() => {}} />
              <PrimaryButton 
                title="Secondary Button" 
                variant="secondary" 
                onPress={() => {}} 
              />
              <PrimaryButton 
                title="Outline Button" 
                variant="outline" 
                onPress={() => {}} 
              />
              <PrimaryButton 
                title="Loading Button" 
                loading 
                onPress={() => {}} 
              />
              <PrimaryButton 
                title="Disabled Button" 
                disabled 
                onPress={() => {}} 
              />
            </AuthCard>
          </View>

          {/* Input Fields Showcase */}
          <View className="mb-lg">
            <Text className="text-title text-text-primary mb-sm">Input Fields</Text>
            <AuthCard className="gap-md">
              <TextInputField
                label="Default Input"
                placeholder="Enter text"
              />
              <TextInputField
                label="Required Input"
                placeholder="Enter text"
                required
              />
              <TextInputField
                label="Input with Helper"
                placeholder="Enter text"
                helperText="This is helper text"
              />
              <TextInputField
                label="Input with Error"
                placeholder="Enter text"
                error="This field has an error"
              />
            </AuthCard>
          </View>

          {/* Divider */}
          <View className="mb-lg">
            <Text className="text-title text-text-primary mb-sm">Divider</Text>
            <AuthCard>
              <DividerText text="or continue with" />
            </AuthCard>
          </View>

          {/* Color Palette */}
          <View className="mb-lg">
            <Text className="text-title text-text-primary mb-sm">Colors</Text>
            <AuthCard className="gap-sm">
              <View className="flex-row items-center gap-sm">
                <View className="w-10 h-10 bg-primary rounded-input" />
                <Text className="text-label text-text-primary">Primary</Text>
              </View>
              <View className="flex-row items-center gap-sm">
                <View className="w-10 h-10 bg-error rounded-input" />
                <Text className="text-label text-text-primary">Error</Text>
              </View>
              <View className="flex-row items-center gap-sm">
                <View className="w-10 h-10 bg-success rounded-input" />
                <Text className="text-label text-text-primary">Success</Text>
              </View>
              <View className="flex-row items-center gap-sm">
                <View className="w-10 h-10 bg-surface border border-border rounded-input" />
                <Text className="text-label text-text-primary">Surface</Text>
              </View>
            </AuthCard>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
