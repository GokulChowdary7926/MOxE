import React from 'react';
import { View, Image, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface AvatarProps {
  uri?: string | null;
  size?: number;
  showStoryRing?: boolean;
  style?: ViewStyle;
}

export function Avatar({ uri, size = 40, showStoryRing = false, style }: AvatarProps) {
  const { theme } = useTheme();
  const ringColors = theme.colors.storyRing;

  const container = (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          overflow: 'hidden',
          backgroundColor: theme.colors.surface,
        },
        style,
      ]}
    >
      {uri ? (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: theme.colors.border },
          ]}
        />
      )}
    </View>
  );

  if (showStoryRing) {
    return (
      <View
        style={[
          styles.ringWrapper,
          {
            width: size + 4,
            height: size + 4,
            borderRadius: (size + 4) / 2,
            padding: 2,
          },
        ]}
      >
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: (size + 4) / 2,
              borderWidth: 2,
              borderColor: ringColors[0] ?? theme.colors.primary,
            },
          ]}
        />
        <View style={[styles.ringInner, { width: size, height: size, borderRadius: size / 2 }]}>
          {container}
        </View>
      </View>
    );
  }

  return container;
}

const styles = StyleSheet.create({
  ringWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringInner: {
    overflow: 'hidden',
  },
});
