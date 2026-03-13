import React from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity } from 'react-native';
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

export function AccountSettingsScreen() {
  return (
    <ThemedView style={styles.flex}>
      <ThemedHeader title="Account" left={null} right={null} />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText secondary style={styles.sectionIntro}>
          Core MOxE Basic account management lives here: phone, email, username, display name,
          birthday, profile photo, bio, link in bio, and pronouns. These controls match the full
          MOxE Basic guide and are shared across Personal, Business, Creator, and Job accounts.
        </ThemedText>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Login & security</ThemedText>
          <View style={styles.card}>
            <SettingsRow
              label="Phone number"
              description="Change number, verify with SMS, manage up to 3 accounts per phone."
            />
            <SettingsRow
              label="Email"
              description="Add or change email, verification link, recovery and alternative login."
            />
            <SettingsRow
              label="Username"
              description="Choose @handle, see availability, suggestions, and 14‑day change limit."
            />
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Profile identity</ThemedText>
          <View style={styles.card}>
            <SettingsRow
              label="Display name"
              description="Set name shown on profile, supports emojis and special characters."
            />
            <SettingsRow
              label="Date of birth"
              description="Birthday, age checks, and minor safety rules based on MOxE Basic."
            />
            <SettingsRow
              label="Profile photo"
              description="Upload, crop to square, apply filters, seasonal frames, and moderation."
            />
            <SettingsRow
              label="Bio"
              description="150–500 characters, emojis, @mentions, #hashtags, and line breaks."
            />
            <SettingsRow
              label="Link in bio"
              description="Single primary link with safety checks and basic click tracking."
            />
            <SettingsRow
              label="Pronouns"
              description="Select from list or add custom, with Public / Followers Only / Off."
            />
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Account type & devices</ThemedText>
          <View style={styles.card}>
            <SettingsRow
              label="Account type"
              description="Switch between Personal, Business, Creator, and Job when available."
            />
            <SettingsRow
              label="Logged in devices"
              description="See active sessions and sign out of other devices."
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
  rowText: {
    flexDirection: 'column',
    gap: 2,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  rowDescription: {
    fontSize: 12,
  },
});

