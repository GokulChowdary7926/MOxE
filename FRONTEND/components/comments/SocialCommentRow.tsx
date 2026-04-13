import React, { useCallback, useEffect, useState } from 'react';
import { Heart, MessageCircle, MoreHorizontal } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { formatCommentRelativeTime, formatCompactCount, pseudoCommentCount } from './socialCommentUtils';

/** Default outline + label color (matches reference ~#8e8e8e) */
const META_GRAY = 'text-[#8E8E8E]';

export type SocialCommentAccount = {
  id?: string;
  username: string;
  displayName?: string | null;
  profilePhoto?: string | null;
  avatarUrl?: string | null;
};

export type SocialCommentRowProps = {
  commentId: string;
  content: string;
  createdAt: string;
  account: SocialCommentAccount;
  likesCount?: number;
  repliesCount?: number;
  usePseudoCounts?: boolean;
  liked?: boolean;
  /** Server/parent-controlled like; if omitted, row toggles local visual state only. */
  onToggleLike?: () => void;
  /** Focus composer / open reply; if omitted, reply still focuses nothing but stays clickable for a11y. */
  onReply?: () => void;
  onMenu?: () => void;
};

/**
 * Single comment row — MOxE social: white name, #8e8e meta/body tint, #262626 dividers.
 */
export function SocialCommentRow({
  commentId,
  content,
  createdAt,
  account,
  likesCount,
  repliesCount,
  usePseudoCounts = false,
  liked = false,
  onToggleLike,
  onReply,
  onMenu,
}: SocialCommentRowProps) {
  const name = account.displayName?.trim() || account.username || 'User';
  const avatarUri = account.profilePhoto ?? account.avatarUrl ?? null;
  const [localLiked, setLocalLiked] = useState(false);

  useEffect(() => {
    if (onToggleLike) setLocalLiked(!!liked);
  }, [liked, onToggleLike]);

  const displayLiked = onToggleLike ? !!liked : localLiked;

  const likeLabel = usePseudoCounts
    ? pseudoCommentCount(`like-${commentId}`, 5000)
    : formatCompactCount(likesCount ?? 0);
  const replyLabel = usePseudoCounts
    ? pseudoCommentCount(`reply-${commentId}`, 4000)
    : formatCompactCount(repliesCount ?? 0);

  const handleLike = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onToggleLike) onToggleLike();
      else setLocalLiked((v) => !v);
    },
    [onToggleLike],
  );

  const handleReply = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onReply?.();
    },
    [onReply],
  );

  return (
    <article className="py-4 border-b border-[#262626]">
      <div className="flex items-start gap-3">
        <Avatar uri={avatarUri} size={44} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[15px] font-bold text-white leading-tight">{name}</p>
              <p className={`text-[12px] ${META_GRAY} mt-0.5`}>{formatCommentRelativeTime(createdAt)}</p>
            </div>
            {onMenu ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMenu();
                }}
                className="text-[#a8a8a8] p-1 -mr-1 -mt-0.5 rounded-md hover:bg-white/10"
                aria-label="Comment options"
              >
                <MoreHorizontal className="w-5 h-5" strokeWidth={1.5} />
              </button>
            ) : null}
          </div>
          <p className="text-[15px] text-[#e8e8e8] font-normal leading-relaxed mt-2 whitespace-pre-wrap break-words">
            {content}
          </p>
          <div className="flex items-center gap-6 mt-3 text-[13px]">
            <button
              type="button"
              onClick={handleLike}
              className={`inline-flex items-center gap-1.5 rounded-md py-1 -my-1 hover:opacity-80 active:opacity-70 ${META_GRAY}`}
              aria-label={displayLiked ? 'Unlike' : 'Like'}
            >
              <Heart
                className={`w-[18px] h-[18px] shrink-0 ${displayLiked ? 'fill-[#f91880] text-[#f91880]' : 'text-[#8E8E8E]'}`}
                fill={displayLiked ? 'currentColor' : 'none'}
                strokeWidth={1.5}
              />
              <span className={META_GRAY}>{likeLabel}</span>
            </button>
            {onReply ? (
              <button
                type="button"
                onClick={handleReply}
                className={`inline-flex items-center gap-1.5 rounded-md py-1 -my-1 hover:opacity-80 active:opacity-70 ${META_GRAY}`}
                aria-label="Reply"
              >
                <MessageCircle className="w-[18px] h-[18px] shrink-0" strokeWidth={1.5} />
                <span>{replyLabel}</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
