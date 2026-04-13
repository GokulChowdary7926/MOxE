import React from 'react';

/** Follow (blue) / Following (gray outline) – MOxE social */
export function FollowButton({
  isFollowing,
  isRequested = false,
  showRequestLabel = false,
  onClick,
  disabled,
  className = '',
}: {
  isFollowing: boolean;
  isRequested?: boolean;
  showRequestLabel?: boolean;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  const isSecondary = isFollowing || isRequested;
  const defaultLabel = showRequestLabel ? 'Request' : 'Follow';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        rounded-lg px-4 py-1.5 text-sm font-semibold
        disabled:opacity-50 active:opacity-80
        ${isSecondary
          ? 'border border-[#363636] bg-transparent text-white'
          : 'bg-[#0095f6] border-0 text-white'
        }
        ${className}
      `}
    >
      {isFollowing ? 'Following' : isRequested ? 'Requested' : defaultLabel}
    </button>
  );
}
