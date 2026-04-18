import React from 'react';
import { Clapperboard, Music2, UserCircle, RefreshCw } from 'lucide-react';

type Props = {
  open: boolean;
  onClose: () => void;
  onGoSettings?: () => void;
};

/**
 * Education modal (reference: “Videos posts are now shared as reels”).
 */
export default function VideoPostsAsReelsModal({ open, onClose, onGoSettings }: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reel-edu-title"
    >
      <div className="w-full max-w-[428px] rounded-t-2xl bg-[#121212] border-t border-moxe-border px-4 pt-2 safe-area-pb">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/25" />
        <div className="flex justify-center py-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737]">
            <Clapperboard className="h-8 w-8 text-white" aria-hidden />
          </div>
        </div>
        <h2 id="reel-edu-title" className="text-center text-lg font-bold text-white">
          Video posts are shared as reels
        </h2>
        <p className="mt-2 text-center text-sm text-moxe-textSecondary">
          Short videos use the reels format so people can discover them, add audio, and remix.
        </p>
        <ul className="mt-5 space-y-4 text-sm text-white/90">
          <li className="flex gap-3">
            <Music2 className="h-5 w-5 shrink-0 text-moxe-primary" aria-hidden />
            <span>Add music, effects, and editing tools.</span>
          </li>
          <li className="flex gap-3">
            <UserCircle className="h-5 w-5 shrink-0 text-moxe-primary" aria-hidden />
            <span>Public accounts can be discovered in reels and reuse your original audio.</span>
          </li>
          <li className="flex gap-3">
            <RefreshCw className="h-5 w-5 shrink-0 text-moxe-primary" aria-hidden />
            <span>Others may remix your reel; you can turn remix off in settings or per reel.</span>
          </li>
        </ul>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-moxe-primary py-3 text-center text-sm font-semibold text-white"
        >
          OK
        </button>
        {onGoSettings ? (
          <button
            type="button"
            onClick={onGoSettings}
            className="mt-3 w-full py-2 text-center text-sm font-semibold text-moxe-primary"
          >
            Go to settings
          </button>
        ) : null}
      </div>
    </div>
  );
}
