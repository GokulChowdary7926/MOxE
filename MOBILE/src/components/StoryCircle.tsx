import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Avatar } from './Avatar';

interface StoryCircleProps {
  uri?: string | null;
  label: string;
  hasStory?: boolean;
  isAdd?: boolean;
  onPress?: () => void;
}

export function StoryCircle({
  uri,
  label,
  hasStory = true,
  isAdd = false,
  onPress,
}: StoryCircleProps) {
  const { theme } = useTheme();
  const size = 64;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={styles.container}
    >
      <View style={styles.avatarWrap}>
        {hasStory && !isAdd && (
          <View
            style={[
              styles.ring,
              {
                width: size + 4,
                height: size + 4,
                borderRadius: (size + 4) / 2,
                borderWidth: 2,
                borderColor: theme.colors.storyRing[0] ?? theme.colors.primary,
              },
            ]}
          />
        )}
        <View
          style={[
            styles.avatarInner,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: isAdd ? theme.colors.surface : undefined,
              borderWidth: isAdd ? 2 : 0,
              borderColor: theme.colors.border,
            },
          ]}
        >
          {isAdd ? (
            <Text style={{ fontSize: 28, color: theme.colors.text }}>+</Text>
          ) : (
            <Avatar uri={uri} size={size} showStoryRing={false} />
          )}
        </View>
      </View>
      <Text
        numberOfLines={1}
        style={[
          styles.label,
          { color: theme.colors.text, fontSize: theme.typography.caption },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginRight: 12,
    width: 76,
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 4,
  },
  ring: {
    position: 'absolute',
    top: -2,
    left: -2,
  },
  avatarInner: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    textAlign: 'center',
  },
});
