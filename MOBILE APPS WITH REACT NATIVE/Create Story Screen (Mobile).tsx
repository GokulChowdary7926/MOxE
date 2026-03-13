// mobile/src/screens/create/CreateStoryScreen.tsx

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import { launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Slider from '@react-native-community/slider';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import Video from 'react-native-video';

const CreateStoryScreen = ({ navigation }) => {
  const [step, setStep] = useState('capture'); // capture, edit, share
  const [media, setMedia] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [caption, setCaption] = useState('');
  const [privacy, setPrivacy] = useState('PUBLIC');
  const [allowReplies, setAllowReplies] = useState(true);
  const [allowReshares, setAllowReshares] = useState(true);
  const [selectedMusic, setSelectedMusic] = useState(null);
  const [textOverlay, setTextOverlay] = useState(null);
  const [drawing, setDrawing] = useState(null);
  
  const camera = useRef(null);
  const devices = useCameraDevices();
  const device = devices.back;

  const createStoryMutation = useMutation({
    mutationFn: async (formData) => {
      const { data } = await axios.post('/api/stories', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
    onSuccess: () => {
      Alert.alert('Success', 'Story posted successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    },
    onError: (error) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to post story');
    },
  });

  const takePhoto = async () => {
    if (camera.current) {
      const photo = await camera.current.takePhoto({
        qualityPrioritization: 'speed',
        flash: 'off',
      });
      setMedia(photo.path);
      setMediaType('photo');
      setStep('edit');
    }
  };

  const startRecording = async () => {
    if (camera.current) {
      await camera.current.startRecording({
        onRecordingFinished: (video) => {
          setMedia(video.path);
          setMediaType('video');
          setStep('edit');
        },
        onRecordingError: (error) => console.error(error),
      });
    }
  };

  const stopRecording = async () => {
    if (camera.current) {
      await camera.current.stopRecording();
    }
  };

  const pickFromGallery = () => {
    launchImageLibrary(
      {
        mediaType: 'mixed',
        includeBase64: false,
        maxHeight: 1920,
        maxWidth: 1080,
      },
      (response) => {
        if (response.didCancel) return;
        if (response.error) {
          Alert.alert('Error', response.error);
          return;
        }
        setMedia(response.assets[0].uri);
        setMediaType(response.assets[0].type.includes('video') ? 'video' : 'photo');
        setStep('edit');
      }
    );
  };

  const handlePost = async () => {
    const formData = new FormData();
    formData.append('media', {
      uri: media,
      type: mediaType === 'photo' ? 'image/jpeg' : 'video/mp4',
      name: `story.${mediaType === 'photo' ? 'jpg' : 'mp4'}`,
    });
    formData.append('caption', caption);
    formData.append('privacy', privacy);
    formData.append('allowReplies', allowReplies.toString());
    formData.append('allowReshares', allowReshares.toString());
    if (selectedMusic) {
      formData.append('music', JSON.stringify(selectedMusic));
    }
    if (textOverlay) {
      formData.append('textOverlay', JSON.stringify(textOverlay));
    }
    if (drawing) {
      formData.append('drawing', JSON.stringify(drawing));
    }

    createStoryMutation.mutate(formData);
  };

  if (!device) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      {step === 'capture' && (
        <>
          <Camera
            ref={camera}
            style={{ flex: 1 }}
            device={device}
            isActive={true}
            photo={true}
            video={true}
          />

          {/* Capture Controls */}
          <View className="absolute bottom-10 left-0 right-0 flex-row items-center justify-center">
            <TouchableOpacity
              onPress={pickFromGallery}
              className="absolute left-8 w-12 h-12 bg-white/20 rounded-full items-center justify-center"
            >
              <Icon name="image" size={24} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={takePhoto}
              onLongPress={startRecording}
              onPressOut={stopRecording}
              className="w-20 h-20 bg-white rounded-full items-center justify-center"
            >
              <View className="w-16 h-16 bg-white rounded-full border-2 border-gray-300" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="absolute right-8 w-12 h-12 bg-white/20 rounded-full items-center justify-center"
            >
              <Icon name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </>
      )}

      {step === 'edit' && (
        <View className="flex-1">
          {/* Media Preview */}
          {mediaType === 'photo' ? (
            <Image source={{ uri: media }} className="flex-1" resizeMode="contain" />
          ) : (
            <Video
              source={{ uri: media }}
              style={{ flex: 1 }}
              resizeMode="contain"
              repeat={true}
            />
          )}

          {/* Edit Controls */}
          <View className="absolute bottom-0 left-0 right-0 bg-black/90 p-4">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity className="items-center mr-6">
                <View className="w-12 h-12 bg-white/20 rounded-full items-center justify-center">
                  <Icon name="format-text" size={24} color="white" />
                </View>
                <Text className="text-white text-xs mt-1">Text</Text>
              </TouchableOpacity>

              <TouchableOpacity className="items-center mr-6">
                <View className="w-12 h-12 bg-white/20 rounded-full items-center justify-center">
                  <Icon name="music" size={24} color="white" />
                </View>
                <Text className="text-white text-xs mt-1">Music</Text>
              </TouchableOpacity>

              <TouchableOpacity className="items-center mr-6">
                <View className="w-12 h-12 bg-white/20 rounded-full items-center justify-center">
                  <Icon name="sticker-emoji" size={24} color="white" />
                </View>
                <Text className="text-white text-xs mt-1">Stickers</Text>
              </TouchableOpacity>

              <TouchableOpacity className="items-center mr-6">
                <View className="w-12 h-12 bg-white/20 rounded-full items-center justify-center">
                  <Icon name="draw" size={24} color="white" />
                </View>
                <Text className="text-white text-xs mt-1">Draw</Text>
              </TouchableOpacity>

              <TouchableOpacity className="items-center mr-6">
                <View className="w-12 h-12 bg-white/20 rounded-full items-center justify-center">
                  <Icon name="crop" size={24} color="white" />
                </View>
                <Text className="text-white text-xs mt-1">Crop</Text>
              </TouchableOpacity>

              <TouchableOpacity className="items-center mr-6">
                <View className="w-12 h-12 bg-white/20 rounded-full items-center justify-center">
                  <Icon name="filter" size={24} color="white" />
                </View>
                <Text className="text-white text-xs mt-1">Filters</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Navigation Buttons */}
          <View className="absolute top-12 left-4 right-4 flex-row justify-between">
            <TouchableOpacity
              onPress={() => setStep('capture')}
              className="w-10 h-10 bg-black/50 rounded-full items-center justify-center"
            >
              <Icon name="arrow-left" size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setStep('share')}
              className="px-5 py-2 bg-blue-500 rounded-full"
            >
              <Text className="text-white font-semibold">Next</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {step === 'share' && (
        <ScrollView className="flex-1 bg-white dark:bg-gray-900">
          <View className="p-4">
            {/* Caption */}
            <View className="mb-6">
              <Text className="text-gray-700 dark:text-gray-300 font-semibold mb-2">
                Caption
              </Text>
              <TextInput
                value={caption}
                onChangeText={setCaption}
                placeholder="Write a caption..."
                multiline
                numberOfLines={3}
                className="border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-gray-900 dark:text-white"
              />
            </View>

            {/* Privacy */}
            <View className="mb-6">
              <Text className="text-gray-700 dark:text-gray-300 font-semibold mb-2">
                Privacy
              </Text>
              {['PUBLIC', 'FOLLOWERS_ONLY', 'CLOSE_FRIENDS_ONLY'].map((option) => (
                <TouchableOpacity
                  key={option}
                  onPress={() => setPrivacy(option)}
                  className="flex-row items-center py-2"
                >
                  <View
                    className={`w-5 h-5 rounded-full border-2 mr-3 ${
                      privacy === option
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-400'
                    }`}
                  />
                  <Text className="text-gray-700 dark:text-gray-300">
                    {option.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Options */}
            <View className="mb-6">
              <Text className="text-gray-700 dark:text-gray-300 font-semibold mb-2">
                Options
              </Text>
              
              <View className="flex-row items-center justify-between py-2">
                <Text className="text-gray-700 dark:text-gray-300">Allow Replies</Text>
                <TouchableOpacity
                  onPress={() => setAllowReplies(!allowReplies)}
                  className={`w-12 h-6 rounded-full ${
                    allowReplies ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                >
                  <View
                    className={`w-5 h-5 rounded-full bg-white absolute top-0.5 ${
                      allowReplies ? 'right-0.5' : 'left-0.5'
                    }`}
                  />
                </TouchableOpacity>
              </View>

              <View className="flex-row items-center justify-between py-2">
                <Text className="text-gray-700 dark:text-gray-300">Allow Reshares</Text>
                <TouchableOpacity
                  onPress={() => setAllowReshares(!allowReshares)}
                  className={`w-12 h-6 rounded-full ${
                    allowReshares ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                >
                  <View
                    className={`w-5 h-5 rounded-full bg-white absolute top-0.5 ${
                      allowReshares ? 'right-0.5' : 'left-0.5'
                    }`}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Post Button */}
            <TouchableOpacity
              onPress={handlePost}
              disabled={createStoryMutation.isPending}
              className="bg-blue-500 py-3 rounded-lg items-center mb-4"
            >
              {createStoryMutation.isPending ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-semibold">Share to Story</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="py-3 rounded-lg items-center"
            >
              <Text className="text-gray-500">Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

export default CreateStoryScreen;