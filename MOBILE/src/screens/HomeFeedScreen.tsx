import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { ThemedView, ThemedText, ThemedHeader } from '../components/Themed';
import { StoryCircle } from '../components/StoryCircle';
import { FeedPost } from '../components/FeedPost';

const MOCK_STORIES = [
  { id: '1', uri: null, label: 'Your Story', hasStory: false, isAdd: true },
  {
    id: '2',
    uri: 'https://picsum.photos/seed/a/100/100',
    label: 'roxy_me',
    hasStory: true,
  },
  {
    id: '3',
    uri: 'https://picsum.photos/seed/b/100/100',
    label: 'sam_2y',
    hasStory: true,
  },
  {
    id: '4',
    uri: 'https://picsum.photos/seed/c/100/100',
    label: 'tham28',
    hasStory: true,
  },
];

const MOCK_POSTS = [
  {
    id: 'p1',
    author: {
      username: 'riley_rhythm',
      displayName: 'Riley',
      avatarUri: 'https://picsum.photos/seed/r/100/100',
    },
    location: 'Italy, Rome',
    mediaUri: 'https://picsum.photos/seed/feed1/800/800',
    caption: 'My personal Italy 🇮🇹',
    likeCount: 1200,
    commentCount: 456,
  },
  {
    id: 'p2',
    author: {
      username: 'e.johnson',
      displayName: 'Eliott Johnson',
      avatarUri: 'https://picsum.photos/seed/e/100/100',
    },
    location: 'Madrid, Spain',
    mediaUri: 'https://picsum.photos/seed/feed2/800/800',
    caption: 'Golden hour ✨',
    likeCount: 2400,
    commentCount: 175,
  },
];

export function HomeFeedScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();

  return (
    <ThemedView style={styles.flex}>
      <ThemedHeader
        title="MOxE"
        left={null}
        right={
          <View style={styles.headerIcons}>
            <TouchableOpacity
              style={styles.headerIcon}
              onPress={() => navigation.navigate('StoryCamera' as never)}
            >
              <Text style={{ color: theme.colors.text, fontSize: 22 }}>➕</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIcon}>
              <Text style={{ color: theme.colors.text, fontSize: 20 }}>🛍️</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIcon}>
              <Text style={{ color: theme.colors.text, fontSize: 20 }}>🔔</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIcon}>
              <Text style={{ color: theme.colors.text, fontSize: 18 }}>⊞</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerIcon}
              onPress={() => navigation.navigate('VoiceCommand' as never)}
            >
              <Text style={{ color: theme.colors.text, fontSize: 18 }}>🎙</Text>
            </TouchableOpacity>
          </View>
        }
      />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.storyTray,
            { paddingVertical: theme.spacing.md, paddingLeft: theme.spacing.md },
          ]}
        >
          {MOCK_STORIES.map((s) => (
            <StoryCircle
              key={s.id}
              uri={s.uri}
              label={s.label}
              hasStory={s.hasStory}
              isAdd={s.isAdd}
            />
          ))}
        </ScrollView>
        {MOCK_POSTS.map((p) => (
          <FeedPost
            key={p.id}
            id={p.id}
            author={p.author}
            location={p.location}
            mediaUri={p.mediaUri}
            caption={p.caption}
            likeCount={p.likeCount}
            commentCount={p.commentCount}
          />
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { paddingBottom: 24 },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerIcon: {
    padding: 4,
  },
  storyTray: {
    marginBottom: 8,
  },
});
