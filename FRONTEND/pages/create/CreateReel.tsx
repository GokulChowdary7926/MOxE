import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ThemedView, ThemedHeader, ThemedText, ThemedButton, ThemedInput } from '../../components/ui/Themed';
import { getApiBase } from '../../services/api';

const API_BASE = getApiBase();

export default function CreateReel() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [altText, setAltText] = useState('');
  const [startMs, setStartMs] = useState(0);
  const [endMs, setEndMs] = useState(15000);
  const [mute, setMute] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [filter, setFilter] = useState<'original' | 'vivid' | 'mono' | 'warm'>('original');
  const [isSubscriberOnly, setIsSubscriberOnly] = useState(false);
  const [subscriberTierKeys, setSubscriberTierKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleShare() {
    try {
      setError(null);
      if (!file) {
        setError('Please add a video first.');
        return;
      }
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You must be logged in to create a reel.');
        return;
      }
      setLoading(true);
      const form = new FormData();
      form.append('file', file);
      const uploadRes = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const uploadData = await uploadRes.json().catch(() => ({}));
      if (!uploadRes.ok || !uploadData.url) {
        throw new Error(uploadData.error || 'Failed to upload reel media.');
      }
      const body = {
        media: [{ url: uploadData.url }],
        caption: caption || undefined,
        altText: altText.trim() || undefined,
        edits: {
          trimStartMs: startMs,
          trimEndMs: endMs,
          mute,
          speed,
          filter,
        },
        ...(isSubscriberOnly && { isSubscriberOnly: true, subscriberTierKeys: subscriberTierKeys.length > 0 ? subscriberTierKeys : undefined }),
      };
      const res = await fetch(`${API_BASE}/reels`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create reel.');
      }
      navigate('/');
    } catch (e: any) {
      setError(e.message || 'Failed to create reel.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ThemedView className="min-h-screen flex flex-col pb-20">
      <ThemedHeader
        title="Create reel"
        left={
          <Link to="/" className="text-moxe-text text-2xl leading-none" aria-label="Back">
            ←
          </Link>
        }
        right={
          <ThemedButton
            label={loading ? 'Sharing…' : 'Share'}
            onClick={handleShare}
            disabled={loading}
            className="px-3 py-1 text-xs"
          />
        }
      />
      <div className="flex-1 overflow-auto px-moxe-md py-moxe-md space-y-4">
        {error && (
          <ThemedText className="text-moxe-caption text-moxe-danger">
            {error}
          </ThemedText>
        )}
        <label className="w-full aspect-[9/16] bg-moxe-surface rounded-moxe-md border border-moxe-border flex flex-col items-center justify-center cursor-pointer overflow-hidden">
          {file ? (
            <video
              src={URL.createObjectURL(file)}
              className="w-full h-full object-cover"
              muted
              controls
            />
          ) : (
            <div className="text-center text-moxe-textSecondary">
              <div className="w-16 h-16 rounded-full bg-moxe-background flex items-center justify-center mx-auto mb-2 text-2xl">
                ＋
              </div>
              <ThemedText secondary className="block text-moxe-body">
                Tap to add a video
              </ThemedText>
            </div>
          )}
          <input
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0] || null;
              setFile(f);
            }}
          />
        </label>

        <div className="space-y-3">
          <div>
            <ThemedText secondary className="text-moxe-caption mb-1 block">
              Caption
            </ThemedText>
            <ThemedInput
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write a caption…"
            />
          </div>
          <div>
            <ThemedText secondary className="text-moxe-caption mb-1 block">
              Alt text (accessibility)
            </ThemedText>
            <ThemedInput
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="Describe this video for people using screen readers"
            />
          </div>
          <div className="border border-moxe-border rounded-moxe-md p-3 space-y-2 text-[11px]">
            <ThemedText secondary className="text-moxe-caption mb-1 block">
              Video editing (metadata only)
            </ThemedText>
            <div className="flex items-center gap-2">
              <span className="w-20">Trim start (ms)</span>
              <input
                type="number"
                value={startMs}
                onChange={(e) => setStartMs(Number(e.target.value) || 0)}
                className="flex-1 px-2 py-1 rounded-moxe-md bg-moxe-surface border border-moxe-border text-moxe-body"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="w-20">Trim end (ms)</span>
              <input
                type="number"
                value={endMs}
                onChange={(e) => setEndMs(Number(e.target.value) || 0)}
                className="flex-1 px-2 py-1 rounded-moxe-md bg-moxe-surface border border-moxe-border text-moxe-body"
              />
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={mute}
                onChange={(e) => setMute(e.target.checked)}
                className="w-3 h-3 rounded border-moxe-border bg-moxe-background"
              />
              <span>Mute audio</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="w-20">Speed</span>
              <input
                type="range"
                min={0.5}
                max={2}
                step={0.25}
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value) || 1)}
                className="flex-1"
              />
              <span>{speed.toFixed(2)}x</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-20">Filter</span>
              <select
                value={filter}
                onChange={(e) =>
                  setFilter(e.target.value as 'original' | 'vivid' | 'mono' | 'warm')
                }
                className="flex-1 px-2 py-1 rounded-moxe-md bg-moxe-surface border border-moxe-border text-moxe-body"
              >
                <option value="original">Original</option>
                <option value="vivid">Vivid</option>
                <option value="mono">Mono</option>
                <option value="warm">Warm</option>
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-moxe-body">
            <input
              type="checkbox"
              checked={isSubscriberOnly}
              onChange={(e) => setIsSubscriberOnly(e.target.checked)}
              className="w-4 h-4 rounded border-moxe-border bg-moxe-background"
            />
            Subscribers only
          </label>
        </div>
      </div>
    </ThemedView>
  );
}

