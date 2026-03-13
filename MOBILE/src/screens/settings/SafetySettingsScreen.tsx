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

export function SafetySettingsScreen() {
  const navigation = useNavigation();
  const [sosEnabled, setSosEnabled] = useState(true);
  const [limitsEnabled, setLimitsEnabled] = useState(false);

  return (
    <ThemedView style={styles.flex}>
      <ThemedHeader title="Safety & Security" left={null} right={null} />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText secondary style={styles.sectionIntro}>
          Safety tools in MOxE Basic help you manage who can reach you, what you see, and how the
          app reacts in emergencies. This screen collects Blocking, Restrict, Mute, Hidden words,
          Limit interactions, Temporary blocks, and SOS Safety Mode into a single safety hub.
        </ThemedText>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Connections & interactions</ThemedText>
          <View style={styles.card}>
            <SettingsRow
              label="Blocked accounts"
              description="See people you&apos;ve blocked and optionally unblock or report them."
            />
            <SettingsRow
              label="Restricted accounts"
              description="Manage people whose comments and DMs are quietly limited."
            />
            <SettingsRow
              label="Muted accounts"
              description="Review accounts whose posts or stories you&apos;ve muted."
            />
            <SettingsRow
              label="Hidden words"
              description="Filter comments and message requests that contain certain words or phrases."
            />
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Limits & temporary blocks</ThemedText>
          <View style={styles.card}>
            <View style={styles.toggleRow}>
              <View style={styles.rowText}>
                <ThemedText style={styles.rowLabel}>Limit interactions</ThemedText>
                <ThemedText secondary style={styles.rowDescription}>
                  Temporarily limit comments, tags, and DMs from recent followers or people who
                  don&apos;t follow you.
                </ThemedText>
              </View>
              <Switch value={limitsEnabled} onValueChange={setLimitsEnabled} />
            </View>
            <SettingsRow
              label="Temporary block"
              description="Block someone for 24 hours, 7 days, or 30 days without making it permanent."
            />
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>SOS & emergency safety</ThemedText>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.toggleRow}
              onPress={() => navigation.navigate('SOSButton' as never)}
            >
              <View style={styles.rowText}>
                <ThemedText style={styles.rowLabel}>SOS button</ThemedText>
                <ThemedText secondary style={styles.rowDescription}>
                  Send your location to emergency contacts in an emergency.
                </ThemedText>
              </View>
            </TouchableOpacity>
            <SettingsRow
              label="Emergency contacts"
              description="Choose who receives SOS alerts with your location."
              onPress={() => navigation.navigate('EmergencyContacts' as never)}
            />
            <SettingsRow
              label="Hangout mode"
              description="Periodic check-ins when meeting someone; contacts notified if you miss one."
              onPress={() => navigation.navigate('HangoutMode' as never)}
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

