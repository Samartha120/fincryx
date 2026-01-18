import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { AnimatedIn } from '@/src/components/ui/AnimatedIn';
import { Card } from '@/src/components/ui/Card';
import { Input } from '@/src/components/ui/Input';
import { PrimaryButton } from '@/src/components/ui/PrimaryButton';
import { Screen } from '@/src/components/ui/Screen';
import { ScreenHeader } from '@/src/components/ui/ScreenHeader';
import { ScreenTransition } from '@/src/components/ui/ScreenTransition';
import { COUNTRIES, DEFAULT_COUNTRY, type Country } from '@/src/constants/countries';
import { useAuthStore } from '@/src/store/useAuthStore';
import { cn } from '@/src/lib/cn';

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [isEditing, setIsEditing] = useState(false);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [modalType, setModalType] = useState<'citizenship' | 'phone'>('citizenship');

  // Form State
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');

  const [selectedCountry, setSelectedCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [phoneNumber, setPhoneNumber] = useState('');

  const [citizenship, setCitizenship] = useState<Country>(DEFAULT_COUNTRY);
  const [customCitizenship, setCustomCitizenship] = useState('');
  const [isCustomCitizenship, setIsCustomCitizenship] = useState(false);

  // Validation State
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Valid email is required';

    // Phone Validation logic
    // Official requirement: only Indian numbers verified for now
    if (!phoneNumber.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (selectedCountry.code === 'IN') {
      if (!/^[6-9]\d{9}$/.test(phoneNumber)) {
        newErrors.phone = 'Enter a valid 10-digit Indian mobile number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validate()) {
      setIsEditing(false);
      Alert.alert('Profile Updated', 'Your profile details have been successfully updated.');
      // In a real app, we would make an API call here to update the user profile
    }
  };

  const handleKYCClick = () => {
    Alert.alert('Upcoming Feature', 'KYC Verification flow will be available in the next update.');
  };

  const openCountryModal = (type: 'citizenship' | 'phone') => {
    setModalType(type);
    setShowCountryModal(true);
  };

  const renderField = (label: string, value: string, icon?: keyof typeof FontAwesome.glyphMap) => (
    <View className="mb-4">
      <Text className="text-caption text-text-secondary mb-1">{label}</Text>
      <View className="flex-row items-center gap-3">
        {icon && <FontAwesome name={icon} size={16} color="#64748B" />}
        <Text className="text-body text-text-primary font-medium">{value || 'Not set'}</Text>
      </View>
      <View className="h-[1px] bg-border-light mt-3" />
    </View>
  );

  return (
    <Screen edges={['top', 'left', 'right']} className="bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScreenHeader
          title="My Profile"
          onBack={() => router.back()}
          className="px-2 py-2 mb-2"
          rightElement={
            !isEditing ? (
              <TouchableOpacity
                onPress={() => setIsEditing(true)}
                className="bg-primary/10 px-4 py-2 rounded-full"
              >
                <Text className="text-primary font-semibold text-sm">Edit</Text>
              </TouchableOpacity>
            ) : null
          }
        />

        <ScreenTransition>
          <ScrollView contentContainerClassName="p-md pb-xl" showsVerticalScrollIndicator={false}>
            {/* Header / Avatar Area */}
            <AnimatedIn delayMs={100}>
              <View className="items-center mb-8 mt-2">
                <View className="w-24 h-24 rounded-full bg-primary/10 items-center justify-center mb-3 shadow-sm border border-primary/20">
                  <Text className="text-3xl font-bold text-primary">
                    {fullName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text className="text-heading text-text-primary text-center font-bold text-2xl">
                  {fullName || 'User'}
                </Text>
                <Text className="text-body text-text-secondary text-center mt-1">
                  ID: {user?.id ?? 'Not assigned'}
                </Text>
              </View>
            </AnimatedIn>

            {/* KYC Status Banner */}
            <TouchableOpacity onPress={handleKYCClick} activeOpacity={0.8}>
              <View className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4 flex-row items-center justify-between mb-6">
                <View className="flex-row items-center gap-3">
                  <View className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-800 items-center justify-center">
                    <FontAwesome name="shield" size={20} color="#3B82F6" />
                  </View>
                  <View>
                    <Text className="text-base font-bold text-text-primary">KYC Verification</Text>
                    <Text className="text-xs text-text-secondary">Complete to unlock all features</Text>
                  </View>
                </View>
                <View className="px-3 py-1 bg-white dark:bg-neutral-800 rounded-full border border-blue-200">
                  <Text className="text-xs font-semibold text-blue-600">Pending</Text>
                </View>
              </View>
            </TouchableOpacity>

            {!isEditing ? (
              /* View Mode */
              <Card className="gap-2">
                {renderField('Full Name', fullName, 'user')}
                {renderField('Email Address', email, 'envelope')}

                <View className="mb-4">
                  <Text className="text-caption text-text-secondary mb-1">Phone Number</Text>
                  <View className="flex-row items-center gap-3">
                    <FontAwesome name="phone" size={16} color="#64748B" />
                    <Text className="text-body text-text-primary font-medium">
                      {phoneNumber ? `${selectedCountry.dialCode} ${phoneNumber}` : 'Not set'}
                    </Text>
                    {selectedCountry.code === 'IN' && phoneNumber && (
                      <FontAwesome name="check-circle" size={14} color="#10B981" />
                    )}
                  </View>
                  <View className="h-[1px] bg-border-light mt-3" />
                </View>

                {renderField(
                  'Citizenship',
                  isCustomCitizenship ? customCitizenship : citizenship.name,
                  'globe'
                )}

                {renderField('Account Number', '**** **** 1234', 'credit-card')}
              </Card>
            ) : (
              /* Edit Mode */
              <View className="gap-4">
                <Input
                  label="Full Name"
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Enter your full name"
                  error={errors.fullName}
                />

                <Input
                  label="Email Address"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="name@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={errors.email}
                />

                {/* Phone Input */}
                <View>
                  <Text className="text-label text-text-primary mb-2">Phone Number</Text>
                  <View className="flex-row gap-3">
                    <TouchableOpacity
                      onPress={() => openCountryModal('phone')}
                      className="h-14 w-28 rounded-input border border-border bg-surface flex-row items-center justify-center gap-2 px-2"
                    >
                      <Text className="text-xl">{selectedCountry.flag}</Text>
                      <Text className="text-body text-text-primary font-medium">{selectedCountry.dialCode}</Text>
                      <FontAwesome name="chevron-down" size={10} color="#64748B" />
                    </TouchableOpacity>

                    <View className="flex-1">
                      <Input
                        label=""
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                        placeholder="Mobile Number"
                        keyboardType="phone-pad"
                        className="mt-0"
                      // Note: Input component has its own internal View structure which might add margin, 
                      // so we pass mt-0 via className but Input props destructuring handles `style` or `className`
                      // strictly in its API.
                      />
                    </View>
                  </View>
                  {errors.phone && <Text className="text-caption text-error mt-1">{errors.phone}</Text>}
                </View>

                {/* Citizenship Selector */}
                <View>
                  <Text className="text-label text-text-primary mb-2">Citizenship</Text>
                  <TouchableOpacity
                    onPress={() => openCountryModal('citizenship')}
                    className="h-14 rounded-input border border-border bg-surface flex-row items-center justify-between px-4"
                  >
                    <Text className={cn("text-body", !citizenship && !customCitizenship ? "text-text-secondary" : "text-text-primary")}>
                      {isCustomCitizenship ? (customCitizenship || 'Enter Country') : citizenship.name}
                    </Text>
                    <FontAwesome name="chevron-down" size={12} color="#64748B" />
                  </TouchableOpacity>

                  {isCustomCitizenship && (
                    <Input
                      label="Other Country/Region"
                      value={customCitizenship}
                      onChangeText={setCustomCitizenship}
                      placeholder="Enter your citizenship"
                      className="mt-3"
                    />
                  )}
                </View>

                <View className="flex-row gap-3 mt-4">
                  <View className="flex-1">
                    <PrimaryButton
                      title="Cancel"
                      variant="secondary"
                      onPress={() => setIsEditing(false)}
                    />
                  </View>
                  <View className="flex-1">
                    <PrimaryButton
                      title="Save Changes"
                      onPress={handleSave}
                    />
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
        </ScreenTransition>
      </KeyboardAvoidingView>

      {/* Country Selection Modal */}
      <Modal visible={showCountryModal} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-background pt-4">
          {/* Added pt-4 and removed flex-1 from strict direct child to ensure safe area if needed, 
                but pageSheet usually handles it. 
                For Android or if pageSheet fails, we might need manual padding. 
                User complained it touches top. 
            */}
          <View className={cn("flex-1 bg-background", Platform.OS === 'android' ? "pt-12" : "pt-4")}>
            <View className="px-md py-4 border-b border-border-light flex-row items-center justify-between bg-surface">
              <Text className="text-heading text-text-primary">Select Country</Text>
              <TouchableOpacity onPress={() => setShowCountryModal(false)} className="p-2">
                <Text className="text-primary font-semibold">Close</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerClassName="pb-xl">
              {COUNTRIES.map((country) => (
                <TouchableOpacity
                  key={country.code}
                  className="flex-row items-center px-md py-4 border-b border-border-light"
                  onPress={() => {
                    if (modalType === 'phone') {
                      setSelectedCountry(country);
                    } else {
                      setCitizenship(country);
                      setIsCustomCitizenship(false);
                    }
                    setShowCountryModal(false);
                  }}
                >
                  <Text className="text-2xl mr-4">{country.flag}</Text>
                  <Text className="text-body text-text-primary flex-1">{country.name}</Text>
                  {modalType === 'phone' && (
                    <Text className="text-body text-text-secondary">{country.dialCode}</Text>
                  )}
                </TouchableOpacity>
              ))}

              {modalType === 'citizenship' && (
                <TouchableOpacity
                  className="flex-row items-center px-md py-4 border-b border-border-light"
                  onPress={() => {
                    setIsCustomCitizenship(true);
                    setShowCountryModal(false);
                  }}
                >
                  <View className="w-8 mr-4 items-center"><FontAwesome name="globe" size={20} color="#64748B" /></View>
                  <Text className="text-body text-primary font-medium">Other / Manual Entry</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
