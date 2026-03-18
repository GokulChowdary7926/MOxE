import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Users, Settings } from 'lucide-react';
import { useAccountCapabilities, useCurrentAccount } from '../../hooks/useAccountCapabilities';
import { getApiBase } from '../../services/api';

const API_BASE = getApiBase();

export default function CreatePost() {
  const cap = useAccountCapabilities();
  const account = useCurrentAccount();
  const navigate = useNavigate();
  const [caption, setCaption] = useState('');
  const [scheduledFor, setScheduledFor] = useState('');
  const [showScheduling, setShowScheduling] = useState(false);
  const [location, setLocation] = useState('');
  const [altText, setAltText] = useState('');
  const [allowComments, setAllowComments] = useState(true);
  const [hideLikeCount, setHideLikeCount] = useState(false);
  const [privacy, setPrivacy] = useState<'PUBLIC' | 'FOLLOWERS_ONLY' | 'CLOSE_FRIENDS_ONLY' | 'ONLY_ME'>('PUBLIC');
  const [screenshotProtection, setScreenshotProtection] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [mediaAltTexts, setMediaAltTexts] = useState<string[]>([]);
  const [mediaZoom, setMediaZoom] = useState<number[]>([]);
  const [mediaRotation, setMediaRotation] = useState<number[]>([]);
  const [mediaFilter, setMediaFilter] = useState<string[]>([]);
  const [mediaAdjustments, setMediaAdjustments] = useState<
    { brightness: number; contrast: number; saturation: number; warmth: number; fade: number; highlights: number; shadows: number; vignette: number }[]
  >([]);
  const [videoMute, setVideoMute] = useState<boolean[]>([]);
  const [videoSpeed, setVideoSpeed] = useState<number[]>([]);
  const [videoTrim, setVideoTrim] = useState<{ startSec: number; endSec?: number }[]>([]);
  const [videoCoverSec, setVideoCoverSec] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hashtagQuery, setHashtagQuery] = useState('');
  const [hashtagSuggestions, setHashtagSuggestions] = useState<string[]>([]);
  const [showHashtags, setShowHashtags] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionSuggestions, setMentionSuggestions] = useState<
    { id: string; username: string; displayName?: string | null }[]
  >([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);
  const [locationQuery, setLocationQuery] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<{ id: string; name: string }[]>([]);
  const [showLocationResults, setShowLocationResults] = useState(false);
  const [placeId, setPlaceId] = useState<string | null>(null);
  const [recentLocations, setRecentLocations] = useState<string[]>([]);
  const [isSubscriberOnly, setIsSubscriberOnly] = useState(false);
  const [subscriberTierKeys, setSubscriberTierKeys] = useState<string[]>([]);
  const [creatorTiers, setCreatorTiers] = useState<{ key: string; name?: string; price?: number }[]>([]);
  const [brandedContentBrandId, setBrandedContentBrandId] = useState('');
  const [brandedContentDisclosure, setBrandedContentDisclosure] = useState(true);
  const displayName = (account as any)?.displayName || 'You';
  const DRAFT_KEY = 'moxe:createPostDraft';
  const RECENT_LOC_KEY = 'moxe:recentLocations';

  // Load draft on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (typeof draft.caption === 'string') setCaption(draft.caption);
      if (typeof draft.location === 'string') setLocation(draft.location);
      if (typeof draft.altText === 'string') setAltText(draft.altText);
      if (typeof draft.allowComments === 'boolean') setAllowComments(draft.allowComments);
      if (typeof draft.hideLikeCount === 'boolean') setHideLikeCount(draft.hideLikeCount);
      if (typeof draft.privacy === 'string') setPrivacy(draft.privacy);
      if (typeof draft.screenshotProtection === 'boolean') setScreenshotProtection(draft.screenshotProtection);
      if (typeof draft.scheduledFor === 'string') setScheduledFor(draft.scheduledFor);
    } catch {
      // ignore bad draft
    }
  }, []);

  // Load recent locations once
  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_LOC_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setRecentLocations(parsed.filter((x) => typeof x === 'string') as string[]);
      }
    } catch {
      // ignore
    }
  }, []);

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

  // Persist draft when key fields change (media not persisted)
  useEffect(() => {
    try {
      const payload = {
        caption,
        location,
        altText,
        allowComments,
        hideLikeCount,
        privacy,
        screenshotProtection,
        scheduledFor,
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
    } catch {
      // ignore storage errors
    }
  }, [caption, location, altText, allowComments, hideLikeCount, privacy, screenshotProtection, scheduledFor]);

  function clearDraft() {
    localStorage.removeItem(DRAFT_KEY);
    setCaption('');
    setLocation('');
    setAltText('');
    setAllowComments(true);
    setHideLikeCount(false);
    setPrivacy('PUBLIC');
    setScreenshotProtection(false);
    setScheduledFor('');
    setPlaceId(null);
    setActiveIndex(0);
    setMediaAltTexts([]);
    setMediaZoom([]);
    setMediaRotation([]);
    setMediaFilter([]);
    setMediaAdjustments([]);
  }

  // Keep active index in range when files change
  useEffect(() => {
    if (activeIndex >= files.length) {
      setActiveIndex(files.length > 0 ? files.length - 1 : 0);
    }
  }, [files.length, activeIndex]);

  function rememberLocation(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    setRecentLocations((prev) => {
      const next = [trimmed, ...prev.filter((x) => x !== trimmed)].slice(0, 5);
      try {
        localStorage.setItem(RECENT_LOC_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }

  useEffect(() => {
    let cancelled = false;
    async function fetchHashtags() {
      if (!hashtagQuery.trim()) {
        setHashtagSuggestions([]);
        return;
      }
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch(
          `${API_BASE}/explore/hashtags/suggest?q=${encodeURIComponent(hashtagQuery)}&limit=8`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok || cancelled) return;
        setHashtagSuggestions(data.hashtags ?? []);
      } catch {
        if (!cancelled) setHashtagSuggestions([]);
      }
    }
    if (hashtagQuery) {
      fetchHashtags();
    }
    return () => {
      cancelled = true;
    };
  }, [hashtagQuery]);

  useEffect(() => {
    let cancelled = false;
    async function fetchMentions() {
      if (!mentionQuery.trim()) {
        setMentionSuggestions([]);
        return;
      }
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch(
          `${API_BASE}/explore/search?q=${encodeURIComponent(mentionQuery)}&type=users`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok || cancelled) return;
        const users = (data.users ?? []) as {
          id: string;
          username: string;
          displayName?: string | null;
        }[];
        setMentionSuggestions(users);
      } catch {
        if (!cancelled) setMentionSuggestions([]);
      }
    }
    if (mentionQuery) {
      fetchMentions();
    }
    return () => {
      cancelled = true;
    };
  }, [mentionQuery]);

  // Location search for composer – backed by /api/location/search
  useEffect(() => {
    let cancelled = false;
    async function fetchLocations() {
      const q = locationQuery.trim();
      if (!q) {
        setLocationSuggestions([]);
        return;
      }
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch(
          `${API_BASE}/location/search?q=${encodeURIComponent(q)}&limit=8`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok || cancelled) return;
        const places = (data.places ?? []) as { id: string; name: string }[];
        setLocationSuggestions(places);
      } catch {
        if (!cancelled) setLocationSuggestions([]);
      }
    }
    if (locationQuery) {
      fetchLocations();
    }
    return () => {
      cancelled = true;
    };
  }, [locationQuery]);

  function handleCaptionChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value;
    setCaption(value);

    // Very lightweight detection for hashtag and mention helpers
    const lastToken = value.split(/\s/).pop() || '';
    if (lastToken.startsWith('#')) {
      setHashtagQuery(lastToken.slice(1));
      setShowHashtags(true);
      setShowMentions(false);
      setMentionQuery('');
    } else {
      setHashtagQuery('');
      setShowHashtags(false);
    }
    if (lastToken.startsWith('@')) {
      setMentionQuery(lastToken.slice(1));
      setShowMentions(true);
      setShowHashtags(false);
    } else {
      setMentionQuery('');
      setShowMentions(false);
    }
  }

  function insertHashtag(tag: string) {
    const trimmed = caption.replace(/\s+$/, '');
    const base = trimmed === '' ? '' : `${trimmed} `;
    setCaption(`${base}#${tag} `);
    setShowHashtags(false);
    setHashtagQuery('');
  }

  function insertMention(user: { id: string; username: string }) {
    const parts = caption.split(/\s/);
    if (parts.length === 0) {
      setCaption(`@${user.username} `);
    } else {
      parts[parts.length - 1] = `@${user.username}`;
      setCaption(`${parts.join(' ')} `);
    }
    setMentionedUserIds((prev) => (prev.includes(user.id) ? prev : [...prev, user.id]));
    setShowMentions(false);
    setMentionQuery('');
  }

  async function handleShare() {
    try {
      setError(null);
      if (!files.length) {
        setError('Please add at least one image or video.');
        return;
      }
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You must be logged in to share a post.');
        return;
      }
      setSubmitting(true);

      // 1) Upload all media in order
      const uploadedUrls: string[] = [];
      for (const file of files) {
        const form = new FormData();
        form.append('file', file);
        const uploadRes = await fetch(`${API_BASE}/upload`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: form,
        });
        const uploadData = await uploadRes.json().catch(() => ({}));
        if (!uploadRes.ok || !uploadData.url) {
          throw new Error(uploadData.error || 'Failed to upload media.');
        }
        uploadedUrls.push(uploadData.url);
      }

      // 2) Create post with media carousel (per-media alt text + basic edits + video options)
      const mediaPayload = uploadedUrls.map((url, idx) => {
        const file = files[idx];
        const isVideo = file?.type?.startsWith('video/');
        const edits: Record<string, unknown> = {
          zoom: mediaZoom[idx] ?? 1,
          rotation: mediaRotation[idx] ?? 0,
          filter: mediaFilter[idx] || 'original',
          adjustments: mediaAdjustments[idx] || {
            brightness: 0,
            contrast: 0,
            saturation: 0,
            warmth: 0,
            fade: 0,
            highlights: 0,
            shadows: 0,
            vignette: 0,
          },
        };
        if (isVideo) {
          edits.mute = videoMute[idx] ?? false;
          edits.speed = videoSpeed[idx] ?? 1;
          const trim = videoTrim[idx];
          if (trim && (trim.startSec > 0 || (trim.endSec != null && trim.endSec > 0))) {
            edits.trim = { startSec: trim.startSec, endSec: trim.endSec };
          }
          if (videoCoverSec[idx] != null && videoCoverSec[idx] > 0) {
            edits.coverTimeSec = videoCoverSec[idx];
          }
        }
        return {
          url,
          altText: (mediaAltTexts[idx] || '').trim() || undefined,
          edits,
        };
      });
      const primaryAlt =
        (mediaPayload[0]?.altText as string | undefined) || (altText || undefined);
      const body = {
        media: mediaPayload,
        caption: caption || undefined,
        altText: primaryAlt,
        location: location || undefined,
        placeId: placeId || undefined,
        allowComments,
        hideLikeCount,
        privacy,
        screenshotProtection,
        isScheduled: !!(cap.canSchedulePosts && scheduledFor),
        scheduledFor: cap.canSchedulePosts && scheduledFor ? scheduledFor : undefined,
        ...(mentionedUserIds.length > 0 && { mentionedUserIds }),
        ...(cap.canSubscriptions && isSubscriberOnly && { isSubscriberOnly: true, subscriberTierKeys: subscriberTierKeys.length > 0 ? subscriberTierKeys : undefined }),
        ...(brandedContentBrandId.trim() && { brandedContentBrandId: brandedContentBrandId.trim(), brandedContentDisclosure }),
      };
      const postRes = await fetch(`${API_BASE}/posts`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      const postData = await postRes.json().catch(() => ({}));
      if (!postRes.ok) {
        throw new Error(postData.error || 'Failed to create post.');
      }

      clearDraft();
      setFiles([]);
      setMediaAltTexts([]);
      setMediaZoom([]);
      setMediaRotation([]);
      setMediaFilter([]);
      setMediaAdjustments([]);
      setMentionedUserIds([]);
      setVideoMute([]);
      setVideoSpeed([]);
      setVideoTrim([]);
      setVideoCoverSec([]);

      // Navigate back to Home so the new post appears in feed
      navigate('/');
    } catch (e: any) {
      setError(e.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <Link
          to="/"
          className="p-1 -ml-1 text-white hover:text-zinc-300"
          aria-label="Back"
        >
          <span className="text-2xl">←</span>
        </Link>
        <h1 className="text-lg font-semibold text-white">Create new post</h1>
        <button
          type="button"
          onClick={handleShare}
          disabled={submitting}
          className="text-violet-400 font-semibold hover:text-violet-300 disabled:opacity-50"
        >
          {submitting ? 'Sharing…' : 'Share'}
        </button>
      </header>

      {/* Media preview area */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="max-h-[50vh] w-full bg-zinc-900 border-b border-zinc-800 flex flex-col">
          <div className="flex-1 flex items-center justify-center overflow-hidden">
            {files.length ? (
              <div className="w-full h-full flex">
                <img
                  src={URL.createObjectURL(files[activeIndex] || files[0])}
                  alt={mediaAltTexts[activeIndex] || 'Selected media'}
                  className="w-full h-full object-cover transition-transform"
                  style={{
                    transform: `scale(${mediaZoom[activeIndex] || 1}) rotate(${
                      mediaRotation[activeIndex] || 0
                    }deg)`,
                    filter: (() => {
                      const adj = mediaAdjustments[activeIndex] || {
                        brightness: 0,
                        contrast: 0,
                        saturation: 0,
                        warmth: 0,
                        fade: 0,
                        highlights: 0,
                        shadows: 0,
                        vignette: 0,
                      };
                      const base =
                        mediaFilter[activeIndex] === 'mono'
                          ? 'grayscale(1)'
                          : mediaFilter[activeIndex] === 'vivid'
                          ? 'contrast(1.1) saturate(1.15)'
                          : mediaFilter[activeIndex] === 'warm'
                          ? 'saturate(1.05)'
                          : 'none';
                      return `${base} brightness(${1 + adj.brightness / 100}) contrast(${
                        1 + adj.contrast / 100
                      }) saturate(${1 + adj.saturation / 100})`;
                    })(),
                  }}
                />
              </div>
            ) : (
              <div className="text-center text-zinc-500 w-full">
                <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-2">
                  <span className="text-3xl">＋</span>
                </div>
                <p className="text-sm">Tap below to add images or videos</p>
                <p className="text-xs mt-1">JPEG, PNG, GIF, MP4, WebM</p>
              </div>
            )}
          </div>
          <div className="border-t border-zinc-800 px-3 py-2 flex items-center gap-2 overflow-x-auto">
            <label className="px-3 py-1 rounded-full bg-zinc-800 text-xs cursor-pointer whitespace-nowrap">
              Add media
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  const list = Array.from(e.target.files || []);
                  if (!list.length) return;
                  setFiles((prev) => {
                    const next = [...prev, ...list];
                    setMediaAltTexts((prevAlt) => [
                      ...prevAlt,
                      ...list.map(() => ''),
                    ]);
                    setMediaZoom((prevZoom) => [
                      ...prevZoom,
                      ...list.map(() => 1),
                    ]);
                    setMediaRotation((prevRot) => [
                      ...prevRot,
                      ...list.map(() => 0),
                    ]);
                    setMediaFilter((prevFilter) => [
                      ...prevFilter,
                      ...list.map(() => 'original'),
                    ]);
                    setMediaAdjustments((prevAdj) => [
                      ...prevAdj,
                      ...list.map(() => ({
                        brightness: 0,
                        contrast: 0,
                        saturation: 0,
                        warmth: 0,
                        fade: 0,
                        highlights: 0,
                        shadows: 0,
                        vignette: 0,
                      })),
                    ]);
                    setVideoMute((prev) => [...prev, ...list.map(() => false)]);
                    setVideoSpeed((prev) => [...prev, ...list.map(() => 1)]);
                    setVideoTrim((prev) => [...prev, ...list.map(() => ({ startSec: 0 }))]);
                    setVideoCoverSec((prev) => [...prev, ...list.map(() => 0)]);
                    return next;
                  });
                }}
              />
            </label>
            {files.map((f, idx) => (
              <button
                key={`${f.name}-${idx}`}
                type="button"
                onClick={() => setActiveIndex(idx)}
                className={`relative w-14 h-14 flex-shrink-0 ${
                  idx === activeIndex ? 'ring-2 ring-violet-400 rounded-md' : ''
                }`}
              >
                <img
                  src={URL.createObjectURL(f)}
                  alt={f.name}
                  className="w-full h-full object-cover rounded-md border border-zinc-700"
                />
                <div className="absolute -top-1 -right-1 flex gap-1">
                  {idx > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        setFiles((prev) => {
                          const copy = [...prev];
                          const tmp = copy[idx - 1];
                          copy[idx - 1] = copy[idx];
                          copy[idx] = tmp;
                          setMediaAltTexts((prevAlt) => {
                            const altCopy = [...prevAlt];
                            const aTmp = altCopy[idx - 1];
                            altCopy[idx - 1] = altCopy[idx];
                            altCopy[idx] = aTmp;
                            return altCopy;
                          });
                          setMediaZoom((prevZoom) => {
                            const zoomCopy = [...prevZoom];
                            const zTmp = zoomCopy[idx - 1];
                            zoomCopy[idx - 1] = zoomCopy[idx];
                            zoomCopy[idx] = zTmp;
                            return zoomCopy;
                          });
                          setMediaRotation((prevRot) => {
                            const rotCopy = [...prevRot];
                            const rTmp = rotCopy[idx - 1];
                            rotCopy[idx - 1] = rotCopy[idx];
                            rotCopy[idx] = rTmp;
                            return rotCopy;
                          });
                          setMediaFilter((prevFilter) => {
                            const filtCopy = [...prevFilter];
                            const fTmp = filtCopy[idx - 1];
                            filtCopy[idx - 1] = filtCopy[idx];
                            filtCopy[idx] = fTmp;
                            return filtCopy;
                          });
                          setMediaAdjustments((prevAdj) => {
                            const adjCopy = [...prevAdj];
                            const aTmp = adjCopy[idx - 1];
                            adjCopy[idx - 1] = adjCopy[idx];
                            adjCopy[idx] = aTmp;
                            return adjCopy;
                          });
                          setVideoMute((prev) => {
                            const c = [...prev];
                            const t = c[idx - 1];
                            c[idx - 1] = c[idx];
                            c[idx] = t;
                            return c;
                          });
                          setVideoSpeed((prev) => {
                            const c = [...prev];
                            const t = c[idx - 1];
                            c[idx - 1] = c[idx];
                            c[idx] = t;
                            return c;
                          });
                          setVideoTrim((prev) => {
                            const c = [...prev];
                            const t = c[idx - 1];
                            c[idx - 1] = c[idx];
                            c[idx] = t;
                            return c;
                          });
                          setVideoCoverSec((prev) => {
                            const c = [...prev];
                            const t = c[idx - 1];
                            c[idx - 1] = c[idx];
                            c[idx] = t;
                            return c;
                          });
                          return copy;
                        })
                      }
                      className="w-4 h-4 rounded-full bg-black/70 text-[10px] flex items-center justify-center"
                      aria-label="Move left"
                    >
                      ‹
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      setFiles((prev) => {
                        const next = prev.filter((_, i) => i !== idx);
                        setMediaAltTexts((prevAlt) =>
                          prevAlt.filter((_, i) => i !== idx),
                        );
                        setMediaZoom((prevZoom) =>
                          prevZoom.filter((_, i) => i !== idx),
                        );
                        setMediaRotation((prevRot) =>
                          prevRot.filter((_, i) => i !== idx),
                        );
                        setMediaFilter((prevFilter) =>
                          prevFilter.filter((_, i) => i !== idx),
                        );
                        setMediaAdjustments((prevAdj) =>
                          prevAdj.filter((_, i) => i !== idx),
                        );
                        setVideoMute((prev) => prev.filter((_, i) => i !== idx));
                        setVideoSpeed((prev) => prev.filter((_, i) => i !== idx));
                        setVideoTrim((prev) => prev.filter((_, i) => i !== idx));
                        setVideoCoverSec((prev) => prev.filter((_, i) => i !== idx));
                        return next;
                      })
                    }
                    className="w-4 h-4 rounded-full bg-black/70 text-[10px] flex items-center justify-center"
                    aria-label="Remove"
                  >
                    ✕
                  </button>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* User + caption */}
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center text-white font-semibold">
              {(displayName || 'U')[0].toUpperCase()}
            </div>
            <span className="text-white font-medium">{displayName}</span>
          </div>
          <textarea
            value={caption}
            onChange={handleCaptionChange}
            placeholder="Write a caption..."
            rows={3}
            className="w-full px-0 py-2 bg-transparent text-white placeholder-zinc-500 focus:outline-none resize-none"
          />
          {showHashtags && hashtagSuggestions.length > 0 && (
            <div className="mt-1 bg-zinc-900 border border-zinc-800 rounded-lg max-h-32 overflow-auto text-sm">
              {hashtagSuggestions.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => insertHashtag(tag)}
                  className="w-full text-left px-3 py-1.5 hover:bg-zinc-800 text-zinc-200"
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
          {showMentions && mentionSuggestions.length > 0 && (
            <div className="mt-1 bg-zinc-900 border border-zinc-800 rounded-lg max-h-40 overflow-auto text-sm">
              {mentionSuggestions.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => insertMention(u)}
                  className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-zinc-800 text-zinc-200"
                >
                  <span>
                    @{u.username}
                    {u.displayName ? (
                      <span className="text-zinc-500 text-xs ml-1">· {u.displayName}</span>
                    ) : null}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Options */}
          <div className="space-y-2 pt-2 border-t border-zinc-800">
            <button
              type="button"
              className="w-full flex items-center gap-3 py-2.5 text-zinc-400 hover:text-white transition-colors"
            >
              <MapPin className="w-5 h-5" />
              <span>{location ? location : 'Add location'}</span>
            </button>
            <input
              type="text"
              value={locationQuery}
              onChange={(e) => {
                setLocationQuery(e.target.value);
                setShowLocationResults(true);
              }}
              placeholder="Search for a place"
              className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white placeholder-zinc-500"
            />
            {recentLocations.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {recentLocations.map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => {
                      setLocation(loc);
                      setPlaceId(null);
                      setLocationQuery(loc);
                    }}
                    className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 hover:bg-zinc-800"
                  >
                    {loc}
                  </button>
                ))}
              </div>
            )}
            {showLocationResults && locationSuggestions.length > 0 && (
              <div className="mt-1 bg-zinc-900 border border-zinc-800 rounded-lg max-h-40 overflow-auto text-sm">
                {locationSuggestions.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setLocation(p.name);
                      setPlaceId(p.id);
                      setLocationQuery(p.name);
                      setShowLocationResults(false);
                      rememberLocation(p.name);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-zinc-800 text-zinc-200"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            )}
            <button
              type="button"
              className="w-full flex items-center gap-3 py-2.5 text-zinc-400 hover:text-white transition-colors"
            >
              <Users className="w-5 h-5" />
              <span>Tag people</span>
            </button>
            <button
              type="button"
              className="w-full flex items-center gap-3 py-2.5 text-zinc-400 hover:text-white transition-colors"
            >
              <Settings className="w-5 h-5" />
              <span>Advanced settings</span>
            </button>
          </div>

          {/* Basic advanced settings */}
          <div className="space-y-2 pt-2 border-t border-zinc-800">
            <div className="flex gap-2 mb-1 text-[11px] text-zinc-400">
              <span className="text-zinc-300">Presets:</span>
              <button
                type="button"
                onClick={() => {
                  setPrivacy('PUBLIC');
                  setAllowComments(true);
                  setHideLikeCount(false);
                  setScreenshotProtection(false);
                }}
                className="px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-700"
              >
                Public · comments on
              </button>
              <button
                type="button"
                onClick={() => {
                  setPrivacy('FOLLOWERS_ONLY');
                  setAllowComments(true);
                  setHideLikeCount(true);
                  setScreenshotProtection(false);
                }}
                className="px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-700"
              >
                Followers · hide likes
              </button>
              <button
                type="button"
                onClick={() => {
                  setPrivacy('ONLY_ME');
                  setAllowComments(false);
                  setHideLikeCount(true);
                  setScreenshotProtection(true);
                }}
                className="px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-700"
              >
                Private draft
              </button>
            </div>
            <label className="flex items-center justify-between gap-3 text-sm text-zinc-300">
              <span>Allow comments</span>
              <input
                type="checkbox"
                checked={allowComments}
                onChange={(e) => setAllowComments(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-600 bg-black"
              />
            </label>
            <label className="flex items-center justify-between gap-3 text-sm text-zinc-300">
              <span>Hide like count</span>
              <input
                type="checkbox"
                checked={hideLikeCount}
                onChange={(e) => setHideLikeCount(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-600 bg-black"
              />
            </label>
            {files.length > 0 && (
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">
                    Alt text for image {activeIndex + 1} of {files.length}
                  </label>
                  <input
                    type="text"
                    value={mediaAltTexts[activeIndex] || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setAltText(value);
                      setMediaAltTexts((prev) => {
                        const next = [...prev];
                        next[activeIndex] = value;
                        return next;
                      });
                    }}
                    placeholder="Describe this image for visually impaired people"
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white placeholder-zinc-500"
                  />
                </div>
                {files[activeIndex]?.type?.startsWith('video/') && (
                  <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-3 space-y-2">
                    <span className="text-xs text-zinc-400 font-medium">Video options</span>
                    <label className="flex items-center gap-2 text-sm text-zinc-300">
                      <input
                        type="checkbox"
                        checked={videoMute[activeIndex] ?? false}
                        onChange={(e) => {
                          setVideoMute((prev) => {
                            const next = [...prev];
                            next[activeIndex] = e.target.checked;
                            return next;
                          });
                        }}
                        className="w-4 h-4 rounded border-zinc-600 bg-black"
                      />
                      Mute audio
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500 w-20">Speed</span>
                      <select
                        value={videoSpeed[activeIndex] ?? 1}
                        onChange={(e) => {
                          const v = Number(e.target.value) || 1;
                          setVideoSpeed((prev) => {
                            const next = [...prev];
                            next[activeIndex] = v;
                            return next;
                          });
                        }}
                        className="px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm"
                      >
                        <option value={0.5}>0.5x</option>
                        <option value={1}>1x</option>
                        <option value={1.5}>1.5x</option>
                        <option value={2}>2x</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-zinc-500 block mb-0.5">Trim start (sec)</label>
                        <input
                          type="number"
                          min={0}
                          step={0.5}
                          value={videoTrim[activeIndex]?.startSec ?? 0}
                          onChange={(e) => {
                            const v = Math.max(0, Number(e.target.value) || 0);
                            setVideoTrim((prev) => {
                              const next = [...(prev || [])];
                              next[activeIndex] = { ...(next[activeIndex] ?? { startSec: 0 }), startSec: v };
                              return next;
                            });
                          }}
                          className="w-full px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-zinc-200"
                        />
                      </div>
                      <div>
                        <label className="text-zinc-500 block mb-0.5">Trim end (sec)</label>
                        <input
                          type="number"
                          min={0}
                          step={0.5}
                          value={videoTrim[activeIndex]?.endSec ?? ''}
                          placeholder="Full"
                          onChange={(e) => {
                            const raw = e.target.value;
                            const v = raw === '' ? undefined : Math.max(0, Number(raw) || 0);
                            setVideoTrim((prev) => {
                              const next = [...(prev || [])];
                              next[activeIndex] = { ...(next[activeIndex] ?? { startSec: 0 }), endSec: v };
                              return next;
                            });
                          }}
                          className="w-full px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-zinc-200"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-zinc-500 block mb-0.5 text-xs">Cover frame (time in sec)</label>
                      <input
                        type="number"
                        min={0}
                        step={0.5}
                        value={videoCoverSec[activeIndex] ?? 0}
                        onChange={(e) => {
                          const v = Math.max(0, Number(e.target.value) || 0);
                          setVideoCoverSec((prev) => {
                            const next = [...prev];
                            next[activeIndex] = v;
                            return next;
                          });
                        }}
                        placeholder="0 = first frame"
                        className="w-full px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm"
                      />
                    </div>
                  </div>
                )}
                <div className="space-y-1">
                  <label className="block text-xs text-zinc-500">
                    Basic photo adjustments (preview only)
                  </label>
                  <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                    <span className="w-16">Zoom</span>
                    <input
                      type="range"
                      min={100}
                      max={200}
                      value={Math.round((mediaZoom[activeIndex] || 1) * 100)}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 100;
                        setMediaZoom((prev) => {
                          const next = [...prev];
                          next[activeIndex] = val / 100;
                          return next;
                        });
                      }}
                      className="flex-1"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                    <span className="w-16">Rotate</span>
                    <input
                      type="range"
                      min={-15}
                      max={15}
                      value={mediaRotation[activeIndex] || 0}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0;
                        setMediaRotation((prev) => {
                          const next = [...prev];
                          next[activeIndex] = val;
                          return next;
                        });
                      }}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            )}
            <div className="pt-2 border-t border-zinc-800 space-y-2">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Audience</label>
                <select
                  value={privacy}
                  onChange={(e) =>
                    setPrivacy(
                      e.target.value as
                        | 'PUBLIC'
                        | 'FOLLOWERS_ONLY'
                        | 'CLOSE_FRIENDS_ONLY'
                        | 'ONLY_ME',
                    )
                  }
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white"
                >
                  <option value="PUBLIC">Public</option>
                  <option value="FOLLOWERS_ONLY">Followers only</option>
                  <option value="CLOSE_FRIENDS_ONLY">Close Friends only</option>
                  <option value="ONLY_ME">Only me</option>
                </select>
              </div>
              <label className="flex items-center justify-between gap-3 text-sm text-zinc-300">
                <span>Screenshot & download protection</span>
                <input
                  type="checkbox"
                  checked={screenshotProtection}
                  onChange={(e) => setScreenshotProtection(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-600 bg-black"
                />
              </label>
            </div>
            {cap?.canSubscriptions && (
              <div className="pt-2 border-t border-zinc-800 space-y-2">
                <label className="flex items-center justify-between gap-3 text-sm text-zinc-300">
                  <span>Subscribers only</span>
                  <input
                    type="checkbox"
                    checked={isSubscriberOnly}
                    onChange={(e) => setIsSubscriberOnly(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-600 bg-black"
                  />
                </label>
                {isSubscriberOnly && creatorTiers.length > 0 && (
                  <div className="pl-2">
                    <p className="text-xs text-zinc-500 mb-1">Limit to tiers (leave empty = any subscriber)</p>
                    <div className="flex flex-wrap gap-2">
                      {creatorTiers.map((t) => (
                        <label key={t.key} className="flex items-center gap-1.5 text-sm text-zinc-300">
                          <input
                            type="checkbox"
                            checked={subscriberTierKeys.includes(t.key)}
                            onChange={(e) => {
                              if (e.target.checked) setSubscriberTierKeys((prev) => [...prev, t.key]);
                              else setSubscriberTierKeys((prev) => prev.filter((k) => k !== t.key));
                            }}
                            className="w-4 h-4 rounded border-zinc-600 bg-black"
                          />
                          {t.name || t.key}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="pt-2 border-t border-zinc-800 space-y-2">
              <p className="text-xs text-zinc-500">Paid partnership (branded content)</p>
              <input
                type="text"
                value={brandedContentBrandId}
                onChange={(e) => setBrandedContentBrandId(e.target.value)}
                placeholder="Brand account ID (optional)"
                className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white placeholder-zinc-500"
              />
              {brandedContentBrandId.trim() && (
                <label className="flex items-center justify-between gap-3 text-sm text-zinc-300">
                  <span>Show &quot;Paid partnership&quot; disclosure</span>
                  <input
                    type="checkbox"
                    checked={brandedContentDisclosure}
                    onChange={(e) => setBrandedContentDisclosure(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-600 bg-black"
                  />
                </label>
              )}
            </div>
          </div>

          {cap.canSchedulePosts && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowScheduling(!showScheduling)}
                className="text-sm text-violet-400"
              >
                {showScheduling ? 'Hide scheduling' : 'Schedule post'}
              </button>
              {showScheduling && (
                <div className="mt-2">
                  <input
                    type="datetime-local"
                    value={scheduledFor}
                    onChange={(e) => setScheduledFor(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {error && (
        <div className="px-4 py-2 bg-red-900/40 text-red-300 text-sm border-t border-red-700">
          {error}
        </div>
      )}
    </div>
  );
}
