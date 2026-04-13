import React, { useCallback, useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAccount } from '../context/AccountContext';
import { ThemedView, ThemedText, ThemedHeader, ThemedButton } from '../components/Themed';
import { Avatar } from '../components/Avatar';
import { apiGet } from '../config/api';

type MeAccount = {
  username?: string;
  displayName?: string;
  profilePhoto?: string | null;
  bio?: string | null;
  pronouns?: string | null;
  location?: string | null;
  website?: string | null;
  postCount?: number;
  postsCount?: number;
  followerCount?: number;
  followersCount?: number;
  followingCount?: number;
};

export function ProfileScreen() {
  const { accountType } = useAccount();
  const navigation = useNavigation();
  const rootNav = navigation.getParent() as {
    navigate?: (name: string, params?: object) => void;
  } | null;
  const openSettings = () => rootNav?.navigate?.('Settings');
  const openBalance = () => rootNav?.navigate?.('Balance');
  const openBusinessDashboard = () => rootNav?.navigate?.('BusinessDashboard');
  const openCreatorStudio = () => rootNav?.navigate?.('CreatorStudio');
  const openManageHighlights = () => rootNav?.navigate?.('ManageHighlights');

  const [account, setAccount] = useState<MeAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const bundle = await apiGet<{ account?: MeAccount }>('accounts/me');
      setAccount(bundle.account ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load profile.');
      setAccount(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const postsCount = account?.postCount ?? account?.postsCount ?? 0;
  const followersCount = account?.followerCount ?? account?.followersCount ?? 0;
  const followingCount = account?.followingCount ?? 0;
  const handleLine =
    account?.username != null
      ? `@${account.username}${account.pronouns ? ` · ${account.pronouns}` : ''}`
      : '';

  return (
    <ThemedView style={styles.flex}>
      <ThemedHeader
        title={account?.username ?? 'Profile'}
        left={null}
        right={
          <View style={styles.headerRight}>
            <TouchableOpacity>
              <Text style={styles.headerIcon}>➕</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={openSettings}>
              <Text style={styles.headerIcon}>☰</Text>
            </TouchableOpacity>
          </View>
        }
      />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator />
          </View>
        ) : null}
        {error ? (
          <ThemedText secondary style={styles.errorText}>
            {error}
          </ThemedText>
        ) : null}

        <View style={styles.profileTop}>
          <Avatar uri={account?.profilePhoto} size={80} />
          <View style={styles.stats}>
            <View style={styles.stat}>
              <ThemedText style={styles.statNum}>{postsCount}</ThemedText>
              <ThemedText secondary>Posts</ThemedText>
            </View>
            <View style={styles.stat}>
              <ThemedText style={styles.statNum}>{followersCount}</ThemedText>
              <ThemedText secondary>Followers</ThemedText>
            </View>
            <View style={styles.stat}>
              <ThemedText style={styles.statNum}>{followingCount}</ThemedText>
              <ThemedText secondary>Following</ThemedText>
            </View>
          </View>
        </View>

        <ThemedText style={styles.displayName}>{account?.displayName ?? account?.username ?? '—'}</ThemedText>
        {handleLine ? <ThemedText secondary style={styles.metaHandle}>{handleLine}</ThemedText> : null}
        {account?.bio ? <ThemedText secondary style={styles.bio}>{account.bio}</ThemedText> : null}
        {(account?.location || account?.website) ? (
          <ThemedText secondary style={styles.meta}>
            {[account.location, account.website].filter(Boolean).join(' · ')}
          </ThemedText>
        ) : null}

        <View style={styles.primaryActions}>
          <ThemedButton label="Edit Profile" onPress={() => {}} style={styles.primaryActionBtn} />
          <ThemedButton
            label="Promotions"
            onPress={openBusinessDashboard}
            variant="secondary"
            style={styles.primaryActionBtn}
          />
          <ThemedButton
            label="Insights"
            onPress={openCreatorStudio}
            variant="secondary"
            style={styles.primaryActionBtn}
          />
        </View>

        <View style={styles.secondaryActions}>
          {(accountType === 'creator' || accountType === 'business') && (
            <ThemedButton
              label="Balance"
              onPress={openBalance}
              variant="secondary"
              style={styles.secondaryBtn}
            />
          )}
          {accountType === 'business' && (
            <ThemedButton
              label="Business Dashboard"
              onPress={openBusinessDashboard}
              variant="secondary"
              style={styles.secondaryBtn}
            />
          )}
          {accountType === 'creator' && (
            <ThemedButton
              label="Creator Studio"
              onPress={openCreatorStudio}
              variant="secondary"
              style={styles.secondaryBtn}
            />
          )}
        </View>

        <View style={[styles.socialRow, { marginBottom: 8 }]}>
          <View style={styles.socialCircle}>
            <ThemedText style={styles.socialLabel}>Highlights</ThemedText>
          </View>
          <View style={{ flex: 1, justifyContent: 'center', marginLeft: 12 }}>
            <ThemedText secondary style={{ fontSize: 11 }}>
              Story highlights will appear here. Manage them anytime.
            </ThemedText>
          </View>
          <ThemedButton
            label="Manage"
            variant="secondary"
            onPress={openManageHighlights}
            style={{ paddingHorizontal: 8, paddingVertical: 4 }}
            textStyle={{ fontSize: 11 }}
          />
        </View>

        <View style={styles.tabsRow}>
          <ThemedText style={styles.tabActive}>Grid</ThemedText>
          <ThemedText secondary style={styles.tabInactive}>Tagged</ThemedText>
        </View>
        <View style={styles.emptyGridMessage}>
          <ThemedText secondary style={{ textAlign: 'center' }}>
            {postsCount > 0
              ? 'Open MOxE on the web to browse your full post grid.'
              : 'No posts yet. Create from the web app or when your device supports posting.'}
          </ThemedText>
        </View>

        <ThemedText secondary style={styles.accountBadge}>
          Account: {accountType}
        </ThemedText>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  loading: { paddingVertical: 24, alignItems: 'center' },
  errorText: { marginBottom: 12 },
  headerRight: { flexDirection: 'row', gap: 12 },
  headerIcon: { fontSize: 18, color: '#fff' },
  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stats: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginLeft: 24,
  },
  stat: { alignItems: 'center' },
  statNum: { fontWeight: '700', marginBottom: 4 },
  displayName: { fontWeight: '600', marginBottom: 4 },
  metaHandle: { marginBottom: 2, fontSize: 12 },
  bio: { marginBottom: 4 },
  meta: { marginBottom: 12 },
  primaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 10,
  },
  primaryActionBtn: {
    flex: 1,
  },
  secondaryActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  secondaryBtn: {
    flexGrow: 1,
    minWidth: 120,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 4,
  },
  socialCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.12)',
    marginBottom: 8,
  },
  tabActive: {
    flex: 1,
    textAlign: 'center',
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#ff2d55',
    fontWeight: '600',
    fontSize: 12,
  },
  tabInactive: {
    flex: 1,
    textAlign: 'center',
    paddingVertical: 8,
    fontSize: 12,
  },
  emptyGridMessage: {
    paddingVertical: 32,
    paddingHorizontal: 8,
  },
  accountBadge: { fontSize: 12 },
});
