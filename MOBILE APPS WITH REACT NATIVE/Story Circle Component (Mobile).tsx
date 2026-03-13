// mobile/src/components/story/StoryCircle.tsx

import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const StoryCircle = ({ story, onPress }) => {
  const hasUnviewed = story.hasUnviewed;

  return (
    <TouchableOpacity onPress={onPress} className="items-center mr-4">
      <LinearGradient
        colors={
          hasUnviewed
            ? ['#f09433', '#e6683c', '#dc2743', '#cc2366', '#bc1888']
            : ['#d1d5db', '#9ca3af']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="p-[2px] rounded-full"
      >
        <Image
          source={{ uri: story.account.profilePhoto }}
          className="w-16 h-16 rounded-full border-2 border-white dark:border-gray-900"
        />
      </LinearGradient>
      <Text className="text-xs text-gray-600 dark:text-gray-400 mt-1">
        {story.account.displayName.length > 10
          ? story.account.displayName.substring(0, 8) + '...'
          : story.account.displayName}
      </Text>
    </TouchableOpacity>
  );
};

export default StoryCircle;