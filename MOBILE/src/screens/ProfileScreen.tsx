import React from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAccount } from '../context/AccountContext';
import { ThemedView, ThemedText, ThemedHeader, ThemedButton } from '../components/Themed';
import { Avatar } from '../components/Avatar';

export function ProfileScreen() {
  const { accountType } = useAccount();
  const navigation = useNavigation();
  const rootNav = navigation.getParent() as any;
  const openSettings = () => rootNav?.navigate?.('Settings');
  const openBalance = () => rootNav?.navigate?.('Balance');
  const openBusinessDashboard = () => rootNav?.navigate?.('BusinessDashboard');
  const openCreatorStudio = () => rootNav?.navigate?.('CreatorStudio');
  const openJobHub = () => rootNav?.navigate?.('JobHub');
  const openManageHighlights = () => rootNav?.navigate?.('ManageHighlights');

  return (
    <ThemedView style={styles.flex}>
      <ThemedHeader
        title="e.johnson"
        left={null}
        right={
          <View style={styles.headerRight}>
            <TouchableOpacity><Text style={styles.headerIcon}>➕</Text></TouchableOpacity>
            <TouchableOpacity onPress={openSettings}><Text style={styles.headerIcon}>☰</Text></TouchableOpacity>
          </View>
        }
      />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileTop}>
          <Avatar uri="https://picsum.photos/seed/profile/150/150" size={80} />
          <View style={styles.stats}>
            <View style={styles.stat}>
              <ThemedText style={styles.statNum}>21</ThemedText>
              <ThemedText secondary>Posts</ThemedText>
            </View>
            <View style={styles.stat}>
              <ThemedText style={styles.statNum}>563</ThemedText>
              <ThemedText secondary>Followers</ThemedText>
            </View>
            <View style={styles.stat}>
              <ThemedText style={styles.statNum}>172</ThemedText>
              <ThemedText secondary>Following</ThemedText>
            </View>
          </View>
        </View>
        <ThemedText style={styles.displayName}>Eliott Johnson</ThemedText>
        <ThemedText secondary style={styles.metaHandle}>@e.johnson • she/her</ThemedText>
        <ThemedText secondary style={styles.bio}>
          Freelance Artist/Generalist TD. Available Now
        </ThemedText>
        <ThemedText secondary style={styles.meta}>United Kingdom · linktr.ee/moxe</ThemedText>

        {/* Primary profile actions row – Edit Profile, Promotions, Insights */}
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

        {/* Secondary actions based on account type (Balance / Dashboards) */}
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
          {accountType === 'job' && (
            <ThemedButton
              label="Job Hub"
              onPress={openJobHub}
              variant="secondary"
              style={styles.secondaryBtn}
            />
          )}
        </View>

        {/* Highlights row */}
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

        {/* Social / link circles row */}
        <View style={styles.socialRow}>
          <View style={styles.socialCircle}>
            <ThemedText style={styles.socialLabel}>New</ThemedText>
          </View>
          <View style={styles.socialCircle}>
            <ThemedText style={styles.socialLabel}>Be</ThemedText>
          </View>
          <View style={styles.socialCircle}>
            <ThemedText style={styles.socialLabel}>Dr</ThemedText>
          </View>
          <View style={styles.socialCircle}>
            <ThemedText style={styles.socialLabel}>Pin</ThemedText>
          </View>
          <View style={styles.socialCircle}>
            <ThemedText style={styles.socialLabel}>Food</ThemedText>
          </View>
        </View>

        {/* Simple tab row + grid placeholders to mimic layout */}
        <View style={styles.tabsRow}>
          <ThemedText style={styles.tabActive}>Grid</ThemedText>
          <ThemedText secondary style={styles.tabInactive}>Tagged</ThemedText>
        </View>
        <View style={styles.grid}>
          <View style={styles.gridItem} />
          <View style={styles.gridItem} />
          <View style={styles.gridItem} />
          <View style={styles.gridItem} />
          <View style={styles.gridItem} />
          <View style={styles.gridItem} />
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -2,
    marginBottom: 16,
  },
  gridItem: {
    width: '33.333%',
    aspectRatio: 0.8,
    padding: 2,
  },
  accountBadge: { fontSize: 12 },
});
