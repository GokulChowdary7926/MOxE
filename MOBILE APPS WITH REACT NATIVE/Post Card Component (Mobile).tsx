// mobile/src/components/post/PostCard.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { formatDistanceToNow } from 'date-fns';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import Video from 'react-native-video';
import { launchImageLibrary } from 'react-native-image-picker';

// Components
import CommentSection from '../comment/CommentSection';
import UserAvatar from '../common/UserAvatar';

const PostCard = ({ post, navigation }) => {
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [showComments, setShowComments] = useState(false);
  const [isSaved, setIsSaved] = useState(post.isSaved);
  const [showMenu, setShowMenu] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  
  const dispatch = useDispatch();
  const { currentAccount } = useSelector((state) => state.auth);

  const handleLike = async () => {
    try {
      if (isLiked) {
        await axios.delete(`/api/posts/${post.id}/like`);
        setIsLiked(false);
        setLikeCount((prev) => prev - 1);
      } else {
        await axios.post(`/api/posts/${post.id}/like`);
        setIsLiked(true);
        setLikeCount((prev) => prev + 1);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleSave = async () => {
    try {
      if (isSaved) {
        await axios.delete(`/api/posts/${post.id}/save`);
        setIsSaved(false);
      } else {
        await axios.post(`/api/posts/${post.id}/save`);
        setIsSaved(true);
      }
    } catch (error) {
      console.error('Error toggling save:', error);
    }
  };

  const handleShare = () => {
    // Open share dialog
    Alert.alert('Share', 'Choose sharing option', [
      { text: 'Share to Feed' },
      { text: 'Share to Story' },
      { text: 'Copy Link' },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleProfilePress = () => {
    navigation.navigate('Profile', { userId: post.account.id });
  };

  const handleMediaPress = () => {
    if (post.media.length > 1) {
      // Open carousel modal
    } else if (post.media[0].type === 'video') {
      // Open video player
    }
  };

  const renderMedia = () => {
    const media = post.media[currentMediaIndex];

    if (media.type === 'video') {
      return (
        <Video
          source={{ uri: media.url }}
          style={{ width: '100%', height: 400 }}
          paused={true}
          resizeMode="cover"
        />
      );
    }

    return (
      <Image
        source={{ uri: media.url }}
        style={{ width: '100%', height: 400 }}
        resizeMode="cover"
      />
    );
  };

  return (
    <View className="mb-4 bg-white dark:bg-gray-800">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <TouchableOpacity
          onPress={handleProfilePress}
          className="flex-row items-center space-x-3"
        >
          <UserAvatar
            source={post.account.profilePhoto}
            size="md"
            verified={post.account.verifiedBadge}
          />
          <View>
            <Text className="font-semibold text-gray-900 dark:text-white">
              {post.account.displayName}
            </Text>
            <Text className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              {post.location && ` • ${post.location}`}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setShowMenu(true)}>
          <Icon name="dots-horizontal" size={24} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* Media */}
      <TouchableOpacity onPress={handleMediaPress} activeOpacity={0.9}>
        {renderMedia()}
      </TouchableOpacity>

      {/* Actions */}
      <View className="px-4 py-3">
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center space-x-4">
            <TouchableOpacity onPress={handleLike}>
              <Icon
                name={isLiked ? 'heart' : 'heart-outline'}
                size={28}
                color={isLiked ? '#ef4444' : '#6b7280'}
              />
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => setShowComments(true)}>
              <Icon name="comment-outline" size={26} color="#6b7280" />
            </TouchableOpacity>
            
            <TouchableOpacity onPress={handleShare}>
              <Icon name="share-outline" size={26} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={handleSave}>
            <Icon
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={26}
              color={isSaved ? '#3b82f6' : '#6b7280'}
            />
          </TouchableOpacity>
        </View>

        {/* Like count */}
        <Text className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
          {likeCount.toLocaleString()} likes
        </Text>

        {/* Caption */}
        {post.caption && (
          <View className="flex-row mb-1">
            <Text className="font-semibold text-gray-900 dark:text-white mr-2">
              {post.account.username}
            </Text>
            <Text className="text-gray-700 dark:text-gray-300 flex-1">
              {post.caption}
            </Text>
          </View>
        )}

        {/* View comments link */}
        {post.commentCount > 0 && (
          <TouchableOpacity onPress={() => setShowComments(true)}>
            <Text className="text-sm text-gray-500">
              View all {post.commentCount} comments
            </Text>
          </TouchableOpacity>
        )}

        {/* Comment input */}
        <TouchableOpacity
          onPress={() => setShowComments(true)}
          className="flex-row items-center mt-2"
        >
          <UserAvatar
            source={currentAccount?.profilePhoto}
            size="sm"
            className="mr-2"
          />
          <Text className="text-sm text-gray-500">Add a comment...</Text>
        </TouchableOpacity>
      </View>

      {/* Comments Modal */}
      <Modal
        visible={showComments}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowComments(false)}
      >
        <CommentSection
          postId={post.id}
          onClose={() => setShowComments(false)}
        />
      </Modal>

      {/* Menu Modal */}
      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/50"
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-3xl p-4">
            {post.account.id === currentAccount?.id ? (
              <>
                <TouchableOpacity className="flex-row items-center py-3 space-x-3">
                  <Icon name="pencil" size={24} color="#6b7280" />
                  <Text className="text-gray-900 dark:text-white">Edit Post</Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-row items-center py-3 space-x-3">
                  <Icon name="archive" size={24} color="#6b7280" />
                  <Text className="text-gray-900 dark:text-white">Archive</Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-row items-center py-3 space-x-3">
                  <Icon name="delete" size={24} color="#ef4444" />
                  <Text className="text-red-500">Delete</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity className="flex-row items-center py-3 space-x-3">
                  <Icon name="account-minus" size={24} color="#6b7280" />
                  <Text className="text-gray-900 dark:text-white">Unfollow</Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-row items-center py-3 space-x-3">
                  <Icon name="eye-off" size={24} color="#6b7280" />
                  <Text className="text-gray-900 dark:text-white">Mute</Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-row items-center py-3 space-x-3">
                  <Icon name="block-helper" size={24} color="#ef4444" />
                  <Text className="text-red-500">Block</Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-row items-center py-3 space-x-3">
                  <Icon name="flag" size={24} color="#ef4444" />
                  <Text className="text-red-500">Report</Text>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity
              onPress={() => setShowMenu(false)}
              className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
            >
              <Text className="text-center text-gray-500">Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default PostCard;