// mobile/src/screens/story/StoryScreen.tsx

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Dimensions,
  TextInput,
  Animated,
  PanResponder,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Video from 'react-native-video';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import LinearGradient from 'react-native-linear-gradient';

const { width, height } = Dimensions.get('window');

const StoryScreen = ({ route, navigation }) => {
  const { storyId, stories: initialStories } = route.params;
  const [currentIndex, setCurrentIndex] = useState(
    initialStories.findIndex((s) => s.id === storyId)
  );
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showReactions, setShowReactions] = useState(false);
  
  const progressAnim = useRef(new Animated.Value(0)).current;
  const videoRef = useRef(null);
  const storyDuration = 5000; // 5 seconds per story

  const currentStory = initialStories[currentIndex];

  // Mark story as viewed
  const viewStoryMutation = useMutation({
    mutationFn: async () => {
      await axios.post(`/api/stories/${currentStory.id}/view`);
    },
  });

  // Send reply mutation
  const replyMutation = useMutation({
    mutationFn: async (message: string) => {
      await axios.post(`/api/stories/${currentStory.id}/reply`, { message });
    },
    onSuccess: () => {
      setReplyText('');
      setShowReply(false);
    },
  });

  useEffect(() => {
    viewStoryMutation.mutate();
  }, [currentIndex]);

  useEffect(() => {
    if (!isPaused) {
      startProgress();
    }
    return () => {
      progressAnim.stopAnimation();
    };
  }, [currentIndex, isPaused]);

  const startProgress = () => {
    progressAnim.setValue(0);
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: storyDuration,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        goToNext();
      }
    });
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      navigation.goBack();
    }
  };

  const goToNext = () => {
    if (currentIndex < initialStories.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      navigation.goBack();
    }
  };

  const handleTouch = (evt) => {
    const { locationX, locationY } = evt.nativeEvent;
    
    // Check if tap is on left or right half
    if (locationX < width / 3) {
      goToPrevious();
    } else if (locationX > (width * 2) / 3) {
      goToNext();
    } else {
      // Middle third - toggle pause
      setIsPaused(!isPaused);
    }
  };

  const handleLongPress = () => {
    setIsPaused(true);
  };

  const handlePressOut = () => {
    setIsPaused(false);
  };

  const handleSendReply = () => {
    if (!replyText.trim()) return;
    replyMutation.mutate(replyText);
  };

  const handleReaction = (emoji) => {
    replyMutation.mutate(emoji);
    setShowReactions(false);
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  // Pan responder for swipe gestures
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderRelease: (evt, gestureState) => {
      if (gestureState.dy > 50) {
        // Swipe down to close
        navigation.goBack();
      }
    },
  });

  return (
    <View className="flex-1 bg-black" {...panResponder.panHandlers}>
      {/* Status bar background */}
      <View className="absolute top-0 left-0 right-0 h-12 bg-black/50 z-10" />

      {/* Progress bars */}
      <View className="absolute top-12 left-0 right-0 z-20 flex-row px-2">
        {initialStories.map((_, index) => (
          <View
            key={index}
            className="flex-1 h-0.5 mx-0.5 bg-white/30 rounded-full overflow-hidden"
          >
            {index === currentIndex && (
              <Animated.View
                style={[
                  { width: progressWidth, height: '100%' },
                  { backgroundColor: 'white' },
                ]}
              />
            )}
            {index < currentIndex && (
              <View style={{ backgroundColor: 'white', height: '100%', width: '100%' }} />
            )}
          </View>
        ))}
      </View>

      {/* Header */}
      <View className="absolute top-14 left-4 right-4 z-20 flex-row items-center">
        <TouchableOpacity
          onPress={() => navigation.navigate('Profile', { userId: currentStory.account.id })}
          className="flex-row items-center flex-1"
        >
          <Image
            source={{ uri: currentStory.account.profilePhoto }}
            className="w-10 h-10 rounded-full border-2 border-white"
          />
          <View className="ml-3">
            <Text className="text-white font-semibold">
              {currentStory.account.displayName}
            </Text>
            <Text className="text-white/70 text-xs">
              {formatDistanceToNow(new Date(currentStory.createdAt), { addSuffix: true })}
            </Text>
          </View>
        </TouchableOpacity>

        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => setShowReactions(true)} className="mr-4">
            <Icon name="heart-outline" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="close" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Story content */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleTouch}
        onLongPress={handleLongPress}
        onPressOut={handlePressOut}
        className="flex-1 justify-center"
      >
        {currentStory.type === 'image' ? (
          <Image
            source={{ uri: currentStory.media }}
            className="w-full h-full"
            resizeMode="contain"
          />
        ) : (
          <Video
            ref={videoRef}
            source={{ uri: currentStory.media }}
            style={{ width, height }}
            resizeMode="contain"
            paused={isPaused}
            repeat={false}
            muted={false}
          />
        )}
      </TouchableOpacity>

      {/* Story info overlay */}
      {currentStory.location && (
        <View className="absolute bottom-24 left-4 flex-row items-center bg-black/50 rounded-full px-3 py-1.5">
          <Icon name="map-marker" size={16} color="white" />
          <Text className="text-white text-sm ml-1">{currentStory.location}</Text>
        </View>
      )}

      {/* Music indicator */}
      {currentStory.music && (
        <View className="absolute bottom-24 right-4 flex-row items-center bg-black/50 rounded-full px-3 py-1.5">
          <Icon name="music" size={16} color="white" />
          <Text className="text-white text-sm ml-1">{currentStory.music}</Text>
        </View>
      )}

      {/* Reactions picker */}
      {showReactions && (
        <View className="absolute bottom-32 left-0 right-0 items-center z-30">
          <View className="bg-white rounded-full px-6 py-3 flex-row space-x-4 shadow-lg">
            {['❤️', '😂', '😮', '😢', '👍'].map((emoji) => (
              <TouchableOpacity
                key={emoji}
                onPress={() => handleReaction(emoji)}
                className="w-10 h-10 items-center justify-center"
              >
                <Text className="text-2xl">{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Reply input */}
      {currentStory.allowReplies && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="absolute bottom-0 left-0 right-0"
        >
          {!showReply ? (
            <TouchableOpacity
              onPress={() => setShowReply(true)}
              className="bg-white/20 mx-4 mb-6 rounded-full px-4 py-3"
            >
              <Text className="text-white">Reply to story...</Text>
            </TouchableOpacity>
          ) : (
            <View className="bg-black/90 pt-4 px-4 pb-6">
              <View className="flex-row items-center space-x-2">
                <TextInput
                  value={replyText}
                  onChangeText={setReplyText}
                  placeholder="Type your reply..."
                  placeholderTextColor="#ffffff80"
                  className="flex-1 bg-white/20 rounded-full px-4 py-3 text-white"
                  autoFocus
                  multiline
                />
                <TouchableOpacity
                  onPress={handleSendReply}
                  disabled={!replyText.trim()}
                  className="bg-blue-500 rounded-full px-4 py-3 disabled:opacity-50"
                >
                  <Text className="text-white font-semibold">Send</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </KeyboardAvoidingView>
      )}

      {/* Tap indicators (for UX) */}
      <View className="absolute top-0 bottom-0 left-0 w-1/3 z-10" />
      <View className="absolute top-0 bottom-0 right-0 w-1/3 z-10" />
    </View>
  );
};

export default StoryScreen;