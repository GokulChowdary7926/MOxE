import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ThemedView, ThemedHeader, ThemedText, ThemedButton, ThemedInput } from '../../components/ui/Themed';
import { useAccountCapabilities } from '../../hooks/useAccountCapabilities';
import { getApiBase, getUploadUrl } from '../../services/api';
import { messageFromUnknown, userFacingApiError, userFacingUploadError } from '../../utils/userFacingErrors';
import type { SpotifyTrack } from '../../services/spotifyApi';
import { Star } from 'lucide-react';
import { useCurrentAccount } from '../../hooks/useAccountCapabilities';

const API_BASE = getApiBase();

type StorySticker =
  | { type: 'poll'; question: string; options: string[] }
  | { type: 'questions'; prompt: string }
  | { type: 'countdown'; title: string; notifyAt: string }
  | { type: 'link'; url: string; label?: string }
  | { type: 'donation'; url: string; label?: string; amountSuggestion?: number }
  | { type: 'emoji_slider'; emoji: string; label?: string }
  | {
      type: 'music';
      trackName: string;
      artist: string;
      spotifyId?: string;
      previewUrl?: string | null;
      albumArt?: string | null;
    };

export default function CreateStory() {
  const navigate = useNavigate();
  const location = useLocation() as any;
  const currentAccount = useCurrentAccount() as { username?: string } | null;
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('');
  const [textLayers, setTextLayers] = useState<
    { id: string; value: string; align: 'left' | 'center' | 'right'; color: string }[]
  >([]);
  const [stickers, setStickers] = useState<StorySticker[]>([]);
  const [activeStickerTab, setActiveStickerTab] = useState<
    'none' | 'poll' | 'question' | 'countdown' | 'link' | 'donation' | 'emoji'
  >('none');
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOption1, setPollOption1] = useState('');
  const [pollOption2, setPollOption2] = useState('');
  const [questionPrompt, setQuestionPrompt] = useState('');
  const [countdownTitle, setCountdownTitle] = useState('');
  const [countdownTime, setCountdownTime] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkLabel, setLinkLabel] = useState('');
  const [donationUrl, setDonationUrl] = useState('');
  const [donationLabel, setDonationLabel] = useState('');
  const [donationAmount, setDonationAmount] = useState('');
  const [emojiChar, setEmojiChar] = useState('💜');
  const [emojiLabel, setEmojiLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [altText, setAltText] = useState('');
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
  const [layerTransforms, setLayerTransforms] = useState<
    Record<string, { x: number; y: number; scale: number; rotation: number }>
  >({});
  const [isSubscriberOnly, setIsSubscriberOnly] = useState(false);
  const [subscriberTierKeys, setSubscriberTierKeys] = useState<string[]>([]);
  const [creatorTiers, setCreatorTiers] = useState<{ key: string; name?: string; price?: number }[]>([]);
  const [allowReplies, setAllowReplies] = useState(true);
  const [allowReshares, setAllowReshares] = useState(true);
  const [audience, setAudience] = useState<'PUBLIC' | 'CLOSE_FRIENDS_ONLY'>('PUBLIC');

  const cap = useAccountCapabilities();

  // Load creator subscription tiers when user can use subscriber-only
  useEffect(() => {
    if (!cap?.canSubscriptions) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`${API_BASE}/accounts/me/subscription-tiers`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : { tiers: [] }))
      .then((data) => setCreatorTiers(Array.isArray(data?.tiers) ? data.tiers : []))
      .catch(() => {});
  }, [cap?.canSubscriptions]);

  // Prefill file from camera capture or add-story flow
  React.useEffect(() => {
    const state = (location && (location.state as any)) || null;
    if (state?.file && state.file instanceof File) {
      setFile(state.file);
    }
  }, [location?.state]);

  // Music sticker from Story music picker (Spotify)
  React.useEffect(() => {
    const state = (location.state as { prefillMusic?: SpotifyTrack; file?: File } | null) || null;
    const pm = state?.prefillMusic;
    if (!pm?.id) return;
    setStickers((prev) => [
      ...prev.filter((x) => x.type !== 'music'),
      {
        type: 'music',
        trackName: pm.name,
        artist: pm.artists,
        spotifyId: pm.id,
        previewUrl: pm.preview_url ?? null,
        albumArt: pm.album_image_url ?? null,
      },
    ]);
    navigate(location.pathname, { replace: true, state: { ...state, prefillMusic: undefined } });
  }, [location.pathname, location.state, navigate]);

  // Prefill from "share question answer as story" flow
  React.useEffect(() => {
    const state = (location && (location.state as any)) || null;
    if (state?.prefillQuestionAnswer && !text) {
      setText(state.prefillQuestionAnswer);
    }
    // If user came from "Customize share to story", we may have stored a simple hint in localStorage.
    if (!state?.prefillQuestionAnswer && !text) {
      try {
        const raw = localStorage.getItem('moxe_share_story_hint');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.fromPostId) {
            setText('Shared from a post – add your text here');
          }
          localStorage.removeItem('moxe_share_story_hint');
        }
      } catch {
        // ignore
      }
    }
  }, [location, text]);

  async function handleShare() {
    try {
      setError(null);
      if (!file) {
        setError('Please add an image or video first.');
        return;
      }
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You must be logged in to post a story.');
        return;
      }
      setLoading(true);

      const form = new FormData();
      form.append('file', file);
      const uploadRes = await fetch(getUploadUrl(), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!uploadRes.ok) {
        throw new Error(await userFacingUploadError(uploadRes, 'Could not upload your media.'));
      }
      const uploadData = (await uploadRes.json().catch(() => ({}))) as { url?: string };
      if (!uploadData.url) {
        throw new Error('Could not upload your media.');
      }

      const body = {
        media: [{ url: uploadData.url }],
        text: text || undefined,
        textLayers: textLayers
          .filter((t) => t.value.trim().length > 0)
          .map((t) => {
            const tr = layerTransforms[t.id] || { x: 0, y: 0, scale: 1, rotation: 0 };
            return {
              ...t,
              x: tr.x,
              y: tr.y,
              scale: tr.scale,
              rotation: tr.rotation,
            };
          }),
        altText: altText.trim() || undefined,
        stickers: stickers.length ? stickers : undefined,
        allowReplies,
        allowReshares,
        privacy: audience,
        isCloseFriendsOnly: audience === 'CLOSE_FRIENDS_ONLY',
        ...(cap?.canSubscriptions && isSubscriberOnly && { isSubscriberOnly: true, subscriberTierKeys: subscriberTierKeys.length > 0 ? subscriberTierKeys : undefined }),
      };
      const storyRes = await fetch(`${API_BASE}/stories`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (!storyRes.ok) {
        throw new Error(await userFacingApiError(storyRes, 'Could not post your story.'));
      }
      const storyData = await storyRes.json().catch(() => ({}));

      const ctx = (location.state as { linkQuestionContext?: { sourceStoryId: string; questionId: string } } | null)
        ?.linkQuestionContext;
      const newStoryId = storyData?.id as string | undefined;
      if (ctx?.sourceStoryId && ctx?.questionId && newStoryId) {
        const linkRes = await fetch(
          `${API_BASE}/stories/${encodeURIComponent(ctx.sourceStoryId)}/questions/${encodeURIComponent(ctx.questionId)}/link-answer`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ answerStoryId: newStoryId }),
          },
        );
        if (!linkRes.ok) {
          throw new Error(await userFacingApiError(linkRes, 'Story posted, but linking the Q&A answer failed.'));
        }
        await linkRes.json().catch(() => ({}));
      }

      if (currentAccount?.username) navigate(`/stories/${currentAccount.username}`);
      else navigate('/profile');
    } catch (e: unknown) {
      setError(messageFromUnknown(e, 'Something went wrong.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ThemedView className="min-h-screen flex flex-col">
      <ThemedHeader
        title="New story"
        left={
          <Link to="/" className="text-moxe-text text-2xl leading-none" aria-label="Back">
            ←
          </Link>
        }
        right={
          <ThemedButton
            label={loading ? 'Posting…' : 'Post'}
            onClick={handleShare}
            disabled={loading}
            className="px-3 py-1 text-xs"
          />
        }
      />
      <div className="flex-1 flex flex-col px-moxe-md py-moxe-md gap-4">
        <div className="w-full aspect-[9/16] bg-moxe-surface rounded-moxe-md border border-moxe-border flex flex-col items-center justify-center overflow-hidden relative">
          <label className="absolute inset-0 cursor-pointer">
            {file ? (
              <img src={URL.createObjectURL(file)} alt="Story media" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-center text-moxe-textSecondary">
                <div className="w-16 h-16 rounded-full bg-moxe-background flex items-center justify-center mx-auto mb-2 text-2xl">
                  ＋
                </div>
                <ThemedText secondary className="block text-moxe-body">
                  Tap to add image or video
                </ThemedText>
              </div>
            )}
            <input
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                setFile(f);
              }}
            />
          </label>
          {textLayers
            .filter((l) => l.value.trim().length > 0)
            .map((layer) => {
              const tr = layerTransforms[layer.id] || { x: 0, y: 0, scale: 1, rotation: 0 };
              return (
                <div
                  key={layer.id}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    const startX = e.clientX;
                    const startY = e.clientY;
                    const start = layerTransforms[layer.id] || { x: 0, y: 0, scale: 1, rotation: 0 };
                    setActiveLayerId(layer.id);
                    const handleMove = (ev: MouseEvent) => {
                      const dx = ev.clientX - startX;
                      const dy = ev.clientY - startY;
                      setLayerTransforms((prev) => ({
                        ...prev,
                        [layer.id]: { ...start, x: start.x + dx, y: start.y + dy },
                      }));
                    };
                    const handleUp = () => {
                      window.removeEventListener('mousemove', handleMove);
                      window.removeEventListener('mouseup', handleUp);
                    };
                    window.addEventListener('mousemove', handleMove);
                    window.addEventListener('mouseup', handleUp);
                  }}
                  className={`absolute px-2 py-1 rounded-full text-xs font-semibold cursor-move select-none ${
                    activeLayerId === layer.id ? 'ring-2 ring-moxe-primary' : ''
                  }`}
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: `translate(-50%, -50%) translate(${tr.x}px, ${tr.y}px) scale(${tr.scale}) rotate(${tr.rotation}deg)`,
                    textAlign: layer.align,
                    color: layer.color,
                    backgroundColor: 'rgba(0,0,0,0.3)',
                  }}
                >
                  {layer.value}
                </div>
              );
            })}
        </div>

        <div className="space-y-3">
          {cap?.canCloseFriends && (
            <div className="space-y-2 pt-1">
              <ThemedText secondary className="text-moxe-caption mb-1 block">
                Share to
              </ThemedText>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAudience('PUBLIC')}
                  className={`px-3 py-1.5 rounded-full text-sm border ${
                    audience === 'PUBLIC'
                      ? 'bg-moxe-primary border-moxe-primary text-white'
                      : 'bg-moxe-surface border-moxe-border text-moxe-textSecondary'
                  }`}
                >
                  Everyone
                </button>
                <button
                  type="button"
                  onClick={() => setAudience('CLOSE_FRIENDS_ONLY')}
                  className={`px-3 py-1.5 rounded-full text-sm border inline-flex items-center gap-1.5 ${
                    audience === 'CLOSE_FRIENDS_ONLY'
                      ? 'bg-moxe-primary border-moxe-primary text-white'
                      : 'bg-moxe-surface border-moxe-border text-moxe-textSecondary'
                  }`}
                >
                  <Star className="w-4 h-4" />
                  Close Friends
                </button>
              </div>
            </div>
          )}

          <div>
            <ThemedText secondary className="text-moxe-caption mb-1 block">
              Main text (optional)
            </ThemedText>
            <ThemedInput
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Add a caption or emoji"
            />
          </div>
          <div className="border border-moxe-border rounded-moxe-md p-2 space-y-2">
            <ThemedText secondary className="text-moxe-caption mb-1 block text-[11px]">
              Extra text layers (web approximation of fonts/positions)
            </ThemedText>
            {textLayers.map((layer) => (
              <div key={layer.id} className="flex items-center gap-2 text-[11px]">
                <input
                  value={layer.value}
                  onChange={(e) =>
                    setTextLayers((prev) =>
                      prev.map((l) =>
                        l.id === layer.id ? { ...l, value: e.target.value } : l,
                      ),
                    )
                  }
                  placeholder="Text"
                  className="flex-1 px-2 py-1 rounded-moxe-md bg-moxe-surface border border-moxe-border text-moxe-body"
                />
                <select
                  value={layer.align}
                  onChange={(e) =>
                    setTextLayers((prev) =>
                      prev.map((l) =>
                        l.id === layer.id
                          ? {
                              ...l,
                              align: e.target.value as 'left' | 'center' | 'right',
                            }
                          : l,
                      ),
                    )
                  }
                  className="px-1 py-1 rounded-moxe-md bg-moxe-surface border border-moxe-border"
                >
                  <option value="left">L</option>
                  <option value="center">C</option>
                  <option value="right">R</option>
                </select>
                <input
                  type="color"
                  value={layer.color}
                  onChange={(e) =>
                    setTextLayers((prev) =>
                      prev.map((l) =>
                        l.id === layer.id ? { ...l, color: e.target.value } : l,
                      ),
                    )
                  }
                  className="w-8 h-7 rounded-md border border-moxe-border"
                />
                <button
                  type="button"
                  onClick={() =>
                    setTextLayers((prev) => prev.filter((l) => l.id !== layer.id))
                  }
                  className="text-moxe-textSecondary"
                >
                  ✕
                </button>
              </div>
            ))}
            {activeLayerId && (
              <div className="mt-2 flex flex-col gap-1 text-[11px]">
                <ThemedText secondary className="text-moxe-caption">
                  Selected layer transform
                </ThemedText>
                <div className="flex items-center gap-2">
                  <span className="text-moxe-caption">Size</span>
                  <input
                    type="range"
                    min={50}
                    max={200}
                    defaultValue={100}
                    onChange={(e) => {
                      const scale = Number(e.target.value) / 100;
                      setLayerTransforms((prev) => {
                        const base = prev[activeLayerId!] || { x: 0, y: 0, scale: 1, rotation: 0 };
                        return { ...prev, [activeLayerId!]: { ...base, scale } };
                      });
                    }}
                    className="flex-1"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-moxe-caption">Rotate</span>
                  <input
                    type="range"
                    min={-45}
                    max={45}
                    defaultValue={0}
                    onChange={(e) => {
                      const rotation = Number(e.target.value);
                      setLayerTransforms((prev) => {
                        const base = prev[activeLayerId!] || { x: 0, y: 0, scale: 1, rotation: 0 };
                        return { ...prev, [activeLayerId!]: { ...base, rotation } };
                      });
                    }}
                    className="flex-1"
                  />
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={() =>
                setTextLayers((prev) => [
                  ...prev,
                  {
                    id: String(Date.now()) + Math.random().toString(16).slice(2),
                    value: '',
                    align: 'center',
                    color: '#ffffff',
                  },
                ])
              }
              className="text-[11px] text-moxe-primary"
            >
              + Add text layer
            </button>
          </div>
          <div>
            <ThemedText secondary className="text-moxe-caption mb-1 block">
              Alt text (accessibility)
            </ThemedText>
            <ThemedInput
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="Describe this story image or video for people using screen readers"
            />
          </div>
          <div className="space-y-2 pt-2 border-t border-moxe-border">
            <p className="text-xs text-moxe-caption mb-1">Who can interact</p>
            <label className="flex items-center gap-2 text-sm text-moxe-body">
              <input type="checkbox" checked={allowReplies} onChange={(e) => setAllowReplies(e.target.checked)} className="w-4 h-4 rounded border-moxe-border bg-moxe-background" />
              Allow replies
            </label>
            <label className="flex items-center gap-2 text-sm text-moxe-body">
              <input type="checkbox" checked={allowReshares} onChange={(e) => setAllowReshares(e.target.checked)} className="w-4 h-4 rounded border-moxe-border bg-moxe-background" />
              Allow resharing
            </label>
          </div>
          {cap?.canSubscriptions && (
            <div className="space-y-2 pt-2 border-t border-moxe-border">
              <label className="flex items-center gap-2 text-sm text-moxe-body">
                <input
                  type="checkbox"
                  checked={isSubscriberOnly}
                  onChange={(e) => setIsSubscriberOnly(e.target.checked)}
                  className="w-4 h-4 rounded border-moxe-border bg-moxe-background"
                />
                Subscribers only
              </label>
              {isSubscriberOnly && creatorTiers.length > 0 && (
                <div className="pl-2">
                  <p className="text-xs text-moxe-caption mb-1">Limit to tiers (empty = any subscriber)</p>
                  <div className="flex flex-wrap gap-2">
                    {creatorTiers.map((t) => (
                      <label key={t.key} className="flex items-center gap-1.5 text-sm text-moxe-body">
                        <input
                          type="checkbox"
                          checked={subscriberTierKeys.includes(t.key)}
                          onChange={(e) => {
                            if (e.target.checked) setSubscriberTierKeys((prev) => [...prev, t.key]);
                            else setSubscriberTierKeys((prev) => prev.filter((k) => k !== t.key));
                          }}
                          className="w-4 h-4 rounded border-moxe-border bg-moxe-background"
                        />
                        {t.name || t.key}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border border-moxe-border rounded-moxe-md p-3 space-y-3">
          <ThemedText secondary className="text-moxe-caption mb-1 block">
            Stickers (poll, questions, countdown, link, donation, emoji slider)
          </ThemedText>
          <div className="flex gap-2 text-xs">
            {[
              { key: 'poll', label: 'Poll' },
              { key: 'question', label: 'Questions' },
              { key: 'countdown', label: 'Countdown' },
              { key: 'link', label: 'Link' },
              { key: 'donation', label: 'Donation' },
              { key: 'emoji', label: 'Emoji slider' },
            ].map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() =>
                  setActiveStickerTab(
                    activeStickerTab === (t.key as any) ? 'none' : (t.key as any),
                  )
                }
                className={`px-2 py-1 rounded-full border ${
                  activeStickerTab === t.key
                    ? 'bg-moxe-primary border-moxe-primary text-white'
                    : 'bg-moxe-surface border-moxe-border text-moxe-text'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {activeStickerTab === 'poll' && (
            <div className="space-y-2 text-xs">
              <ThemedInput
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                placeholder="Poll question"
              />
              <ThemedInput
                value={pollOption1}
                onChange={(e) => setPollOption1(e.target.value)}
                placeholder="Option 1"
              />
              <ThemedInput
                value={pollOption2}
                onChange={(e) => setPollOption2(e.target.value)}
                placeholder="Option 2"
              />
              <ThemedButton
                label="Add poll sticker"
                onClick={() => {
                  const q = pollQuestion.trim();
                  const opts = [pollOption1, pollOption2]
                    .map((o) => o.trim())
                    .filter(Boolean);
                  if (!q || opts.length < 2) {
                    setError('Enter a question and at least 2 options for the poll.');
                    return;
                  }
                  setStickers((prev) => [...prev, { type: 'poll', question: q, options: opts }]);
                  setPollQuestion('');
                  setPollOption1('');
                  setPollOption2('');
                  setActiveStickerTab('none');
                }}
                className="px-2 py-1 text-xs"
              />
            </div>
          )}

          {activeStickerTab === 'question' && (
            <div className="space-y-2 text-xs">
              <ThemedInput
                value={questionPrompt}
                onChange={(e) => setQuestionPrompt(e.target.value)}
                placeholder="Ask me a question…"
              />
              <ThemedButton
                label="Add questions sticker"
                onClick={() => {
                  const p = questionPrompt.trim();
                  if (!p) {
                    setError('Enter a prompt for the questions sticker.');
                    return;
                  }
                  setStickers((prev) => [...prev, { type: 'questions', prompt: p }]);
                  setQuestionPrompt('');
                  setActiveStickerTab('none');
                }}
                className="px-2 py-1 text-xs"
              />
            </div>
          )}

          {activeStickerTab === 'countdown' && (
            <div className="space-y-2 text-xs">
              <ThemedInput
                value={countdownTitle}
                onChange={(e) => setCountdownTitle(e.target.value)}
                placeholder="Countdown title"
              />
              <input
                type="datetime-local"
                value={countdownTime}
                onChange={(e) => setCountdownTime(e.target.value)}
                className="w-full px-3 py-2 rounded-moxe-md bg-moxe-surface border border-moxe-border text-moxe-body text-moxe-text"
              />
              <ThemedButton
                label="Add countdown"
                onClick={() => {
                  const title = countdownTitle.trim();
                  if (!title || !countdownTime) {
                    setError('Enter a title and end time for the countdown.');
                    return;
                  }
                  setStickers((prev) => [
                    ...prev,
                    { type: 'countdown', title, notifyAt: countdownTime },
                  ]);
                  setCountdownTitle('');
                  setCountdownTime('');
                  setActiveStickerTab('none');
                }}
                className="px-2 py-1 text-xs"
              />
            </div>
          )}

          {activeStickerTab === 'link' && (
            <div className="space-y-2 text-xs">
              <ThemedInput
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
              />
              <ThemedInput
                value={linkLabel}
                onChange={(e) => setLinkLabel(e.target.value)}
                placeholder="Link label (optional)"
              />
              <ThemedButton
                label="Add link sticker"
                onClick={() => {
                  const url = linkUrl.trim();
                  if (!url) {
                    setError('Enter a URL for the link sticker.');
                    return;
                  }
                  setStickers((prev) => [
                    ...prev,
                    { type: 'link', url, label: linkLabel.trim() || undefined },
                  ]);
                  setLinkUrl('');
                  setLinkLabel('');
                  setActiveStickerTab('none');
                }}
                className="px-2 py-1 text-xs"
              />
            </div>
          )}

          {activeStickerTab === 'donation' && (
            <div className="space-y-2 text-xs">
              <ThemedInput
                value={donationUrl}
                onChange={(e) => setDonationUrl(e.target.value)}
                placeholder="Donation link (e.g. https://donate.example.com/creator)"
              />
              <ThemedInput
                value={donationLabel}
                onChange={(e) => setDonationLabel(e.target.value)}
                placeholder="Button label (e.g. Support this creator)"
              />
              <ThemedInput
                value={donationAmount}
                onChange={(e) => setDonationAmount(e.target.value)}
                placeholder="Suggested amount (optional, e.g. 5.00)"
              />
              <ThemedButton
                label="Add donation sticker"
                onClick={() => {
                  const url = donationUrl.trim();
                  if (!url) {
                    setError('Enter a URL for the donation sticker.');
                    return;
                  }
                  const amount =
                    donationAmount.trim() !== '' ? Number(donationAmount.trim()) : undefined;
                  setStickers((prev) => [
                    ...prev,
                    {
                      type: 'donation',
                      url,
                      label: donationLabel.trim() || undefined,
                      amountSuggestion:
                        typeof amount === 'number' && !Number.isNaN(amount) ? amount : undefined,
                    },
                  ]);
                  setDonationUrl('');
                  setDonationLabel('');
                  setDonationAmount('');
                  setActiveStickerTab('none');
                }}
                className="px-2 py-1 text-xs"
              />
            </div>
          )}

          {activeStickerTab === 'emoji' && (
            <div className="space-y-2 text-xs">
              <ThemedInput
                value={emojiChar}
                onChange={(e) => setEmojiChar(e.target.value || '💜')}
                placeholder="Emoji (e.g. 💜)"
              />
              <ThemedInput
                value={emojiLabel}
                onChange={(e) => setEmojiLabel(e.target.value)}
                placeholder="Slider label (optional)"
              />
              <ThemedButton
                label="Add emoji slider"
                onClick={() => {
                  const emoji = emojiChar || '💜';
                  setStickers((prev) => [
                    ...prev,
                    { type: 'emoji_slider', emoji, label: emojiLabel.trim() || undefined },
                  ]);
                  setEmojiChar('💜');
                  setEmojiLabel('');
                  setActiveStickerTab('none');
                }}
                className="px-2 py-1 text-xs"
              />
            </div>
          )}

          {stickers.length > 0 && (
            <div className="pt-2 border-t border-moxe-border/60 text-[11px] space-y-1">
              <ThemedText secondary className="text-moxe-caption">
                Added stickers:
              </ThemedText>
              <div className="flex flex-wrap gap-1">
                {stickers.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() =>
                      setStickers((prev) => prev.filter((_, i) => i !== idx))
                    }
                    className="px-2 py-0.5 rounded-full bg-moxe-surface border border-moxe-border text-moxe-caption"
                  >
                    {s.type === 'music' ? `🎵 ${s.trackName}` : s.type}
                    <span className="ml-1 text-moxe-textSecondary">✕</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {error && (
          <ThemedText className="text-moxe-caption text-moxe-danger">
            {error}
          </ThemedText>
        )}
      </div>
    </ThemedView>
  );
}

