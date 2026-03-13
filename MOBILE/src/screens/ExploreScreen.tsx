import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { ThemedView, ThemedText, ThemedHeader } from '../components/Themed';

export function ExploreScreen() {
  return (
    <ThemedView style={styles.flex}>
      <ThemedHeader title="Explore" left={null} right={null} />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText secondary>
          Discover trending audio, content ideas, and people. (Explore UI)
        </ThemedText>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16 },
});
