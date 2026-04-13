import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
  TouchableOpacityProps,
  TextInputProps,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export function ThemedView({
  style,
  ...props
}: { style?: ViewStyle } & React.ComponentProps<typeof View>) {
  const { theme } = useTheme();
  return (
    <View
      style={[{ backgroundColor: theme.colors.background }, style]}
      {...props}
    />
  );
}

export function ThemedSurface({
  style,
  ...props
}: { style?: ViewStyle } & React.ComponentProps<typeof View>) {
  const { theme } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.md,
          borderWidth: StyleSheet.hairlineWidth,
        },
        style,
      ]}
      {...props}
    />
  );
}

export function ThemedText({
  style,
  secondary,
  ...props
}: { style?: StyleProp<TextStyle>; secondary?: boolean } & React.ComponentProps<typeof Text>) {
  const { theme } = useTheme();
  const color = secondary ? theme.colors.textSecondary : theme.colors.text;
  return (
    <Text
      style={[{ color, fontSize: theme.typography.body }, style]}
      {...props}
    />
  );
}

export function ThemedButton({
  label,
  onPress,
  variant = 'primary',
  style,
  textStyle,
  ...props
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  style?: ViewStyle;
  textStyle?: TextStyle;
} & Omit<TouchableOpacityProps, 'children'>) {
  const { theme } = useTheme();
  const bg =
    variant === 'primary'
      ? theme.colors.primary
      : variant === 'danger'
        ? theme.colors.danger
        : theme.colors.surface;
  const textColor = variant === 'secondary' ? theme.colors.text : '#fff';
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        {
          backgroundColor: bg,
          paddingVertical: theme.spacing.sm,
          paddingHorizontal: theme.spacing.md,
          borderRadius: theme.radius.md,
          alignItems: 'center',
        },
        style,
      ]}
      activeOpacity={0.8}
      {...props}
    >
      <Text style={[{ color: textColor, fontSize: theme.typography.body }, textStyle]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export function ThemedInput({
  style,
  placeholderTextColor,
  ...props
}: TextInputProps) {
  const { theme } = useTheme();
  return (
    <TextInput
      placeholderTextColor={placeholderTextColor ?? theme.colors.textSecondary}
      style={[
        {
          color: theme.colors.text,
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.md,
          borderWidth: StyleSheet.hairlineWidth,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.sm,
          fontSize: theme.typography.body,
        },
        style,
      ]}
      {...props}
    />
  );
}

export function ThemedHeader({
  title,
  left,
  right,
  style,
}: {
  title: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  style?: ViewStyle;
}) {
  const { theme } = useTheme();
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.sm,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
        },
        style,
      ]}
    >
      <View style={{ minWidth: 48, alignItems: 'flex-start' }}>{left}</View>
      <Text
        style={{
          color: theme.colors.text,
          fontSize: theme.typography.title,
          fontWeight: '600',
        }}
      >
        {title}
      </Text>
      <View style={{ minWidth: 48, alignItems: 'flex-end' }}>{right}</View>
    </View>
  );
}
