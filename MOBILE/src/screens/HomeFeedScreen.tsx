import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { useAccount } from '../context/AccountContext';
import { ThemedView, ThemedText, ThemedHeader } from '../components/Themed';
import { StoryCircle } from '../components/StoryCircle';
import { FeedPost } from '../components/FeedPost';
import { apiGet } from '../config/api';

type StoryGroup = {
  id?: string;
  username?: string;
  profilePhoto?: string | null;
  hasUnseen?: boolean;
};

type FeedPostRow = {
  id: string;
  author: { username: string; displayName?: string; avatarUri?: string | null };
  location?: string;
  mediaUri: string;
  caption?: string;
  likeCount: number;
  commentCount: number;
  isLiked?: boolean;
  isSaved?: boolean;
};

/** Match FRONTEND `feedAuthorFromApiItem` — API uses flat username/displayName/profilePhoto. */
function feedAuthorFromApiItem(p: Record<string, unknown>): {
  username: string;
  displayName: string | null;
  avatarUri: string | null;
} {
  const author = (p.author ?? null) as Record<string, unknown> | null;
  const account = (p.account ?? null) as Record<string, unknown> | null;
  const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : '');
  const rawUsername =
    str(p.username) ||
    (author ? str(author.username) : '') ||
    (account ? str(account.username) : '');
  const displayNameRaw =
    str(p.displayName) ||
    (author ? str(author.displayName) : '') ||
    (account ? str(account.displayName) : '');
  const avatarUri =
    str(p.profilePhoto) ||
    (author ? str(author.avatarUrl) || str(author.avatarUri) || str(author.profilePhoto) : '') ||
    (account ? str(account.profilePhoto) || str(account.avatarUrl) : '') ||
    null;
  const username = rawUsername || displayNameRaw || 'account';
  const displayName = displayNameRaw ? displayNameRaw : null;
  return { username, displayName, avatarUri: avatarUri || null };
}

function mapFeedToRows(raw: unknown): FeedPostRow[] {
  if (!Array.isArray(raw)) return [];
  const rows: FeedPostRow[] = [];
  for (const p of raw as Record<string, unknown>[]) {
    const id = typeof p.id === 'string' ? p.id : null;
    if (!id) continue;
    const mediaRaw = p.media;
    const mediaArray: string[] =
      Array.isArray(mediaRaw) && mediaRaw.length
        ? (mediaRaw as { url?: string; uri?: string; mediaUrl?: string }[])
            .map((m) => m?.url || m?.uri || m?.mediaUrl)
            .filter((u): u is string => !!u)
        : [];
    const mediaUri = mediaArray[0] ?? '';
    if (!mediaUri) continue;
    const a = feedAuthorFromApiItem(p);
    rows.push({
      id,
      author: { username: a.username, displayName: a.displayName ?? undefined, avatarUri: a.avatarUri },
      location:
        (typeof p.location === 'string' && p.location) ||
        (typeof p.locationName === 'string' && p.locationName) ||
        undefined,
      mediaUri,
      caption: typeof p.caption === 'string' ? p.caption : undefined,
      likeCount: typeof p.likeCount === 'number' ? p.likeCount : Number(p.likesCount) || 0,
      commentCount: typeof p.commentCount === 'number' ? p.commentCount : Number(p.commentsCount) || 0,
      isLiked: !!p.isLiked || !!p.viewerHasLiked,
      isSaved: !!p.isSaved || !!p.viewerHasSaved,
    });
  }
  return rows;
}

export function HomeFeedScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { isLoggedIn } = useAccount();
  const [posts, setPosts] = useState<FeedPostRow[]>([]);
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [myUsername, setMyUsername] = useState<string | undefined>();
  const [myProfilePhoto, setMyProfilePhoto] = useState<string | null | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const openCreateStory = useCallback(() => {
    navigation.navigate('StoryCamera' as never);
  }, [navigation]);

  const load = useCallback(async () => {
    if (!isLoggedIn) {
      setPosts([]);
      setStoryGroups([]);
      setMyUsername(undefined);
      setMyProfilePhoto(undefined);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [me, feedBundle, storyList] = await Promise.all([
        apiGet<{ account?: { username?: string; profilePhoto?: string | null } }>('accounts/me'),
        apiGet<{ items?: unknown[]; feed?: unknown[] }>('posts/feed'),
        apiGet<StoryGroup[] | { items?: StoryGroup[] }>('stories'),
      ]);
      const rawFeed = Array.isArray(feedBundle?.items)
        ? feedBundle.items
        : Array.isArray(feedBundle?.feed)
          ? feedBundle.feed
          : [];
      setPosts(mapFeedToRows(rawFeed));

      const rawStories = Array.isArray(storyList) ? storyList : storyList?.items ?? [];
      setStoryGroups(Array.isArray(rawStories) ? rawStories : []);

      setMyUsername(me.account?.username);
      setMyProfilePhoto(me.account?.profilePhoto ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load feed.');
      setPosts([]);
      setStoryGroups([]);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    void load();
  }, [load]);

  const myStory =
    myUsername != null && myUsername !== ''
      ? storyGroups.find((s) => s.username === myUsername)
      : undefined;
  const othersStories =
    myUsername != null && myUsername !== ''
      ? storyGroups.filter((s) => s.username !== myUsername)
      : storyGroups;

  return (
    <ThemedView style={styles.flex}>
      <ThemedHeader
        title="MOxE"
        left={null}
        right={
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.headerIcon} onPress={openCreateStory}>
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
          {!isLoggedIn ? (
            <ThemedText secondary style={{ paddingRight: theme.spacing.md }}>
              Sign in to see stories
            </ThemedText>
          ) : (
            <>
              {myStory ? (
                <StoryCircle
                  uri={myStory.profilePhoto ?? myProfilePhoto}
                  label="Your story"
                  hasStory
                  onPress={openCreateStory}
                />
              ) : (
                <StoryCircle uri={myProfilePhoto} label="Your story" isAdd onPress={openCreateStory} />
              )}
              {othersStories.map((s, idx) => (
                <StoryCircle
                  key={s.id ?? s.username ?? `story-${idx}`}
                  uri={s.profilePhoto}
                  label={s.username ?? '…'}
                  hasStory
                />
              ))}
            </>
          )}
        </ScrollView>

        {loading ? (
          <View style={styles.centerPad}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        ) : null}

        {error ? (
          <View style={styles.centerPad}>
            <ThemedText secondary style={{ textAlign: 'center' }}>
              {error}
            </ThemedText>
          </View>
        ) : null}

        {!loading && !error && isLoggedIn && posts.length === 0 ? (
          <View style={styles.centerPad}>
            <ThemedText style={{ textAlign: 'center', fontWeight: '600', marginBottom: 6 }}>No posts yet</ThemedText>
            <ThemedText secondary style={{ textAlign: 'center' }}>
              Follow people or create a post — your feed will show up here.
            </ThemedText>
          </View>
        ) : null}

        {!isLoggedIn && !loading ? (
          <View style={styles.centerPad}>
            <ThemedText secondary style={{ textAlign: 'center' }}>Sign in on the home tab to load your feed.</ThemedText>
          </View>
        ) : null}

        {posts.map((p) => (
          <FeedPost
            key={p.id}
            id={p.id}
            author={p.author}
            location={p.location}
            mediaUri={p.mediaUri}
            caption={p.caption}
            likeCount={p.likeCount}
            commentCount={p.commentCount}
            isLiked={p.isLiked}
            isSaved={p.isSaved}
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
  centerPad: { paddingVertical: 24, paddingHorizontal: 16 },
});
