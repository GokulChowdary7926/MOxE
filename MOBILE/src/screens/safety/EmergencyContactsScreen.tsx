import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { ThemedView, ThemedText, ThemedHeader, ThemedButton } from '../../components/Themed';
import { apiGet, apiPost, apiDelete } from '../../config/api';
import { Avatar } from '../../components/Avatar';

type Contact = {
  id: string;
  contactId: string;
  relationship: string;
  isPrimary: boolean;
  contact: { id: string; username: string; displayName: string; profilePhoto: string | null };
};

export function EmergencyContactsScreen() {
  const [list, setList] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await apiGet<Contact[]>('emergency-contacts');
      setList(Array.isArray(data) ? data : []);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const remove = (id: string) => {
    Alert.alert('Remove contact', 'Remove this emergency contact?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await apiDelete(`emergency-contacts/${id}`);
          load();
        },
      },
    ]);
  };

  return (
    <ThemedView style={styles.flex}>
      <ThemedHeader title="Emergency contacts" left={null} right={null} />
      <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
        <ThemedText secondary style={styles.intro}>
          These contacts receive your location when you trigger SOS.
        </ThemedText>
        {loading ? (
          <ThemedText secondary>Loading…</ThemedText>
        ) : list.length === 0 ? (
          <ThemedText secondary>No emergency contacts. Add them from profile or search.</ThemedText>
        ) : (
          list.map((c) => (
            <View key={c.id} style={styles.row}>
              <Avatar uri={c.contact.profilePhoto} size={40} />
              <View style={styles.rowText}>
                <ThemedText style={styles.name}>{c.contact.displayName} @{c.contact.username}</ThemedText>
                <ThemedText secondary>{c.relationship}{c.isPrimary ? ' · Primary' : ''}</ThemedText>
              </View>
              <TouchableOpacity onPress={() => remove(c.id)}>
                <ThemedText style={styles.remove}>Remove</ThemedText>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16 },
  intro: { marginBottom: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    gap: 12,
  },
  rowText: { flex: 1 },
  name: { fontWeight: '600' },
  remove: { color: '#ff6b6b' },
});
