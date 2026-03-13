// mobile/src/components/story/StoryTray.tsx

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import { useSelector } from 'react-redux';

// Components
import StoryCircle from './StoryCircle';
import LoadingIndicator from '../common/LoadingIndicator';

const StoryTray = ({ navigation }) => {
  const { currentAccount } = useSelector((state) => state.auth);

  const { data: stories, isLoading } = useQuery({
    queryKey: ['stories', 'feed'],
    queryFn: async () => {
      const { data } = await axios.get('/api/stories/feed');
      return data.stories;
    },
  });

  if (isLoading) {
    return (
      <View className="h-24 justify-center items-center">
        <LoadingIndicator size="small" />
      </View>
    );
  }

  const handleCreateStory = () => {
    navigation.navigate('CreateStory');
  };

  const handleStoryPress = (story) => {
    navigation.navigate('Story', { storyId: story.id, stories });
  };

  return (
    <View className="mb-4">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-4"
      >
        {/* Create Story Button */}
        <TouchableOpacity
          onPress={handleCreateStory}
          className="items-center mr-4"
        >
          <View className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 items-center justify-center border-2 border-blue-500">
            <Icon name="plus" size={30} color="#3b82f6" />
          </View>
          <Text className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Your Story
          </Text>
        </TouchableOpacity>

        {/* Stories */}
        {stories?.map((story) => (
          <StoryCircle
            key={story.id}
            story={story}
            onPress={() => handleStoryPress(story)}
          />
        ))}
      </ScrollView>
    </View>
  );
};

export default StoryTray;