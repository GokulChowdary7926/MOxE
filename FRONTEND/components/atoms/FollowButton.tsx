import React from 'react';

/** Follow (blue) / Following (gray outline) – Instagram style */
export function FollowButton({
  isFollowing,
  onClick,
  disabled,
  className = '',
}: {
  isFollowing: boolean;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        rounded-lg px-4 py-1.5 text-sm font-semibold
        disabled:opacity-50 active:opacity-80
        ${isFollowing
          ? 'border border-[#363636] bg-transparent text-white'
          : 'bg-[#0095f6] border-0 text-white'
        }
        ${className}
      `}
    >
      {isFollowing ? 'Following' : 'Follow'}
    </button>
  );
}
