import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ThemedView, ThemedText } from '../../components/ui/Themed';
import { MobileShell } from '../../components/layout/MobileShell';

export default function StorySettings() {
  const navigate = useNavigate();
  const [allowReplies, setAllowReplies] = useState<'followers' | 'followBack' | 'off'>('off');
  const [saveToCameraRoll, setSaveToCameraRoll] = useState(false);
  const [saveToArchive, setSaveToArchive] = useState(true);
  const [allowOthersToShare, setAllowOthersToShare] = useState(false);
  const [allowSharingToMessages, setAllowSharingToMessages] = useState(false);
  const [shareToConnectedApp, setShareToConnectedApp] = useState(false);

  return (
    <ThemedView className="min-h-screen flex flex-col bg-black">
      <MobileShell>
        <header className="flex items-center justify-between h-12 px-3 border-b border-[#262626] bg-black safe-area-pt">
          <button type="button" onClick={() => navigate(-1)} className="text-[#0095f6] font-semibold text-sm">
            Done
          </button>
          <span className="text-white font-semibold text-base">Story</span>
          <div className="w-14" />
        </header>

        <div className="flex-1 overflow-auto pb-20">
          {/* Viewing */}
          <section className="py-3">
            <p className="text-white font-bold text-sm px-4 mb-2">Viewing</p>
            <Link
              to="/settings/story/hide-from"
              className="flex flex-col px-4 py-3 border-y border-[#262626]"
            >
              <span className="text-white text-sm font-medium">Hide story from</span>
              <span className="text-[#a8a8a8] text-xs mt-0.5">Hide your story and live videos from specific people.</span>
              <span className="text-white text-sm mt-1">3 people</span>
            </Link>
            <Link
              to="/close-friends"
              className="flex flex-col px-4 py-3 border-b border-[#262626]"
            >
              <span className="text-white text-sm font-medium">Close friends</span>
              <span className="text-[#a8a8a8] text-xs mt-0.5">Share your story only with specific people.</span>
              <span className="text-white text-sm mt-1">13 people</span>
            </Link>
          </section>

          {/* Replying */}
          <section className="py-3">
            <p className="text-white font-bold text-sm px-4 mb-2">Replying</p>
            <div className="px-4 py-3 border-t border-[#262626]">
              <span className="text-white text-sm font-medium block">Allow message replies</span>
              <span className="text-[#a8a8a8] text-xs block mt-0.5">Choose who can reply to your story.</span>
              <div className="mt-2 space-y-2">
                {(['followers', 'followBack', 'off'] as const).map((opt) => (
                  <label key={opt} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="replies"
                      checked={allowReplies === opt}
                      onChange={() => setAllowReplies(opt)}
                      className="w-4 h-4 text-[#0095f6]"
                    />
                    <span className="text-white text-sm">
                      {opt === 'followers' ? 'Your followers' : opt === 'followBack' ? 'Followers you follow back' : 'Off'}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </section>

          {/* Commenting */}
          <section className="py-3">
            <p className="text-white font-bold text-sm px-4 mb-2">Commenting</p>
            <Link
              to="/settings/story/allow-comments"
              className="flex flex-col px-4 py-3 border-y border-[#262626]"
            >
              <span className="text-white text-sm font-medium">Allow comments</span>
              <span className="text-[#a8a8a8] text-xs mt-0.5">Choose who can leave comments on your story.</span>
            </Link>
          </section>

          {/* Saving */}
          <section className="py-3">
            <p className="text-white font-bold text-sm px-4 mb-2">Saving</p>
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#262626]">
              <div>
                <span className="text-white text-sm font-medium block">Save story to Camera Roll</span>
                <span className="text-[#a8a8a8] text-xs block mt-0.5">Automatically save photos and videos to your phone&apos;s camera roll.</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={saveToCameraRoll}
                onClick={() => setSaveToCameraRoll((v) => !v)}
                className={`w-11 h-6 rounded-full flex-shrink-0 ${saveToCameraRoll ? 'bg-[#0095f6]' : 'bg-[#363636]'}`}
              >
                <span className={`block w-5 h-5 rounded-full bg-white shadow mt-0.5 transition-transform ${saveToCameraRoll ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#262626]">
              <div>
                <span className="text-white text-sm font-medium block">Save story to archive</span>
                <span className="text-[#a8a8a8] text-xs block mt-0.5">Automatically save photos and videos to your archive.</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={saveToArchive}
                onClick={() => setSaveToArchive((v) => !v)}
                className={`w-11 h-6 rounded-full flex-shrink-0 ${saveToArchive ? 'bg-[#0095f6]' : 'bg-[#363636]'}`}
              >
                <span className={`block w-5 h-5 rounded-full bg-white shadow mt-0.5 transition-transform ${saveToArchive ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </section>

          {/* Sharing */}
          <section className="py-3">
            <p className="text-white font-bold text-sm px-4 mb-2">Sharing</p>
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#262626]">
              <div>
                <span className="text-white text-sm font-medium block">Allow others to share your story</span>
                <span className="text-[#a8a8a8] text-xs block mt-0.5">Let people you @mention share your story to their story.</span>
              </div>
              <button type="button" role="switch" aria-checked={allowOthersToShare} onClick={() => setAllowOthersToShare((v) => !v)} className={`w-11 h-6 rounded-full flex-shrink-0 ${allowOthersToShare ? 'bg-[#0095f6]' : 'bg-[#363636]'}`}>
                <span className={`block w-5 h-5 rounded-full bg-white shadow mt-0.5 transition-transform ${allowOthersToShare ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#262626]">
              <div>
                <span className="text-white text-sm font-medium block">Allow sharing to messages</span>
                <span className="text-[#a8a8a8] text-xs block mt-0.5">Let your followers share photos and videos from your story in a message.</span>
              </div>
              <button type="button" role="switch" aria-checked={allowSharingToMessages} onClick={() => setAllowSharingToMessages((v) => !v)} className={`w-11 h-6 rounded-full flex-shrink-0 ${allowSharingToMessages ? 'bg-[#0095f6]' : 'bg-[#363636]'}`}>
                <span className={`block w-5 h-5 rounded-full bg-white shadow mt-0.5 transition-transform ${allowSharingToMessages ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#262626]">
              <div>
                <span className="text-white text-sm font-medium block">Cross-post story</span>
                <span className="text-[#a8a8a8] text-xs block mt-0.5">When enabled, mirror this story to a connected app you&apos;ve linked in settings.</span>
              </div>
              <button type="button" role="switch" aria-checked={shareToConnectedApp} onClick={() => setShareToConnectedApp((v) => !v)} className={`w-11 h-6 rounded-full flex-shrink-0 ${shareToConnectedApp ? 'bg-[#0095f6]' : 'bg-[#363636]'}`}>
                <span className={`block w-5 h-5 rounded-full bg-white shadow mt-0.5 transition-transform ${shareToConnectedApp ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </section>
        </div>
      </MobileShell>
    </ThemedView>
  );
}
