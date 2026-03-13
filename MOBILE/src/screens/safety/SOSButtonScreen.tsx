import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { ThemedView, ThemedText, ThemedHeader, ThemedButton } from '../../components/Themed';
import { apiPost } from '../../config/api';
import * as Location from 'expo-location';

export function SOSButtonScreen() {
  const [sending, setSending] = useState(false);

  const sendSOS = async () => {
    Alert.alert(
      'Send SOS?',
      'Your location will be shared with your emergency contacts.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send SOS',
          style: 'destructive',
          onPress: async () => {
            setSending(true);
            try {
              let latitude: number | undefined;
              let longitude: number | undefined;
              try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status === 'granted') {
                  const loc = await Location.getCurrentPositionAsync({});
                  latitude = loc.coords.latitude;
                  longitude = loc.coords.longitude;
                }
              } catch (_) {}
              await apiPost('safety/sos', { latitude, longitude });
              Alert.alert('SOS sent', 'Your emergency contacts have been notified.');
            } catch (e: any) {
              Alert.alert('Error', e?.message ?? 'Failed to send SOS');
            } finally {
              setSending(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ThemedView style={styles.flex}>
      <ThemedHeader title="SOS" left={null} right={null} />
      <View style={styles.content}>
        <ThemedText secondary style={styles.intro}>
          In an emergency, tap the button below to share your location with your emergency contacts.
        </ThemedText>
        <ThemedButton
          label={sending ? 'Sending…' : 'Send SOS'}
          onPress={sendSOS}
          variant="danger"
          disabled={sending}
          style={styles.btn}
        />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flex: 1, padding: 16 },
  intro: { marginBottom: 24 },
  btn: { marginTop: 8 },
});
