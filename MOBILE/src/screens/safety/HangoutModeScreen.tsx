import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { ThemedView, ThemedText, ThemedHeader, ThemedButton } from '../../components/Themed';
import { apiPost, apiPatch } from '../../config/api';
import { startNearbyBackground, stopNearbyBackground } from '../../services/locationBackground';

const CHECK_IN_MINUTES = 5;

export function HangoutModeScreen() {
  const [active, setActive] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopHangout = async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    await stopNearbyBackground();
    if (sessionId) {
      try {
        await apiPatch('safety/hangout/end', { sessionId });
      } catch (_) {}
      setSessionId(null);
    }
    setActive(false);
  };

  const startHangout = async () => {
    setError(null);
    try {
      const res = await apiPost<{ sessionId: string }>('safety/hangout', {
        checkInInterval: CHECK_IN_MINUTES,
        durationMinutes: 60,
      });
      const sid = res?.sessionId;
      if (!sid) throw new Error('No session ID');
      setSessionId(sid);
      setActive(true);
      const bg = await startNearbyBackground({ distanceIntervalMeters: 100 });
      if (!bg.success) setError(bg.error ?? 'Background location off');
      intervalRef.current = setInterval(async () => {
        try {
          await apiPost('safety/hangout', { sessionId: sid });
        } catch (_) {}
      }, CHECK_IN_MINUTES * 60 * 1000);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to start');
    }
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (active) stopHangout();
    };
  }, []);

  return (
    <ThemedView style={styles.flex}>
      <ThemedHeader title="Hangout mode" left={null} right={null} />
      <View style={styles.content}>
        <ThemedText secondary style={styles.intro}>
          When meeting someone, turn on Hangout mode. We’ll periodically check in. If you miss a check-in, your emergency contacts can be notified.
        </ThemedText>
        {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
        {active ? (
          <>
            <ThemedText style={styles.status}>Hangout mode is on</ThemedText>
            <ThemedButton label="End Hangout" onPress={stopHangout} variant="danger" style={styles.btn} />
          </>
        ) : (
          <ThemedButton label="Start Hangout" onPress={startHangout} style={styles.btn} />
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flex: 1, padding: 16 },
  intro: { marginBottom: 24 },
  error: { color: '#ff6b6b', marginBottom: 12 },
  status: { marginBottom: 16 },
  btn: { marginTop: 8 },
});
