import React, { useEffect, useState } from 'react';
import { View, ScrollView, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ThemedView, ThemedHeader, ThemedText, ThemedButton, ThemedInput } from '../../components/Themed';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5007/api';

type ArchivedStory = {
  id: string;
  media: string;
  storyId: string | null;
};

type Highlight = {
  id: string;
  name: string;
  coverImage?: string | null;
};

export function ManageHighlightsScreen() {
  const navigation = useNavigation();
  const [archive, setArchive] = useState<ArchivedStory[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [selectedArchivedIds, setSelectedArchivedIds] = useState<string[]>([]);
  const [newHighlightName, setNewHighlightName] = useState('');
  const [creating, setCreating] = useState(false);
  const [renameMap, setRenameMap] = useState<Record<string, string>>({});
  const [savingRename, setSavingRename] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = ''; // Mobile would pull from auth context / secure storage
    if (!token) {
      setError('Login required to manage highlights.');
      return;
    }
    const headers = { Authorization: `Bearer ${token}` };
    fetch(`${API_BASE}/archive`, { headers })
      .then((res) => res.json())
      .then((data) => {
        const items: ArchivedStory[] = (data.items ?? []).map((i: any) => ({
          id: i.id,
          media: i.media,
          storyId: i.storyId ?? null,
        }));
        setArchive(items);
      })
      .catch(() => {
        setError('Failed to load story archive.');
      });

    fetch(`${API_BASE}/highlights`, { headers })
      .then((res) => res.json())
      .then((data) => {
        const list: Highlight[] = (data.highlights ?? []).map((h: any) => ({
          id: h.id,
          name: h.name,
          coverImage: h.coverImage ?? null,
        }));
        setHighlights(list);
      })
      .catch(() => {
        setError('Failed to load highlights.');
      });
  }, []);

  function toggleArchived(id: string) {
    setSelectedArchivedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function createHighlight() {
    setError(null);
    const name = newHighlightName.trim() || 'Highlight';
    if (selectedArchivedIds.length === 0) {
      setError('Select at least one story from your archive.');
      return;
    }
    const token = ''; // see note above
    if (!token) return;
    setCreating(true);
    try {
      const first = archive.find((a) => a.id === selectedArchivedIds[0]);
      const res = await fetch(`${API_BASE}/highlights`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          coverImage: first?.media ?? undefined,
          archivedStoryIds: selectedArchivedIds,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create highlight.');
      }
      setHighlights((prev) => [
        ...prev,
        { id: data.id, name: data.name, coverImage: data.coverImage },
      ]);
      setNewHighlightName('');
      setSelectedArchivedIds([]);
    } catch (e: any) {
      setError(e.message || 'Failed to create highlight.');
    } finally {
      setCreating(false);
    }
  }

  async function renameHighlight(h: Highlight) {
    const token = '';
    if (!token) return;
    const nextName = (renameMap[h.id] ?? h.name).trim();
    if (!nextName || nextName === h.name) return;
    setSavingRename(h.id);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/highlights/${h.id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: nextName }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to rename highlight.');
      }
      setHighlights((prev) =>
        prev.map((x) => (x.id === h.id ? { ...x, name: data.name ?? nextName } : x)),
      );
    } catch (e: any) {
      setError(e.message || 'Failed to rename highlight.');
    } finally {
      setSavingRename(null);
    }
  }

  async function deleteHighlight(id: string) {
    const token = '';
    if (!token) return;
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/highlights/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      setHighlights((prev) => prev.filter((h) => h.id !== id));
    } catch {
      // ignore
    }
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <ThemedHeader
        title="Manage highlights"
        left={
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ThemedText>{'←'}</ThemedText>
          </TouchableOpacity>
        }
      />
      <ScrollView contentContainerStyle={styles.content}>
        {error && (
          <ThemedText secondary style={styles.error}>
            {error}
          </ThemedText>
        )}
        <View style={styles.section}>
          <ThemedText secondary style={styles.sectionCaption}>
            Create a new highlight from your story archive.
          </ThemedText>
          <View style={{ marginBottom: 8 }}>
            <ThemedInput
              value={newHighlightName}
              onChangeText={setNewHighlightName}
              placeholder="Highlight name"
            />
            <ThemedButton
              label={creating ? 'Creating…' : 'Create highlight'}
              onPress={createHighlight}
              disabled={creating || selectedArchivedIds.length === 0}
              style={{ marginTop: 8 }}
            />
          </View>
          <View style={styles.archiveGrid}>
            {archive.map((a) => {
              const selected = selectedArchivedIds.includes(a.id);
              return (
                <TouchableOpacity
                  key={a.id}
                  onPress={() => toggleArchived(a.id)}
                  style={[
                    styles.archiveItem,
                    { borderColor: selected ? '#a855f7' : 'rgba(255,255,255,0.16)' },
                  ]}
                >
                  <Image source={{ uri: a.media }} style={styles.archiveImage} />
                  {selected && (
                    <View style={styles.archiveSelectedOverlay}>
                      <ThemedText>✓</ThemedText>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
            {archive.length === 0 && (
              <ThemedText secondary style={{ fontSize: 12 }}>
                When your stories expire, they will appear here if story archive is enabled.
              </ThemedText>
            )}
          </View>
        </View>
        <View style={styles.section}>
          <ThemedText secondary style={styles.sectionCaption}>
            Existing highlights
          </ThemedText>
          {highlights.length === 0 && (
            <ThemedText secondary style={{ fontSize: 12 }}>
              You don&apos;t have any highlights yet.
            </ThemedText>
          )}
          {highlights.map((h) => (
            <View key={h.id} style={styles.highlightRow}>
              <View style={styles.highlightAvatar}>
                {h.coverImage ? (
                  <Image source={{ uri: h.coverImage }} style={styles.highlightImage} />
                ) : (
                  <ThemedText secondary>★</ThemedText>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <ThemedInput
                  value={renameMap[h.id] ?? h.name}
                  onChangeText={(text) =>
                    setRenameMap((prev) => ({ ...prev, [h.id]: text }))
                  }
                />
                <View style={styles.highlightActions}>
                  <ThemedButton
                    label={savingRename === h.id ? 'Saving…' : 'Rename'}
                    variant="secondary"
                    onPress={() => renameHighlight(h)}
                    disabled={savingRename === h.id}
                    style={styles.highlightBtn}
                  />
                  <ThemedButton
                    label="Delete"
                    variant="secondary"
                    onPress={() => deleteHighlight(h.id)}
                    style={styles.highlightBtn}
                  />
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionCaption: {
    fontSize: 12,
    marginBottom: 8,
  },
  error: {
    marginBottom: 12,
    fontSize: 12,
  },
  archiveGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  archiveItem: {
    width: '30%',
    aspectRatio: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    overflow: 'hidden',
  },
  archiveImage: {
    width: '100%',
    height: '100%',
  },
  archiveSelectedOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  highlightAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  highlightImage: {
    width: '100%',
    height: '100%',
  },
  highlightActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  highlightBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
});

