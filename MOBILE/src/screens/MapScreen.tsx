import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Switch, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ThemedView, ThemedText, ThemedHeader } from '../components/Themed';
import { apiGet, apiPost, apiPatch, apiDelete } from '../config/api';
import { startNearbyBackground, stopNearbyBackground } from '../services/locationBackground';

type ProximityAlert = {
  id: string;
  targetAccount?: { username: string };
  radiusMeters: number;
  cooldownMinutes: number;
  isActive: boolean;
};

export function MapScreen() {
  const navigation = useNavigation();
  const [nearbyOn, setNearbyOn] = useState(false);
  const [alerts, setAlerts] = useState<ProximityAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAlerts = async () => {
    try {
      const data = await apiGet<{ alerts?: ProximityAlert[] }>('proximity-alerts');
      const list = data?.alerts ?? [];
      setAlerts(list);
    } catch {
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const toggleNearby = async (value: boolean) => {
    if (value) {
      const res = await startNearbyBackground({ distanceIntervalMeters: 100 });
      if (!res.success) {
        Alert.alert('Nearby', res.error ?? 'Could not start background location');
        return;
      }
    } else {
      await stopNearbyBackground();
    }
    setNearbyOn(value);
  };

  const toggleAlert = async (id: string, isActive: boolean) => {
    try {
      await apiPatch(`proximity-alerts/${id}`, { isActive: !isActive });
      loadAlerts();
    } catch (_) {}
  };

  const deleteAlert = (id: string) => {
    Alert.alert('Delete alert', 'Remove this proximity alert?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await apiDelete(`proximity-alerts/${id}`);
          loadAlerts();
        },
      },
    ]);
  };

  return (
    <ThemedView style={styles.flex}>
      <ThemedHeader title="Map" left={null} right={null} />
      <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Nearby</ThemedText>
          <View style={styles.row}>
            <ThemedText>Background location (for Nearby & alerts)</ThemedText>
            <Switch value={nearbyOn} onValueChange={toggleNearby} />
          </View>
          <ThemedText secondary style={styles.hint}>
            When on, your location is sent periodically so you can use Nearby and proximity alerts.
          </ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Proximity alerts</ThemedText>
          {loading ? (
            <ThemedText secondary>Loading…</ThemedText>
          ) : alerts.length === 0 ? (
            <ThemedText secondary>No alerts. Create one from profile or when viewing a user.</ThemedText>
          ) : (
            alerts.map((a) => (
              <View key={a.id} style={styles.alertRow}>
                <View style={styles.alertText}>
                  <ThemedText>@{a.targetAccount?.username ?? 'unknown'}</ThemedText>
                  <ThemedText secondary>
                    {a.radiusMeters}m · cooldown {a.cooldownMinutes}m · {a.isActive ? 'Active' : 'Paused'}
                  </ThemedText>
                </View>
                <TouchableOpacity onPress={() => toggleAlert(a.id, a.isActive)}>
                  <ThemedText>{a.isActive ? 'Pause' : 'Resume'}</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteAlert(a.id)}>
                  <ThemedText style={styles.danger}>Delete</ThemedText>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16 },
  section: { marginBottom: 24 },
  sectionTitle: { fontWeight: '600', marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  hint: { fontSize: 12, marginTop: 4 },
  alertRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.1)' },
  alertText: { flex: 1 },
  danger: { color: '#ff6b6b' },
});
