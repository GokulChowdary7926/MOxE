import React from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from './Avatar';
import { LiveBadge } from '../atoms/LiveBadge';

/**
 * Instagram-style story circle for tray:
 * - Your story: + add state
 * - Unseen: gradient ring (#833AB4 → #E1306C → #FCAF45)
 * - Seen: gray ring
 * - Close Friends: green ring
 * - Live: red LIVE badge below
 */
export function StoryCircle({
  uri,
  label,
  hasStory = true,
  isAdd = false,
  isLive = false,
  closeFriends = false,
  seen = false,
  light = false,
  to,
  onClick,
}: {
  uri?: string | null;
  label: string;
  hasStory?: boolean;
  isAdd?: boolean;
  isLive?: boolean;
  closeFriends?: boolean;
  /** true = gray ring (viewed), false with hasStory = gradient (unviewed) */
  seen?: boolean;
  /** Light theme (e.g. home): light gray ring, dark text */
  light?: boolean;
  to?: string;
  onClick?: () => void;
}) {
  const size = 56;
  const ringWidth = 2;

  const ringClass = (() => {
    if (isAdd || !hasStory) return '';
    if (closeFriends) return 'ring-2 ring-[#00C853]'; // green
    if (seen) return light ? 'ring-2 ring-[#dbdbdb]' : 'ring-2 ring-[#363636]'; // light gray / dark gray
    return ''; // gradient for unviewed
  })();

  const gradientRing = hasStory && !isAdd && !seen && !closeFriends;

  const content = (
    <>
      <div className="relative mb-1 flex flex-col items-center">
        <div
          className={`
            rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden
            ${ringClass}
            ${gradientRing ? 'p-[2px]' : ''}
            ${isAdd ? (light ? 'bg-[#fafafa] border-2 border-dashed border-[#dbdbdb]' : 'bg-[#262626] border-2 border-dashed border-[#363636]') : gradientRing ? '' : light ? 'bg-[#fafafa]' : 'bg-black'}
          `}
          style={{
            width: size + ringWidth * 2,
            height: size + ringWidth * 2,
            ...(gradientRing && {
              background: 'linear-gradient(90deg, #833AB4 0%, #E1306C 50%, #FCAF45 100%)',
            }),
          }}
        >
          {gradientRing ? (
            <div className="rounded-full overflow-hidden bg-black flex items-center justify-center" style={{ width: size, height: size }}>
              <Avatar uri={uri} size={size} className="rounded-full" />
            </div>
          ) : isAdd ? (
            <span className={light ? 'text-[#262626] text-2xl' : 'text-white text-2xl'}>+</span>
          ) : (
            <Avatar uri={uri} size={size} className="rounded-full" />
          )}
        </div>
        {isLive && (
          <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2">
            <LiveBadge />
          </span>
        )}
      </div>
      <span className={`text-[12px] text-center block truncate max-w-[64px] ${light ? 'text-[#262626]' : 'text-white'}`}>
        {label}
      </span>
    </>
  );

  const wrapperClass = 'flex flex-col items-center flex-shrink-0 w-[72px] active:opacity-80';
  if (to) {
    return (
      <Link to={to} className={wrapperClass}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={`${wrapperClass} text-left bg-transparent border-0`}>
      {content}
    </button>
  );
}
