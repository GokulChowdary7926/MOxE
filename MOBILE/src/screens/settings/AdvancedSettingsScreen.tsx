import React, { useState } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, Switch } from 'react-native';
import { useNavigation } from '@react-navigation/native';
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

export function AdvancedSettingsScreen() {
  const navigation = useNavigation();
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [nearbyEnabled, setNearbyEnabled] = useState(false);
  const [proximityEnabled, setProximityEnabled] = useState(false);
  const [screenshotProtection, setScreenshotProtection] = useState(false);

  return (
    <ThemedView style={styles.flex}>
      <ThemedHeader title="Advanced" left={null} right={null} />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText secondary style={styles.sectionIntro}>
          Advanced MOxE Basic features like voice commands, Nearby messaging, Promity alerts,
          screenshot and download protection, anonymous spaces, and lifestyle streaks are managed
          here. These settings apply across Personal, Business, Creator, and Job accounts.
        </ThemedText>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Voice & control</ThemedText>
          <View style={styles.card}>
            <View style={styles.toggleRow}>
              <View style={styles.rowText}>
                <ThemedText style={styles.rowLabel}>Voice commands</ThemedText>
                <ThemedText secondary style={styles.rowDescription}>
                  Say &quot;Open profile&quot;, &quot;Message [name]&quot;, &quot;Create post&quot;,
                  &quot;Like this post&quot;, and more to control MOxE hands‑free.
                </ThemedText>
              </View>
              <Switch value={voiceEnabled} onValueChange={setVoiceEnabled} />
            </View>
            <SettingsRow
              label="Try voice command"
              description="Type or speak: open messages, post story, etc."
              onPress={() => navigation.navigate('VoiceCommand' as never)}
            />
            <SettingsRow
              label="Voice safety shortcuts"
              description="Configure quick commands for Help, SOS, and Safety."
            />
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Nearby & proximity</ThemedText>
          <View style={styles.card}>
            <View style={styles.toggleRow}>
              <View style={styles.rowText}>
                <ThemedText style={styles.rowLabel}>Nearby messaging</ThemedText>
                <ThemedText secondary style={styles.rowDescription}>
                  Opt in to discover and message people within a chosen radius at events or in your
                  city.
                </ThemedText>
              </View>
              <Switch value={nearbyEnabled} onValueChange={setNearbyEnabled} />
            </View>
            <View style={styles.toggleRow}>
              <View style={styles.rowText}>
                <ThemedText style={styles.rowLabel}>Promity alerts</ThemedText>
                <ThemedText secondary style={styles.rowDescription}>
                  Get notified when selected contacts are nearby (100m‑1km) with cooldowns.
                </ThemedText>
              </View>
              <Switch value={proximityEnabled} onValueChange={setProximityEnabled} />
            </View>
            <SettingsRow
              label="Nearby visibility"
              description="Control who can see you in Nearby: Everyone, Followers Only, or Off."
            />
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Screenshot & download protection</ThemedText>
          <View style={styles.card}>
            <View style={styles.toggleRow}>
              <View style={styles.rowText}>
                <ThemedText style={styles.rowLabel}>Protect my content</ThemedText>
                <ThemedText secondary style={styles.rowDescription}>
                  Default to blocking downloads and detecting screenshots on new posts and stories.
                </ThemedText>
              </View>
              <Switch value={screenshotProtection} onValueChange={setScreenshotProtection} />
            </View>
            <SettingsRow
              label="Screenshot notifications"
              description="Choose when to be notified if someone attempts a screenshot."
            />
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Spaces & streaks</ThemedText>
          <View style={styles.card}>
            <SettingsRow
              label="Anonymous discussion spaces"
              description="Browse, create, and moderate anonymous spaces with voting and reporting."
            />
            <SettingsRow
              label="Lifestyle streaks"
              description="Configure Gym, Meditation, Reading, Study, Gaming, or custom streaks."
            />
            <SettingsRow
              label="One‑time view media in DMs"
              description="Control defaults for sending and receiving one‑time view photos and videos."
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

