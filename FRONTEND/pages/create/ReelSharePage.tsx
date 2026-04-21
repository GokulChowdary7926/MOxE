import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Hash, Play, List, MessageCircle, UserPlus, MapPin, Sparkles, Eye, Share2, MoreHorizontal } from 'lucide-react';
import { ThemedView, ThemedText } from '../../components/ui/Themed';
import { MobileShell } from '../../components/layout/MobileShell';
import { useCurrentAccount } from '../../hooks/useAccountCapabilities';
import toast from 'react-hot-toast';
import { getApiBase, getToken, getUploadUrl } from '../../services/api';
import { messageFromUnknown, userFacingApiError, userFacingUploadError } from '../../utils/userFacingErrors';

/**
 * New reel page (after edit) – share screen. Same for all accounts.
 * Back, "New reel". Preview + Edit cover. Caption. Hashtags, Link reel, Poll, Prompt.
 * Tag people, Add location, Add AI label, Audience, Also share on, More options. Save draft, Share.
 */
export default function ReelSharePage() {
  const navigate = useNavigate();
  const location = useLocation() as any;
  const currentAccount = useCurrentAccount() as { username?: string } | null;
  const shareOnLabel = currentAccount?.username ? `@${currentAccount.username}` : 'Not connected';
  const file = location.state?.file as File | undefined;
  const [caption, setCaption] = useState('');
  const [aiLabel, setAiLabel] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!file) {
    navigate('/create/reel');
    return null;
  }

  const previewUrl = URL.createObjectURL(file);
  const isVideo = file.type.startsWith('video/');

  function saveDraft() {
    toast.success('Reel draft saved');
    navigate('/create');
  }

  async function shareReel() {
    setError(null);
    if (!file) {
      setError('Please select a reel file first.');
      return;
    }
    const token = getToken();
    if (!token) {
      navigate('/login');
      return;
    }
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const uploadRes = await fetch(getUploadUrl(), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!uploadRes.ok) {
        throw new Error(await userFacingUploadError(uploadRes, 'Could not upload your reel.'));
      }
      const uploadData = (await uploadRes.json().catch(() => ({}))) as { url?: string };
      if (!uploadData.url) throw new Error('Could not upload your reel.');

      const res = await fetch(`${getApiBase()}/reels`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          media: [{ url: uploadData.url }],
          caption: caption.trim() || undefined,
          privacy: 'PUBLIC',
        }),
      });
      if (!res.ok) {
        throw new Error(await userFacingApiError(res, 'Could not share your reel.'));
      }
      toast.success('Reel shared');
      navigate('/reels');
    } catch (e: unknown) {
      setError(messageFromUnknown(e, 'Something went wrong while sharing your reel.'));
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
          <span className="flex-1 text-white font-semibold text-base text-center">New reel</span>
          <button type="button" onClick={shareReel} disabled={submitting} className="text-[#0095f6] font-semibold text-sm disabled:opacity-50">
            {submitting ? 'Posting…' : 'Post'}
          </button>
        </header>

        <div className="flex-1 overflow-auto pb-24">
          {/* Preview + Edit cover */}
          <div className="p-4">
            <div className="relative aspect-[9/16] max-h-[200px] w-full max-w-[120px] mx-auto rounded-lg overflow-hidden bg-[#262626]">
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

          {/* Caption */}
          <div className="px-4 mb-3">
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a caption..."
              className="w-full px-0 py-2 bg-transparent text-white placeholder:text-[#737373] text-sm border-none outline-none"
            />
          </div>

          {/* Quick actions */}
          <div className="flex gap-4 px-4 mb-4">
            {[
              { icon: Hash, label: 'Hashtags' },
              { icon: Play, label: 'Link a reel' },
              { icon: List, label: 'Poll' },
              { icon: MessageCircle, label: 'Prompt' },
            ].map(({ icon: Icon, label }) => (
              <button key={label} type="button" className="flex flex-col items-center gap-1 text-[#a8a8a8]">
                <Icon className="w-5 h-5" />
                <span className="text-[10px]">{label}</span>
              </button>
            ))}
          </div>

          {/* Tag people */}
          <button
            type="button"
            onClick={() => navigate('/create/reel/tag')}
            className="w-full flex items-center gap-3 px-4 py-3 border-t border-b border-[#262626] text-white"
          >
            <UserPlus className="w-5 h-5 text-[#a8a8a8]" />
            <span className="flex-1 text-left">Tag people</span>
            <span className="text-[#737373]">›</span>
          </button>

          {/* Add location */}
          <button
            type="button"
            onClick={() => navigate('/create/reel/location')}
            className="w-full flex items-center gap-3 px-4 py-3 border-b border-[#262626] text-white"
          >
            <MapPin className="w-5 h-5 text-[#a8a8a8]" />
            <div className="flex-1 text-left">
              <span className="block">Add location</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {['Latteri, Tamil Nadu, India', 'Vellore', 'Chennai, India'].map((loc) => (
                  <span key={loc} className="px-2 py-0.5 rounded-full bg-[#262626] text-[#a8a8a8] text-xs">
                    {loc}
                  </span>
                ))}
              </div>
              <p className="text-[#737373] text-xs mt-1">
                People that you share this content with can see the location that you tag and view your content on the map.
              </p>
            </div>
            <span className="text-[#737373]">›</span>
          </button>

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
            onClick={() => navigate('/create/reel/audience')}
            className="w-full flex items-center gap-3 px-4 py-3 border-b border-[#262626] text-white"
          >
            <Eye className="w-5 h-5 text-[#a8a8a8]" />
            <span className="flex-1 text-left">Audience</span>
            <span className="text-[#a8a8a8] text-sm">Followers ›</span>
          </button>

          {/* Also share on */}
          <button
            type="button"
            onClick={() => navigate('/create/reel/also-share')}
            className="w-full flex items-center gap-3 px-4 py-3 border-b border-[#262626] text-white"
          >
            <Share2 className="w-5 h-5 text-[#a8a8a8]" />
            <span className="flex-1 text-left">Also share on...</span>
            <span className="text-[#a8a8a8] text-sm">{shareOnLabel} ›</span>
          </button>

          {/* More options */}
          <button
            type="button"
            onClick={() => navigate('/create/reel/more')}
            className="w-full flex items-center gap-3 px-4 py-3 border-b border-[#262626] text-white"
          >
            <MoreHorizontal className="w-5 h-5 text-[#a8a8a8]" />
            <span className="flex-1 text-left">More options</span>
            <span className="text-[#737373]">›</span>
          </button>
        </div>

        {/* Bottom actions */}
        {error && (
          <div className="px-4 py-2 bg-red-900/30 text-red-300 text-sm border-t border-[#262626]">
            {error}
          </div>
        )}

        <div className="fixed bottom-0 left-0 right-0 max-w-[428px] mx-auto flex gap-3 p-4 border-t border-[#262626] bg-black safe-area-pb">
          <button
            type="button"
            onClick={saveDraft}
            disabled={submitting}
            className="flex-1 py-3 rounded-lg bg-[#262626] text-white font-semibold text-sm"
            data-testid="reel-save-draft"
          >
            Save draft
          </button>
          <button
            type="button"
            onClick={shareReel}
            disabled={submitting}
            className="flex-1 py-3 rounded-lg bg-[#0095f6] text-white font-semibold text-sm disabled:opacity-50"
            data-testid="reel-share-post-footer"
          >
            {submitting ? 'Posting…' : 'Post'}
          </button>
        </div>
      </MobileShell>
    </ThemedView>
  );
}
