import React, { useState } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ThemedView, ThemedText, ThemedHeader, ThemedButton, ThemedInput } from '../../components/Themed';
import { parseVoiceIntent } from '../../services/voiceIntent';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';

export function VoiceCommandScreen() {
  const navigation = useNavigation();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [recognizing, setRecognizing] = useState(false);

  useSpeechRecognitionEvent('start', () => setRecognizing(true));
  useSpeechRecognitionEvent('end', () => setRecognizing(false));
  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event?.results?.[0]?.transcript ?? '';
    if (!transcript) return;
    setText(transcript);
    // Immediately run intent on final result
    runIntent(transcript);
  });
  useSpeechRecognitionEvent('error', (event) => {
    console.log('Speech recognition error:', event.error, event.message);
  });

  const runIntent = async (input?: string) => {
    const source = input != null ? input : text;
    const trimmed = source.trim();
    if (!trimmed) return;
    setLoading(true);
    try {
      const intent = await parseVoiceIntent(trimmed);
      if (intent.confidence < 0.5) {
        Alert.alert('No match', `Could not understand "${trimmed}". Try "open messages" or "post story hello".`);
        return;
      }
      switch (intent.intent) {
        case 'NAVIGATE':
          const dest = (intent.target || '').toLowerCase();
          if (dest === 'messages') navigation.navigate('Main' as never, { screen: 'Messages' } as never);
          else if (dest === 'profile') navigation.navigate('Main' as never, { screen: 'Profile' } as never);
          else if (dest === 'map') navigation.navigate('Main' as never, { screen: 'Map' } as never);
          else if (dest === 'home') navigation.navigate('Main' as never, { screen: 'Feed' } as never);
          else Alert.alert('Navigate', `Would go to: ${dest}`);
          break;
        case 'CREATE_STORY':
          navigation.navigate('StoryCamera');
          break;
        case 'SEND_MESSAGE':
          Alert.alert('Send message', `To: ${intent.target}\nContent: ${intent.content ?? ''}`);
          break;
        default:
          Alert.alert('Intent', `${intent.intent} (confidence: ${intent.confidence})`);
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to parse command');
    } finally {
      setLoading(false);
    }
  };

  const handleStartListening = async () => {
    try {
      const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!perm.granted) return;
      setText('');
      ExpoSpeechRecognitionModule.start({
        lang: 'en-US',
        interimResults: false,
        maxAlternatives: 1,
        continuous: false,
      });
    } catch (e) {
      console.log('Speech start failed', e);
    }
  };

  const handleStopListening = () => {
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch (e) {
      console.log('Speech stop failed', e);
    }
  };

  return (
    <ThemedView style={styles.flex}>
      <ThemedHeader title="Voice command" left={null} right={null} />
      <View style={styles.content}>
        <ThemedText secondary style={styles.intro}>
          Type a command (or use speech when STT is wired). Examples: "open messages", "go to profile", "post story hello".
        </ThemedText>
        <ThemedInput
          placeholder="e.g. open messages"
          value={text}
          onChangeText={setText}
          style={styles.input}
        />
        <ThemedButton label={loading ? '…' : 'Run command'} onPress={() => runIntent()} disabled={loading} style={styles.btn} />
        <View style={styles.micRow}>
          <TouchableOpacity
            style={[styles.micButton, recognizing && styles.micButtonActive]}
            onPressIn={handleStartListening}
            onPressOut={handleStopListening}
          >
            <Text style={styles.micLabel}>{recognizing ? 'Release' : 'Hold to talk'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16 },
  intro: { marginBottom: 16 },
  input: { marginBottom: 12 },
  btn: {},
  micRow: {
    marginTop: 16,
    alignItems: 'center',
  },
  micButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  micButtonActive: {
    backgroundColor: 'rgba(0,150,255,0.8)',
  },
  micLabel: {
    fontSize: 13,
  },
});
