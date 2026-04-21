import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Hash, List, MessageCircle, Music, UserPlus, MapPin, Sparkles, Eye, Share2, MoreHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import { ThemedView } from '../../components/ui/Themed';
import { MobileShell } from '../../components/layout/MobileShell';
import { getApiBase, getToken, getUploadUrl } from '../../services/api';
import { messageFromUnknown, userFacingApiError, userFacingUploadError } from '../../utils/userFacingErrors';
import type { SpotifyTrack } from '../../services/spotifyApi';
import { useCurrentAccount, useAccountCapabilities } from '../../hooks/useAccountCapabilities';

/**
 * Post preview/share page – caption, alt text, location, more options (comments off, hide like count),
 * optional product tags (Business), Share. E2E: passes altText, location, allowComments, hideLikeCount to API.
 */
export default function PostSharePage() {
  const navigate = useNavigate();
  const location = useLocation() as {
    state?: { files?: File[]; location?: string; selectedLocation?: string; mentionedUserIds?: string[]; prefillMusic?: SpotifyTrack };
  };
  const account = useCurrentAccount() as { accountType?: string } | null;
  const isBusiness = account?.accountType === 'BUSINESS';
  const files = location.state?.files as File[] | undefined;
  const locationFromState = location.state?.location ?? location.state?.selectedLocation ?? '';
  const [caption, setCaption] = useState('');
  const [altText, setAltText] = useState('');
  const [locationName, setLocationName] = useState(locationFromState);
  const [allowComments, setAllowComments] = useState(true);
  const [hideLikeCount, setHideLikeCount] = useState(false);
  const [screenshotProtection, setScreenshotProtection] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [aiLabel, setAiLabel] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<{ id: string; name: string; price?: number; images?: string[] }[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);
  const [videoMute, setVideoMute] = useState(false);
  const [videoSpeed, setVideoSpeed] = useState(1);
  const [videoTrimStart, setVideoTrimStart] = useState(0);
  const [videoTrimEnd, setVideoTrimEnd] = useState<number | ''>('');
  const [videoCoverSec, setVideoCoverSec] = useState(0);
  const [scheduledFor, setScheduledFor] = useState('');
  const [selectedMusic, setSelectedMusic] = useState<SpotifyTrack | null>(null);
  const cap = useAccountCapabilities();

  useEffect(() => {
    const pm = location.state?.prefillMusic;
    if (pm?.id) setSelectedMusic(pm);
  }, [location.state?.prefillMusic]);

  useEffect(() => {
    setLocationName((prev) => locationFromState || prev);
  }, [locationFromState]);

  useEffect(() => {
    const fromTag = (location.state as { mentionedUserIds?: string[] })?.mentionedUserIds;
    if (Array.isArray(fromTag) && fromTag.length >= 0) setMentionedUserIds(fromTag);
  }, [location.state]);

  useEffect(() => {
    if (!isBusiness || !getToken()) return;
    fetch(`${getApiBase()}/commerce/products`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setProducts(Array.isArray(data) ? data : data?.products ?? []))
      .catch(() => {});
  }, [isBusiness]);

  if (!files?.length) {
    navigate('/create/post');
    return null;
  }

  const first = files[0] ?? null;
  if (!first) {
    navigate('/create/post');
    return null;
  }
  const previewUrl = URL.createObjectURL(first);
  const isVideo = first.type.startsWith('video/');

  const toggleProduct = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 5 ? [...prev, id] : prev
    );
  };

  async function handleShare() {
    setError(null);
    const token = getToken();
    if (!token) {
      navigate('/login');
      return;
    }
    setSubmitting(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of files ?? []) {
        const form = new FormData();
        form.append('file', file);
        const res = await fetch(getUploadUrl(), {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        });
        if (!res.ok) {
          throw new Error(await userFacingUploadError(res, 'Could not upload your media.'));
        }
        const data = (await res.json().catch(() => ({}))) as { url?: string };
        if (!data.url) throw new Error('Could not upload your media.');
        uploadedUrls.push(data.url);
      }
      const mediaPayload = uploadedUrls.map((url, idx) => {
        const file = files![idx];
        const isVideo = file?.type?.startsWith('video/');
        const item: Record<string, unknown> = { url };
        if (isVideo) {
          const trim = videoTrimStart > 0 || (videoTrimEnd !== '' && Number(videoTrimEnd) > 0)
            ? { startSec: videoTrimStart, endSec: videoTrimEnd === '' ? undefined : Number(videoTrimEnd) }
            : undefined;
          item.edits = {
            mute: videoMute,
            speed: videoSpeed,
            ...(trim && { trim }),
            ...(videoCoverSec > 0 && { coverTimeSec: videoCoverSec }),
          };
        }
        return item;
      });
      let captionOut = caption.trim();
      if (selectedMusic?.id) {
        const line = `🎵 ${selectedMusic.name} — ${selectedMusic.artists}`;
        if (!captionOut.includes(selectedMusic.name)) {
          captionOut = captionOut ? `${captionOut}\n\n${line}` : line;
        }
      }
      const body: Record<string, unknown> = {
        media: mediaPayload,
        caption: captionOut || undefined,
        altText: altText.trim() || undefined,
        location: locationName.trim() || undefined,
        allowComments,
        hideLikeCount,
        screenshotProtection,
      };
      if (cap?.canSchedulePosts && scheduledFor.trim()) {
        body.isScheduled = true;
        body.scheduledFor = scheduledFor.trim();
      }
      if (mentionedUserIds.length > 0) body.mentionedUserIds = mentionedUserIds;
      if (isBusiness && selectedProductIds.length > 0) {
        body.productTags = selectedProductIds.map((productId) => ({ productId, x: 50, y: 50 }));
      }
      const res = await fetch(`${getApiBase()}/posts`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        throw new Error(await userFacingApiError(res, 'Could not publish your post.'));
      }
      navigate('/profile');
    } catch (e: unknown) {
      setError(messageFromUnknown(e, 'Something went wrong.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ThemedView className="min-h-screen flex flex-col bg-black">
      <MobileShell>
        <header className="flex items-center h-12 px-3 border-b border-[#262626] bg-black safe-area-pt">
          <button type="button" onClick={() => navigate(-1)} className="p-2 -m-2 text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="flex-1 text-white font-semibold text-base text-center">New post</span>
          <button
            type="button"
            onClick={handleShare}
            disabled={submitting}
            className="text-[#0095f6] font-semibold text-sm disabled:opacity-50"
          >
            {submitting ? 'Posting…' : 'Post'}
          </button>
        </header>

        <div className="flex-1 overflow-auto pb-24">
          {/* Preview */}
          <div className="p-4">
            <div className="relative aspect-square max-h-[200px] w-full max-w-[120px] mx-auto rounded-lg overflow-hidden bg-[#262626]">
              {isVideo ? (
                <video src={previewUrl} className="w-full h-full object-cover" muted playsInline />
              ) : (
                <img src={previewUrl} alt="" className="w-full h-full object-cover" />
              )}
              <button
                type="button"
                className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-black/70 text-white text-xs font-medium"
              >
                Edit cover
              </button>
            </div>
          </div>

          <div className="px-4 mb-3">
            <input
              type="text"
              data-testid="post-share-caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a caption..."
              className="w-full px-0 py-2 bg-transparent text-white placeholder:text-[#737373] text-sm border-none outline-none"
            />
          </div>

          {/* Accessibility: alt text (E2E) */}
          <div className="px-4 py-3 border-b border-[#262626]">
            <span className="text-white text-sm font-medium block mb-1">Accessibility</span>
            <input
              type="text"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="Write alt text to describe your photo for people with visual impairments"
              className="w-full px-3 py-2 rounded-lg bg-[#262626] text-white placeholder:text-[#737373] text-sm border border-[#363636] outline-none"
            />
          </div>

          <div className="flex gap-4 px-4 mb-4">
            {[
              { icon: Hash, label: 'Hashtags' },
              { icon: List, label: 'Poll' },
              { icon: MessageCircle, label: 'Prompt' },
            ].map(({ icon: Icon, label }) => (
              <button key={label} type="button" className="flex flex-col items-center gap-1 text-[#a8a8a8]">
                <Icon className="w-5 h-5" />
                <span className="text-[10px]">{label}</span>
              </button>
            ))}
          </div>

          {/* Add audio (Music – same as Reels/Story) */}
          <button
            type="button"
            onClick={() =>
              navigate('/create/post/music', {
                state: {
                  files: location.state?.files,
                  location: location.state?.location,
                  selectedLocation: location.state?.selectedLocation,
                  mentionedUserIds,
                  prefillMusic: selectedMusic ?? undefined,
                },
              })
            }
            className="w-full flex items-center gap-3 px-4 py-3 border-t border-b border-[#262626] text-white"
          >
            <Music className="w-5 h-5 text-[#a8a8a8]" />
            <span className="flex-1 text-left">Add audio</span>
            <span className="text-[#737373]">›</span>
          </button>
          {selectedMusic && (
            <div className="px-4 pb-3 flex items-center gap-2">
              <span className="text-xs text-[#a8a8a8] truncate flex-1">
                Audio: {selectedMusic.name} — {selectedMusic.artists}
              </span>
              <button
                type="button"
                className="text-xs text-red-400 shrink-0"
                onClick={() => setSelectedMusic(null)}
              >
                Remove
              </button>
            </div>
          )}

          {/* Tag people – passes state so Tag page can return mentionedUserIds */}
          <button
            type="button"
            onClick={() =>
              navigate('/create/post/tag', {
                state: {
                  files: location.state?.files,
                  mentionedUserIds,
                  prefillMusic: selectedMusic ?? undefined,
                  location: location.state?.location,
                  selectedLocation: location.state?.selectedLocation,
                },
              })
            }
            className="w-full flex items-center gap-3 px-4 py-3 border-b border-[#262626] text-white"
          >
            <UserPlus className="w-5 h-5 text-[#a8a8a8]" />
            <span className="flex-1 text-left">Tag people</span>
            {mentionedUserIds.length > 0 && <span className="text-[#0095f6] text-xs">{mentionedUserIds.length} selected</span>}
            <span className="text-[#737373]">›</span>
          </button>

          {/* Video options (when first file is video) */}
          {isVideo && (
            <div className="px-4 py-3 border-b border-[#262626] space-y-2">
              <span className="text-white text-sm font-medium block">Video options</span>
              <label className="flex items-center gap-2 text-[#a8a8a8] text-sm">
                <input type="checkbox" checked={videoMute} onChange={(e) => setVideoMute(e.target.checked)} className="rounded border-[#363636] bg-[#262626]" />
                Mute audio
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[#a8a8a8] text-sm w-16">Speed</span>
                <select value={videoSpeed} onChange={(e) => setVideoSpeed(Number(e.target.value))} className="px-2 py-1 rounded-lg bg-[#262626] border border-[#363636] text-white text-sm">
                  <option value={0.5}>0.5x</option>
                  <option value={1}>1x</option>
                  <option value={1.5}>1.5x</option>
                  <option value={2}>2x</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <label className="text-[#737373] block mb-0.5 text-xs">Trim start (sec)</label>
                  <input type="number" min={0} step={0.5} value={videoTrimStart} onChange={(e) => setVideoTrimStart(Math.max(0, Number(e.target.value) || 0))} className="w-full px-2 py-1 rounded-lg bg-[#262626] border border-[#363636] text-white text-sm" />
                </div>
                <div>
                  <label className="text-[#737373] block mb-0.5 text-xs">Trim end (sec)</label>
                  <input type="number" min={0} step={0.5} value={videoTrimEnd} onChange={(e) => setVideoTrimEnd(e.target.value === '' ? '' : Math.max(0, Number(e.target.value) || 0))} placeholder="Full" className="w-full px-2 py-1 rounded-lg bg-[#262626] border border-[#363636] text-white text-sm placeholder:text-[#737373]" />
                </div>
              </div>
              <div>
                <label className="text-[#737373] block mb-0.5 text-xs">Cover frame (sec)</label>
                <input type="number" min={0} step={0.5} value={videoCoverSec} onChange={(e) => setVideoCoverSec(Math.max(0, Number(e.target.value) || 0))} className="w-full px-2 py-1 rounded-lg bg-[#262626] border border-[#363636] text-white text-sm" />
              </div>
            </div>
          )}

          {/* Schedule post (when capability allows) */}
          {cap?.canSchedulePosts && (
            <div className="px-4 py-3 border-b border-[#262626]">
              <span className="text-white text-sm font-medium block mb-2">Schedule post</span>
              <input
                type="datetime-local"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#262626] border border-[#363636] text-white text-sm"
              />
              <p className="text-[#737373] text-xs mt-1">Leave empty to publish now.</p>
            </div>
          )}

          {/* Add location (E2E: value bound, can open picker) */}
          <div className="w-full flex items-center gap-3 px-4 py-3 border-b border-[#262626]">
            <MapPin className="w-5 h-5 text-[#a8a8a8] flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="block text-white text-sm font-medium mb-1">Add location</span>
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="Search or enter location"
                className="w-full px-3 py-2 rounded-lg bg-[#262626] text-white placeholder:text-[#737373] text-sm border border-[#363636] outline-none"
              />
              <p className="text-[#737373] text-xs mt-1">
                People can see the location and view your content on the map.
              </p>
            </div>
            <span className="text-[#737373] text-xs">Optional</span>
          </div>

          {/* Tag products (Business only, E2E) */}
          {isBusiness && products.length > 0 && (
            <div className="px-4 py-3 border-b border-[#262626]">
              <span className="text-white text-sm font-medium block mb-2">Tag products (up to 5)</span>
              <div className="flex flex-wrap gap-2">
                {products.slice(0, 20).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleProduct(p.id)}
                    className={`px-3 py-1.5 rounded-full text-sm border ${selectedProductIds.includes(p.id) ? 'bg-[#0095f6] border-[#0095f6] text-white' : 'bg-[#262626] border-[#363636] text-[#a8a8a8]'}`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add AI label */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[#262626]">
            <Sparkles className="w-5 h-5 text-[#a8a8a8] flex-shrink-0" />
            <div className="flex-1">
              <span className="text-white block">Add AI label</span>
              <p className="text-[#737373] text-xs mt-0.5">
                We require you to label certain realistic content that&apos;s made with AI. <span className="text-[#0095f6]">Learn more</span>
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={aiLabel}
              onClick={() => setAiLabel(!aiLabel)}
              className={`w-11 h-6 rounded-full transition-colors ${aiLabel ? 'bg-[#0095f6]' : 'bg-[#363636]'}`}
            >
              <span className={`block w-5 h-5 rounded-full bg-white mt-0.5 transition-transform ${aiLabel ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {/* Audience */}
          <button
            type="button"
            onClick={() => navigate('/create/post/audience')}
            className="w-full flex items-center gap-3 px-4 py-3 border-b border-[#262626] text-white"
          >
            <Eye className="w-5 h-5 text-[#a8a8a8]" />
            <span className="flex-1 text-left">Audience</span>
            <span className="text-[#a8a8a8] text-sm">Followers ›</span>
          </button>

          {/* Also share on */}
          <button
            type="button"
            onClick={() => navigate('/create/post/also-share')}
            className="w-full flex items-center gap-3 px-4 py-3 border-b border-[#262626] text-white"
          >
            <Share2 className="w-5 h-5 text-[#a8a8a8]" />
            <span className="flex-1 text-left">Also share on...</span>
            <span className="text-[#a8a8a8] text-sm">Off ›</span>
          </button>

          {/* More options (E2E: allow comments, hide like count) */}
          <div className="border-b border-[#262626]">
            <button
              type="button"
              onClick={() => setShowMoreOptions((v) => !v)}
              className="w-full flex items-center gap-3 px-4 py-3 text-white"
            >
              <MoreHorizontal className="w-5 h-5 text-[#a8a8a8]" />
              <span className="flex-1 text-left">More options</span>
              {showMoreOptions ? <ChevronUp className="w-5 h-5 text-[#737373]" /> : <ChevronDown className="w-5 h-5 text-[#737373]" />}
            </button>
            {showMoreOptions && (
              <div className="px-4 pb-3 space-y-2">
                <label className="flex items-center justify-between gap-3 py-2 text-white text-sm">
                  <span>Turn off commenting</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={!allowComments}
                    onClick={() => setAllowComments((v) => !v)}
                    className={`w-11 h-6 rounded-full transition-colors ${!allowComments ? 'bg-[#0095f6]' : 'bg-[#363636]'}`}
                  >
                    <span className={`block w-5 h-5 rounded-full bg-white mt-0.5 transition-transform ${!allowComments ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </button>
                </label>
                <label className="flex items-center justify-between gap-3 py-2 text-white text-sm">
                  <span>Hide like count on this post</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={hideLikeCount}
                    onClick={() => setHideLikeCount((v) => !v)}
                    className={`w-11 h-6 rounded-full transition-colors ${hideLikeCount ? 'bg-[#0095f6]' : 'bg-[#363636]'}`}
                  >
                    <span className={`block w-5 h-5 rounded-full bg-white mt-0.5 transition-transform ${hideLikeCount ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </button>
                </label>
                <label className="flex items-center justify-between gap-3 py-2 text-white text-sm">
                  <span>Disable download &amp; screenshots</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={screenshotProtection}
                    onClick={() => setScreenshotProtection((v) => !v)}
                    className={`w-11 h-6 rounded-full transition-colors ${screenshotProtection ? 'bg-[#0095f6]' : 'bg-[#363636]'}`}
                  >
                    <span className={`block w-5 h-5 rounded-full bg-white mt-0.5 transition-transform ${screenshotProtection ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </button>
                </label>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="px-4 py-2 bg-red-900/30 text-red-300 text-sm border-t border-[#262626]">
            {error}
          </div>
        )}

        <div className="fixed bottom-0 left-0 right-0 max-w-[428px] mx-auto p-4 border-t border-[#262626] bg-black safe-area-pb">
          <button
            type="button"
            data-testid="post-share-submit"
            onClick={handleShare}
            disabled={submitting}
            className="w-full py-3 rounded-lg bg-[#0095f6] text-white font-semibold text-sm disabled:opacity-50"
          >
            {submitting ? 'Posting…' : 'Post'}
          </button>
        </div>
      </MobileShell>
    </ThemedView>
  );
}
