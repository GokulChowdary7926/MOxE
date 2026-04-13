import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Image,
  ImageStyle,
  Alert,
  ScrollView,
  Switch,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { ThemedView, ThemedText, ThemedHeader, ThemedButton, ThemedInput } from '../../components/Themed';
import { API_BASE, getStoredToken, apiGet, apiPost, apiDelete } from '../../config/api';
import type { RootStackParamList } from '../../navigation/types';

type StoryEditorRoute = RouteProp<RootStackParamList, 'StoryEditor'>;

type StorySticker =
  | { type: 'poll'; question: string; options: string[] }
  | { type: 'questions'; prompt: string }
  | { type: 'countdown'; title: string; notifyAt: string }
  | { type: 'link'; url: string; label?: string }
  | { type: 'emoji_slider'; emoji: string; label?: string };

type HideFromAccount = { id: string; username: string; displayName: string; profilePhoto: string | null };

export function StoryEditorScreen() {
  const { params } = useRoute<StoryEditorRoute>();
  const navigation = useNavigation();
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);
  const [filter, setFilter] = useState<'original' | 'warm' | 'cool' | 'contrast'>('original');
  const [allowReplies, setAllowReplies] = useState(true);
  const [allowReshares, setAllowReshares] = useState(true);

  // Stickers
  const [stickers, setStickers] = useState<StorySticker[]>([]);
  const [stickerTab, setStickerTab] = useState<'none' | 'poll' | 'question' | 'countdown' | 'link' | 'emoji'>('none');
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOpt1, setPollOpt1] = useState('');
  const [pollOpt2, setPollOpt2] = useState('');
  const [questionPrompt, setQuestionPrompt] = useState('');
  const [countdownTitle, setCountdownTitle] = useState('');
  const [countdownTime, setCountdownTime] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkLabel, setLinkLabel] = useState('');
  const [emojiChar, setEmojiChar] = useState('💜');
  const [emojiLabel, setEmojiLabel] = useState('');

  // Hide from
  const [hideFromList, setHideFromList] = useState<HideFromAccount[]>([]);
  const [hideFromModalVisible, setHideFromModalVisible] = useState(false);
  const [hideFromLoading, setHideFromLoading] = useState(false);
  const [addUsername, setAddUsername] = useState('');
  const [addingHide, setAddingHide] = useState(false);

  const uri = params?.uri ?? '';
  const type = params?.type ?? 'image';
  const mode = params?.mode ?? 'photo';

  const imageStyle = useMemo((): ImageStyle[] => {
    const base: ImageStyle[] = [styles.media];
    if (filter === 'warm') base.push(styles.mediaWarm as ImageStyle);
    if (filter === 'cool') base.push(styles.mediaCool as ImageStyle);
    if (filter === 'contrast') base.push(styles.mediaContrast as ImageStyle);
    return base;
  }, [filter]);

  useEffect(() => {
    if (hideFromModalVisible) {
      setHideFromLoading(true);
      apiGet<HideFromAccount[]>('privacy/hide-story-from')
        .then((data) => setHideFromList(Array.isArray(data) ? data : []))
        .catch(() => setHideFromList([]))
        .finally(() => setHideFromLoading(false));
    }
  }, [hideFromModalVisible]);

  const addHideFrom = async () => {
    const username = addUsername.trim().toLowerCase();
    if (!username) return;
    setAddingHide(true);
    try {
      const account = await apiGet<{ id: string }>('accounts/username/' + encodeURIComponent(username));
      if (!account?.id) throw new Error('Account not found');
      await apiPost('privacy/hide-story-from', { accountId: account.id });
      setHideFromList((prev) => {
        const next = [...prev, { id: account.id, username, displayName: username, profilePhoto: null }];
        return next;
      });
      setAddUsername('');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not add account');
    } finally {
      setAddingHide(false);
    }
  };

  const removeHideFrom = async (accountId: string) => {
    try {
      await apiDelete('privacy/hide-story-from/' + accountId);
      setHideFromList((prev) => prev.filter((a) => a.id !== accountId));
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not remove');
    }
  };

  const postStory = async () => {
    if (!uri) return;
    setPosting(true);
    try {
      const token = await getStoredToken();
      if (!token) throw new Error('Not logged in');

      const formData = new FormData();
      formData.append('file', {
        uri,
        type: type === 'video' ? 'video/mp4' : 'image/jpeg',
        name: `story-${Date.now()}.${type === 'video' ? 'mp4' : 'jpg'}`,
      } as any);

      const uploadRes = await fetch(`${API_BASE.replace(/\/$/, '')}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const uploadData = await uploadRes.json().catch(() => ({}));
      if (!uploadRes.ok) throw new Error((uploadData as { error?: string }).error || 'Upload failed');
      const mediaUrl = (uploadData as { url?: string }).url;
      if (!mediaUrl) throw new Error('No URL returned');

      const body: Record<string, unknown> = {
        media: mediaUrl,
        type: type === 'video' ? 'video' : 'photo',
        allowReplies,
        allowReshares,
        textOverlay: text.trim()
          ? [{ text: text.trim(), x: 0.5, y: 0.5, scale: 1, rotation: 0 }]
          : undefined,
        stickers: stickers.length ? stickers : undefined,
      };

      const storyRes = await fetch(`${API_BASE.replace(/\/$/, '')}/stories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (!storyRes.ok) {
        const err = await storyRes.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || 'Failed to post story');
      }
      Alert.alert('Posted', 'Your story was posted.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to post story');
    } finally {
      setPosting(false);
    }
  };

  const addPoll = () => {
    const q = pollQuestion.trim();
    const opts = [pollOpt1, pollOpt2].map((o) => o.trim()).filter(Boolean);
    if (!q || opts.length < 2) {
      Alert.alert('Poll', 'Enter a question and at least 2 options.');
      return;
    }
    setStickers((prev) => [...prev, { type: 'poll', question: q, options: opts }]);
    setPollQuestion('');
    setPollOpt1('');
    setPollOpt2('');
    setStickerTab('none');
  };

  const addQuestion = () => {
    const p = questionPrompt.trim();
    if (!p) {
      Alert.alert('Questions', 'Enter a prompt.');
      return;
    }
    setStickers((prev) => [...prev, { type: 'questions', prompt: p }]);
    setQuestionPrompt('');
    setStickerTab('none');
  };

  const addCountdown = () => {
    const title = countdownTitle.trim();
    if (!title || !countdownTime) {
      Alert.alert('Countdown', 'Enter title and end time.');
      return;
    }
    setStickers((prev) => [...prev, { type: 'countdown', title, notifyAt: countdownTime }]);
    setCountdownTitle('');
    setCountdownTime('');
    setStickerTab('none');
  };

  const addLink = () => {
    const url = linkUrl.trim();
    if (!url) {
      Alert.alert('Link', 'Enter a URL.');
      return;
    }
    setStickers((prev) => [...prev, { type: 'link', url, label: linkLabel.trim() || undefined }]);
    setLinkUrl('');
    setLinkLabel('');
    setStickerTab('none');
  };

  const addEmojiSlider = () => {
    const emoji = emojiChar || '💜';
    setStickers((prev) => [...prev, { type: 'emoji_slider', emoji, label: emojiLabel.trim() || undefined }]);
    setEmojiChar('💜');
    setEmojiLabel('');
    setStickerTab('none');
  };

  if (!uri) {
    return (
      <ThemedView style={styles.flex}>
        <ThemedHeader title="Story" left={null} right={null} />
        <ThemedText secondary>No media.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.flex}>
      <ThemedHeader title="Share to story" left={null} right={null} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.preview}>
          {type === 'image' ? (
            <Image source={{ uri }} style={imageStyle} resizeMode="cover" />
          ) : (
            <ThemedText secondary>Video preview (playback can be added)</ThemedText>
          )}
        </View>
        <View style={styles.filterRow}>
          {(['original', 'warm', 'cool', 'contrast'] as const).map((f) => (
            <ThemedButton
              key={f}
              label={f === 'original' ? 'Original' : f[0].toUpperCase() + f.slice(1)}
              variant={filter === f ? 'primary' : 'secondary'}
              onPress={() => setFilter(f)}
              style={styles.filterButton}
            />
          ))}
        </View>
        <ThemedInput
          placeholder="Add text…"
          value={text}
          onChangeText={setText}
          style={styles.input}
        />

        {/* Story privacy: reply / reshare */}
        <View style={styles.section}>
          <ThemedText secondary style={styles.sectionTitle}>Story settings</ThemedText>
          <View style={styles.row}>
            <ThemedText>Allow replies</ThemedText>
            <Switch value={allowReplies} onValueChange={setAllowReplies} />
          </View>
          <View style={styles.row}>
            <ThemedText>Allow reshares</ThemedText>
            <Switch value={allowReshares} onValueChange={setAllowReshares} />
          </View>
          <ThemedButton
            label="Hide story from…"
            variant="secondary"
            onPress={() => setHideFromModalVisible(true)}
            style={styles.hideFromBtn}
          />
        </View>

        {/* Interactive stickers */}
        <View style={styles.section}>
          <ThemedText secondary style={styles.sectionTitle}>Stickers</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stickerTabs}>
            {[
              { key: 'poll', label: 'Poll' },
              { key: 'question', label: 'Questions' },
              { key: 'countdown', label: 'Countdown' },
              { key: 'link', label: 'Link' },
              { key: 'emoji', label: 'Emoji' },
            ].map((t) => (
              <ThemedButton
                key={t.key}
                label={t.label}
                variant={stickerTab === t.key ? 'primary' : 'secondary'}
                onPress={() => setStickerTab(stickerTab === t.key ? 'none' : (t.key as typeof stickerTab))}
                style={styles.stickerTabBtn}
              />
            ))}
          </ScrollView>

          {stickerTab === 'poll' && (
            <View style={styles.stickerForm}>
              <ThemedInput placeholder="Poll question" value={pollQuestion} onChangeText={setPollQuestion} />
              <ThemedInput placeholder="Option 1" value={pollOpt1} onChangeText={setPollOpt1} />
              <ThemedInput placeholder="Option 2" value={pollOpt2} onChangeText={setPollOpt2} />
              <ThemedButton label="Add poll" onPress={addPoll} style={styles.addStickerBtn} />
            </View>
          )}
          {stickerTab === 'question' && (
            <View style={styles.stickerForm}>
              <ThemedInput placeholder="Ask me a question…" value={questionPrompt} onChangeText={setQuestionPrompt} />
              <ThemedButton label="Add questions sticker" onPress={addQuestion} style={styles.addStickerBtn} />
            </View>
          )}
          {stickerTab === 'countdown' && (
            <View style={styles.stickerForm}>
              <ThemedInput placeholder="Countdown title" value={countdownTitle} onChangeText={setCountdownTitle} />
              <ThemedInput
                placeholder="End time (ISO or date)"
                value={countdownTime}
                onChangeText={setCountdownTime}
              />
              <ThemedButton label="Add countdown" onPress={addCountdown} style={styles.addStickerBtn} />
            </View>
          )}
          {stickerTab === 'link' && (
            <View style={styles.stickerForm}>
              <ThemedInput placeholder="https://…" value={linkUrl} onChangeText={setLinkUrl} />
              <ThemedInput placeholder="Label (optional)" value={linkLabel} onChangeText={setLinkLabel} />
              <ThemedButton label="Add link" onPress={addLink} style={styles.addStickerBtn} />
            </View>
          )}
          {stickerTab === 'emoji' && (
            <View style={styles.stickerForm}>
              <ThemedInput placeholder="Emoji (e.g. 💜)" value={emojiChar} onChangeText={(v) => setEmojiChar(v || '💜')} />
              <ThemedInput placeholder="Slider label (optional)" value={emojiLabel} onChangeText={setEmojiLabel} />
              <ThemedButton label="Add emoji slider" onPress={addEmojiSlider} style={styles.addStickerBtn} />
            </View>
          )}

          {stickers.length > 0 && (
            <View style={styles.addedStickers}>
              <ThemedText secondary style={styles.addedLabel}>Added:</ThemedText>
              {stickers.map((s, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.stickerChip}
                  onPress={() => setStickers((prev) => prev.filter((_, i) => i !== idx))}
                >
                  <ThemedText style={styles.stickerChipText}>{s.type}</ThemedText>
                  <ThemedText secondary> ✕</ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <ThemedButton
          label={posting ? 'Posting…' : 'Post story'}
          onPress={postStory}
          disabled={posting}
          style={styles.btn}
        />
      </ScrollView>

      {/* Hide story from modal */}
      <Modal visible={hideFromModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Hide story from</ThemedText>
              <TouchableOpacity onPress={() => setHideFromModalVisible(false)}>
                <ThemedText>Done</ThemedText>
              </TouchableOpacity>
            </View>
            <View style={styles.addHideRow}>
              <ThemedInput
                placeholder="Username to hide from"
                value={addUsername}
                onChangeText={setAddUsername}
                style={styles.addHideInput}
              />
              <ThemedButton
                label={addingHide ? '…' : 'Add'}
                onPress={addHideFrom}
                disabled={addingHide}
                style={styles.addHideBtn}
              />
            </View>
            {hideFromLoading ? (
              <ActivityIndicator style={styles.loader} />
            ) : (
              <ScrollView style={styles.hideList}>
                {hideFromList.map((a) => (
                  <View key={a.id} style={styles.hideRow}>
                    <ThemedText>{a.username}</ThemedText>
                    <ThemedButton
                      label="Remove"
                      variant="danger"
                      onPress={() => removeHideFrom(a.id)}
                      style={styles.removeHideBtn}
                    />
                  </View>
                ))}
                {hideFromList.length === 0 && (
                  <ThemedText secondary style={styles.emptyHint}>No one hidden. Add a username above.</ThemedText>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 24 },
  preview: { height: 280, backgroundColor: '#111' },
  media: { width: '100%', height: '100%' },
  mediaWarm: { overlayColor: 'rgba(255, 200, 150, 0.2)' as any },
  mediaCool: { overlayColor: 'rgba(150, 200, 255, 0.25)' as any },
  mediaContrast: { opacity: 0.95 },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 8,
  },
  filterButton: { flex: 1, marginHorizontal: 4 },
  input: { marginHorizontal: 16, marginTop: 8 },
  section: { marginHorizontal: 16, marginTop: 16, padding: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: '#333', borderRadius: 8 },
  sectionTitle: { marginBottom: 8, fontSize: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 6 },
  hideFromBtn: { marginTop: 8 },
  stickerTabs: { flexDirection: 'row', marginBottom: 8, maxHeight: 44 },
  stickerTabBtn: { marginRight: 8, paddingHorizontal: 12 },
  stickerForm: { marginTop: 8 },
  addStickerBtn: { marginTop: 8 },
  addedStickers: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: 12 },
  addedLabel: { marginRight: 8, fontSize: 12 },
  stickerChip: { flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 6, marginRight: 8, marginBottom: 6, backgroundColor: '#333', borderRadius: 20 },
  stickerChipText: { fontSize: 12 },
  btn: { marginHorizontal: 16, marginTop: 16, marginBottom: 24 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1a1a1a', borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '70%', padding: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 18 },
  addHideRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  addHideInput: { flex: 1, marginRight: 8 },
  addHideBtn: { minWidth: 60 },
  loader: { marginVertical: 24 },
  hideList: { maxHeight: 240 },
  hideRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#333' },
  removeHideBtn: { paddingHorizontal: 12 },
  emptyHint: { paddingVertical: 16, textAlign: 'center' },
});
