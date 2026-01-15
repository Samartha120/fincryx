# Finoryx Design System

## Overview
Professional, banking-grade UI components for the Finoryx mobile app.

---

## Color Palette

### Primary Colors
- **Primary**: `#1E40AF` (Deep Blue)
- **Primary Light**: `#3B82F6`
- **Primary Dark**: `#1E3A8A`

### Backgrounds
- **Background**: `#F9FAFB` (Off-white, main screen background)
- **Surface**: `#FFFFFF` (White, card/component background)

### Text Colors
- **Primary Text**: `#111827` (Dark gray, main content)
- **Secondary Text**: `#6B7280` (Muted gray, labels)
- **Muted Text**: `#9CA3AF` (Light gray, helper text)

### Status Colors
- **Error**: `#DC2626` (Red)
- **Success**: `#059669` (Green)
- **Warning**: `#D97706` (Amber)

### Borders
- **Border**: `#E5E7EB`
- **Border Light**: `#F3F4F6`

---

## Typography Scale

### Font Sizes (NativeWind classes)
- `text-display`: 32px / 700 weight - App name, hero text
- `text-title`: 24px / 600 weight - Screen titles
- `text-heading`: 20px / 600 weight - Section headings
- `text-body`: 16px / 400 weight - Body text
- `text-label`: 14px / 500 weight - Input labels, button text
- `text-caption`: 12px / 400 weight - Helper text, captions

### Usage Examples
```tsx
<Text className="text-display">Finoryx</Text>
<Text className="text-title">Welcome Back</Text>
<Text className="text-heading">Account Details</Text>
<Text className="text-body">Your account is secure</Text>
<Text className="text-label">Email Address</Text>
<Text className="text-caption">We'll never share your email</Text>
```

---

## Spacing Scale

Standard spacing using Tailwind utilities:
- `xs`: 4px - Minimal gaps
- `sm`: 8px - Small gaps
- `md`: 16px - Standard gaps
- `lg`: 24px - Large gaps
- `xl`: 32px - Extra large gaps
- `2xl`: 48px - Section gaps

### Usage
```tsx
<View className="gap-md"> // 16px gap
<View className="p-lg">   // 24px padding
<View className="mb-xl">  // 32px margin bottom
```

---

## Border Radius

- `rounded-card`: 16px - Auth cards, containers
- `rounded-button`: 12px - Buttons
- `rounded-input`: 8px - Input fields

---

## Components

### 1. AuthCard
Container for auth screens (login, signup).

**Props:**
- Standard View props
- `className` for customization

**Usage:**
```tsx
<AuthCard>
  <Text>Your content</Text>
</AuthCard>
```

---

### 2. PrimaryButton
Main action button with loading states.

**Props:**
- `title: string` - Button text
- `loading?: boolean` - Show loading spinner
- `variant?: 'primary' | 'secondary' | 'outline'`
- `size?: 'large' | 'medium'`
- `disabled?: boolean`
- Standard Pressable props

**Usage:**
```tsx
<PrimaryButton 
  title="Sign In" 
  loading={isLoading}
  onPress={handleSubmit}
/>

<PrimaryButton 
  title="Cancel" 
  variant="outline"
  onPress={handleCancel}
/>
```

---

### 3. TextInputField
Input field with label, error, and helper text.

**Props:**
- `label: string` - Input label
- `error?: string` - Error message
- `helperText?: string` - Helper text below input
- `required?: boolean` - Show asterisk
- Standard TextInput props

**Usage:**
```tsx
<TextInputField
  label="Email Address"
  value={email}
  onChangeText={setEmail}
  error={errors.email}
  keyboardType="email-address"
  required
/>
```

---

### 4. DividerText
Horizontal line with text (e.g., "or").

**Props:**
- `text: string` - Text in center

**Usage:**
```tsx
<DividerText text="or continue with" />
```

---

## Layout Patterns

### Auth Screen Layout
```tsx
<View className="flex-1 bg-background">
  <ScrollView>
    <View className="px-md py-xl">
      {/* Logo */}
      <View className="items-center mb-xl">
        <Logo size={80} showText />
      </View>

      {/* Title */}
      <View className="mb-lg">
        <Text className="text-title text-text-primary mb-2">
          Welcome Back
        </Text>
        <Text className="text-body text-text-secondary">
          Sign in to continue
        </Text>
      </View>

      {/* Form Card */}
      <AuthCard className="gap-md">
        <TextInputField label="Email" />
        <TextInputField label="Password" secureTextEntry />
        <PrimaryButton title="Sign In" />
      </AuthCard>
    </View>
  </ScrollView>
</View>
```

---

## Design Principles

1. **Clarity**: Every element should be immediately understandable
2. **Consistency**: Use design tokens, not arbitrary values
3. **Minimal**: Remove unnecessary elements
4. **Professional**: Banking-grade polish
5. **Accessible**: Proper contrast, touch targets (min 44px)

---

## Do's and Don'ts

### ✅ Do
- Use design system colors (`text-primary`, `bg-surface`)
- Use spacing scale (`gap-md`, `p-lg`)
- Use typography scale (`text-label`, `text-body`)
- Use components (AuthCard, PrimaryButton)

### ❌ Don't
- Don't use arbitrary colors (`bg-[#123456]`)
- Don't use arbitrary spacing (`p-[17px]`)
- Don't mix font sizes randomly
- Don't create custom components without reason

---

## Status
✅ Design System Ready
✅ Components Created
✅ Colors Defined
✅ Typography Set
✅ Ready for Auth Screen Implementation
