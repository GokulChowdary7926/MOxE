import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Text,
  GestureResponderEvent,
} from 'react-native';
import { Audio } from 'expo-av';
import { ThemedView, ThemedText, ThemedHeader, ThemedButton } from '../components/Themed';
import {
  fetchThreads,
  fetchThreadMessages,
  sendTextMessage,
  sendGifMessage,
  searchGifs,
  uploadAudio,
  sendVoiceMessage,
  ThreadItem,
  MessageItem,
} from '../services/messages';

export function MessagesScreen() {
  const [threads, setThreads] = useState<ThreadItem[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [threadsError, setThreadsError] = useState<string | null>(null);

  const [activePeerId, setActivePeerId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);

  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const [gifQuery, setGifQuery] = useState('');
  const [gifResults, setGifResults] = useState<{ id: string; url: string; previewUrl?: string }[]>(
    [],
  );
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifLoading, setGifLoading] = useState(false);

  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingCancelled, setRecordingCancelled] = useState(false);

  // Load thread list on mount
  useEffect(() => {
    let cancelled = false;
    async function loadThreads() {
      setLoadingThreads(true);
      setThreadsError(null);
      try {
        const list = await fetchThreads();
        if (!cancelled) setThreads(list);
      } catch (e: any) {
        if (!cancelled) setThreadsError(e?.message ?? 'Failed to load messages');
      } finally {
        if (!cancelled) setLoadingThreads(false);
      }
    }
    loadThreads();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadMessages = async (peerId: string) => {
    setActivePeerId(peerId);
    setLoadingMessages(true);
    setMessagesError(null);
    try {
      const items = await fetchThreadMessages(peerId);
      setMessages(items);
    } catch (e: any) {
      setMessagesError(e?.message ?? 'Failed to load conversation');
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSend = async () => {
    if (!activePeerId) return;
    const content = newMessage.trim();
    if (!content) return;
    try {
      const msg = await sendTextMessage(activePeerId, content);
      setMessages((prev) => [...prev, msg]);
      setNewMessage('');
    } catch (e: any) {
      setMessagesError(e?.message ?? 'Failed to send message');
    }
  };

  // Typing indicator (local only)
  useEffect(() => {
    if (!isTyping) return;
    const timeout = setTimeout(() => setIsTyping(false), 1500);
    return () => clearTimeout(timeout);
  }, [isTyping]);

  const startRecording = async (_e: GestureResponderEvent) => {
    try {
      setRecordingCancelled(false);
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) return;
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY as Audio.RecordingOptions,
      );
      await rec.startAsync();
      setRecording(rec);
    } catch {
      setRecording(null);
    }
  };

  const stopRecordingAndSend = async () => {
    if (!recording || !activePeerId) return;
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      if (!uri || recordingCancelled) return;
      const url = await uploadAudio(uri);
      const msg = await sendVoiceMessage(activePeerId, url);
      setMessages((prev) => [...prev, msg]);
    } catch {
      setRecording(null);
    }
  };

  const handleGifSearch = async () => {
    const q = gifQuery.trim();
    if (!q) {
      setShowGifPicker((prev) => !prev);
      return;
    }
    setGifLoading(true);
    try {
      const items = await searchGifs(q);
      setGifResults(items);
      setShowGifPicker(true);
    } catch {
      // ignore
    } finally {
      setGifLoading(false);
    }
  };

  const handleSendGif = async (url: string) => {
    if (!activePeerId) return;
    try {
      const msg = await sendGifMessage(activePeerId, url);
      setMessages((prev) => [...prev, msg]);
      setShowGifPicker(false);
    } catch (e: any) {
      setMessagesError(e?.message ?? 'Failed to send GIF');
    }
  };

  return (
    <ThemedView style={styles.flex}>
      <ThemedHeader title="Messages" left={null} right={null} />
      <View style={styles.container}>
        <View style={styles.threadList}>
          <ThemedText style={styles.sectionTitle}>Chats</ThemedText>
          {loadingThreads ? (
            <ThemedText secondary>Loading…</ThemedText>
          ) : threadsError ? (
            <ThemedText secondary>{threadsError}</ThemedText>
          ) : (
            <ScrollView>
              {threads.map((t) => (
                <TouchableOpacity
                  key={t.otherId}
                  style={[
                    styles.threadItem,
                    activePeerId === t.otherId && styles.threadItemActive,
                  ]}
                  onPress={() => loadMessages(t.otherId)}
                >
                  <ThemedText style={styles.threadName}>
                    {t.other?.displayName || t.other?.username || t.otherId}
                  </ThemedText>
                  <ThemedText secondary numberOfLines={1} style={styles.threadLast}>
                    {t.lastMessage}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        <View style={styles.conversation}>
          {activePeerId ? (
            <>
              <ScrollView
                style={styles.messagesList}
                contentContainerStyle={{ padding: 12 }}
                inverted
              >
                {[...messages].reverse().map((m) => (
                  <View key={m.id} style={styles.messageBubble}>
                    <ThemedText style={styles.messageText}>
                      {m.messageType === 'GIF'
                        ? '[GIF]'
                        : m.messageType === 'VOICE'
                        ? '[Voice message]'
                        : m.content}
                    </ThemedText>
                  </View>
                ))}
              </ScrollView>
              <View style={styles.composer}>
                <TouchableOpacity
                  style={[styles.micButton, recording && styles.micButtonRecording]}
                  onPressIn={startRecording}
                  onPressOut={stopRecordingAndSend}
                >
                  <Text style={styles.micLabel}>🎙</Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.input}
                  placeholder="Message…"
                  value={newMessage}
                  onChangeText={(val) => {
                    setNewMessage(val);
                    setIsTyping(true);
                  }}
                />
                <TouchableOpacity style={styles.gifButton} onPress={handleGifSearch}>
                  <Text style={styles.gifLabel}>GIF</Text>
                </TouchableOpacity>
                <ThemedButton
                  label="Send"
                  onPress={handleSend}
                  variant="primary"
                  style={styles.sendButton}
                />
              </View>
              {isTyping && (
                <ThemedText secondary style={styles.typingText}>
                  Typing…
                </ThemedText>
              )}
              {showGifPicker && (
                <View style={styles.gifPicker}>
                  <View style={styles.gifSearchRow}>
                    <TextInput
                      style={styles.gifSearchInput}
                      placeholder="Search GIFs…"
                      value={gifQuery}
                      onChangeText={setGifQuery}
                    />
                    <ThemedButton
                      label={gifLoading ? '…' : 'Search'}
                      onPress={handleGifSearch}
                      style={styles.gifSearchButton}
                      variant="secondary"
                    />
                  </View>
                  <ScrollView contentContainerStyle={styles.gifGrid}>
                    {gifResults.map((g) => (
                      <TouchableOpacity
                        key={g.id}
                        style={styles.gifItem}
                        onPress={() => handleSendGif(g.url)}
                      >
                        <ThemedText secondary numberOfLines={1}>
                          GIF
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
              {loadingMessages && (
                <ThemedText secondary style={styles.loadingMessages}>
                  Loading conversation…
                </ThemedText>
              )}
              {messagesError && (
                <ThemedText secondary style={styles.messagesError}>
                  {messagesError}
                </ThemedText>
              )}
            </>
          ) : (
            <View style={styles.emptyState}>
              <ThemedText secondary>Select a chat to start messaging.</ThemedText>
            </View>
          )}
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, flexDirection: 'column' },
  threadList: {
    maxHeight: 180,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  threadItem: {
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  threadItemActive: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  threadName: {
    fontWeight: '600',
  },
  threadLast: {
    fontSize: 12,
  },
  conversation: {
    flex: 1,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  messagesList: {
    flex: 1,
  },
  messageBubble: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  messageText: {
    fontSize: 13,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
  },
  micButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  micButtonRecording: {
    backgroundColor: 'rgba(255,0,0,0.8)',
  },
  micLabel: {
    fontSize: 16,
  },
  gifButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  gifLabel: {
    fontSize: 12,
  },
  sendButton: {
    paddingHorizontal: 8,
  },
  typingText: {
    fontSize: 11,
    paddingHorizontal: 12,
    paddingBottom: 4,
  },
  gifPicker: {
    maxHeight: 220,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingTop: 4,
  },
  gifSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  gifSearchInput: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
  },
  gifSearchButton: {
    paddingHorizontal: 8,
  },
  gifGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    paddingBottom: 8,
  },
  gifItem: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  loadingMessages: {
    fontSize: 11,
    paddingHorizontal: 12,
    paddingVertical: 2,
  },
  messagesError: {
    fontSize: 11,
    paddingHorizontal: 12,
    paddingVertical: 2,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
