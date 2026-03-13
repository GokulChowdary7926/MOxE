import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Avatar } from './Avatar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface FeedPostProps {
  id: string;
  author: { username: string; displayName?: string; avatarUri?: string | null };
  location?: string;
  mediaUri: string;
  caption?: string;
  likeCount?: number;
  commentCount?: number;
  isLiked?: boolean;
  isSaved?: boolean;
}

export function FeedPost({
  id,
  author,
  location,
  mediaUri,
  caption,
  likeCount = 0,
  commentCount = 0,
  isLiked: initialLiked = false,
  isSaved: initialSaved = false,
}: FeedPostProps) {
  const { theme } = useTheme();
  const [isLiked, setLiked] = useState(initialLiked);
  const [isSaved, setSaved] = useState(initialSaved);
  const [likes, setLikes] = useState(likeCount);

  const toggleLike = () => {
    setLiked((p) => !p);
    setLikes((n) => (isLiked ? n - 1 : n + 1));
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { paddingHorizontal: theme.spacing.md }]}>
        <View style={styles.headerLeft}>
          <Avatar uri={author.avatarUri} size={32} />
          <View style={styles.headerText}>
            <Text
              style={[
                styles.username,
                { color: theme.colors.text, fontSize: theme.typography.body },
              ]}
            >
              {author.username}
            </Text>
            {location ? (
              <Text
                style={[
                  styles.location,
                  {
                    color: theme.colors.textSecondary,
                    fontSize: theme.typography.caption,
                  },
                ]}
              >
                {location}
              </Text>
            ) : null}
          </View>
        </View>
        <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={{ color: theme.colors.text, fontSize: 18 }}>⋯</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.media}>
        <Image
          source={{ uri: mediaUri }}
          style={styles.mediaImage}
          resizeMode="cover"
        />
      </View>

      <View style={[styles.actions, { paddingHorizontal: theme.spacing.md }]}>
        <View style={styles.actionsLeft}>
          <TouchableOpacity onPress={toggleLike} style={styles.actionBtn}>
            <Text style={styles.actionIcon}>{isLiked ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Text style={styles.actionIcon}>💬</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Text style={styles.actionIcon}>✈️</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => setSaved((p) => !p)}>
          <Text style={styles.actionIcon}>{isSaved ? '🔖' : '📑'}</Text>
        </TouchableOpacity>
      </View>

      {likes > 0 && (
        <Text
          style={[
            styles.likes,
            {
              color: theme.colors.text,
              fontSize: theme.typography.body,
              paddingHorizontal: theme.spacing.md,
            },
          ]}
        >
          {likes} {likes === 1 ? 'like' : 'likes'}
        </Text>
      )}

      {caption ? (
        <View style={[styles.captionWrap, { paddingHorizontal: theme.spacing.md }]}>
          <Text
            style={[
              styles.caption,
              {
                color: theme.colors.text,
                fontSize: theme.typography.body,
              },
            ]}
          >
            <Text style={{ fontWeight: '600' }}>{author.username}</Text> {caption}
          </Text>
        </View>
      ) : null}

      {commentCount > 0 && (
        <TouchableOpacity
          style={[
            styles.commentsCta,
            {
              paddingHorizontal: theme.spacing.md,
            },
          ]}
        >
          <Text
            style={{
              color: theme.colors.textSecondary,
              fontSize: theme.typography.body,
            }}
          >
            View all {commentCount} comments
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    marginLeft: 10,
  },
  username: {
    fontWeight: '600',
  },
  location: {
    marginTop: 2,
  },
  media: {
    width: SCREEN_WIDTH,
    aspectRatio: 1,
    backgroundColor: '#222',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  actionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionBtn: {
    padding: 4,
  },
  actionIcon: {
    fontSize: 22,
  },
  likes: {
    fontWeight: '600',
    marginBottom: 4,
  },
  captionWrap: {
    marginBottom: 4,
  },
  caption: {
    lineHeight: 20,
  },
  commentsCta: {
    marginBottom: 8,
  },
});
