import React, { useState } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, Switch } from 'react-native';
import { ThemedView, ThemedText, ThemedHeader } from '../../components/Themed';

type RowProps = {
  label: string;
  description?: string;
  onPress?: () => void;
};

function SettingsRow({ label, description, onPress }: RowProps) {
  return (
    <TouchableOpacity activeOpacity={onPress ? 0.7 : 1} onPress={onPress} style={styles.row}>
      <View style={styles.rowText}>
        <ThemedText style={styles.rowLabel}>{label}</ThemedText>
        {description ? (
          <ThemedText secondary style={styles.rowDescription}>
            {description}
          </ThemedText>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

export function PrivacySettingsScreen() {
  const [isPrivate, setIsPrivate] = useState(false);
  const [showActivity, setShowActivity] = useState(true);

  return (
    <ThemedView style={styles.flex}>
      <ThemedHeader title="Privacy" left={null} right={null} />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText secondary style={styles.sectionIntro}>
          Control who can see your MOxE Basic content, how people find you, and how much activity
          is visible. These options bring the full Account Privacy, Story controls, Search
          visibility, Activity status, Close Friends, Favorites, Archive, and Saved behavior into a
          single place.
        </ThemedText>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Account privacy</ThemedText>
          <View style={styles.card}>
            <View style={styles.toggleRow}>
              <View style={styles.rowText}>
                <ThemedText style={styles.rowLabel}>Private account</ThemedText>
                <ThemedText secondary style={styles.rowDescription}>
                  Only approved followers can see your posts, stories, and highlights.
                </ThemedText>
              </View>
              <Switch value={isPrivate} onValueChange={setIsPrivate} />
            </View>
            <SettingsRow
              label="Follow requests"
              description="Review requests, see mutual followers, approve, decline, or block."
            />
            <SettingsRow
              label="Remove followers"
              description="Quietly remove followers without blocking or notifying them."
            />
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Story privacy</ThemedText>
          <View style={styles.card}>
            <SettingsRow
              label="Hide story from"
              description="Choose specific people who should never see your stories."
            />
            <SettingsRow
              label="Story replies"
              description="Everyone, Followers, or Off. Override per story when you post."
            />
            <SettingsRow
              label="Story resharing"
              description="Allow or prevent others from sharing your stories."
            />
            <SettingsRow
              label="Story archive & highlights"
              description="Auto‑save stories and build Highlights from your archive."
            />
            <SettingsRow
              label="Close Friends"
              description="Maintain a Close Friends list for more private stories."
            />
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Discovery & activity</ThemedText>
          <View style={styles.card}>
            <SettingsRow
              label="Profile in search"
              description="Control whether your profile appears in search results."
            />
            <View style={styles.toggleRow}>
              <View style={styles.rowText}>
                <ThemedText style={styles.rowLabel}>Show activity status</ThemedText>
                <ThemedText secondary style={styles.rowDescription}>
                  Let people you follow and message see when you were last active. Turning this off
                  also hides others&apos; status from you.
                </ThemedText>
              </View>
              <Switch value={showActivity} onValueChange={setShowActivity} />
            </View>
            <SettingsRow
              label="Favorites"
              description="Mark accounts as Favorites to prioritize them in your feed."
            />
            <SettingsRow
              label="Saved & collections"
              description="Review posts you have saved into private collections."
            />
            <SettingsRow
              label="Archive"
              description="See posts you&apos;ve archived instead of deleted from your profile."
            />
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 32, gap: 24 },
  sectionIntro: {
    fontSize: 13,
    lineHeight: 18,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontWeight: '600',
    fontSize: 14,
  },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  row: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  toggleRow: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  rowText: {
    flexDirection: 'column',
    gap: 2,
    flex: 1,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  rowDescription: {
    fontSize: 12,
  },
});

