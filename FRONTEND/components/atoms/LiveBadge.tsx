import React from 'react';

/** Red "LIVE" badge for story/live content */
export function LiveBadge({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center rounded bg-[#ED4956] px-1.5 py-0.5 text-[10px] font-bold uppercase text-white ${className}`}>
      Live
    </span>
  );
}
