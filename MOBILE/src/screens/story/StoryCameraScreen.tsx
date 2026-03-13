import React, { useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ThemedText, ThemedView } from '../../components/Themed';

export function StoryCameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [recording, setRecording] = useState(false);
  const [mode, setMode] = useState<'photo' | 'video' | 'boomerang'>('photo');
  const cameraRef = useRef<CameraView>(null);
  const navigation = useNavigation();

  if (!permission) {
    return (
      <ThemedView style={styles.flex}>
        <ThemedText style={styles.centered}>Checking camera permission…</ThemedText>
      </ThemedView>
    );
  }
  if (!permission.granted) {
    return (
      <ThemedView style={styles.flex}>
        <ThemedText style={styles.centered}>Camera access is required for stories.</ThemedText>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <ThemedText>Grant permission</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    try {
      if (mode === 'photo') {
        const photo = await cameraRef.current.takePictureAsync({ base64: false });
        if (photo?.uri) {
          navigation.navigate('StoryEditor' as never, {
            uri: photo.uri,
            type: 'image',
            mode: 'photo',
          } as never);
        }
        return;
      }

      // Video or Boomerang
      if (!recording) {
        setRecording(true);
        const maxDuration = mode === 'boomerang' ? 2 : 15;
        const video = await cameraRef.current.recordAsync({ maxDuration });
        setRecording(false);
        if (video?.uri) {
          navigation.navigate('StoryEditor' as never, {
            uri: video.uri,
            type: 'video',
            mode,
          } as never);
        }
      } else {
        // Stop current recording early
        cameraRef.current.stopRecording();
      }
    } catch (e: any) {
      setRecording(false);
      Alert.alert('Error', e?.message ?? 'Failed to capture media');
    }
  };

  return (
    <View style={styles.flex}>
      <CameraView ref={cameraRef} style={styles.camera}>
        <View style={styles.modeBar}>
          {(['photo', 'video', 'boomerang'] as const).map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.modeButton, mode === m && styles.modeButtonActive]}
              onPress={() => setMode(m)}
            >
              <ThemedText style={styles.modeLabel}>
                {m === 'photo' ? 'Photo' : m === 'video' ? 'Video' : 'Boomerang'}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.captureBtn, recording && styles.captureBtnRecording]}
            onPress={handleCapture}
          />
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  camera: { flex: 1 },
  centered: { flex: 1, textAlign: 'center', marginTop: 48 },
  btn: { padding: 16, alignSelf: 'center' },
  modeBar: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  modeButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modeButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  modeLabel: {
    fontSize: 12,
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 4,
    borderColor: '#333',
  },
  captureBtnRecording: {
    backgroundColor: 'rgba(255,0,0,0.9)',
  },
});
