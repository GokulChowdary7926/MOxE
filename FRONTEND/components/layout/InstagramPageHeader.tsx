import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

type InstagramPageHeaderProps = {
  title: React.ReactNode;
  left?: React.ReactNode;
  right?: React.ReactNode;
  backTo?: string;
  /** Use when you want the left button to navigate back in history. */
  onBack?: () => void;
  /** Visual theme (mostly for border/background differences). */
  variant?: 'dark' | 'light';
  className?: string;
};

/**
 * Instagram-style page header (mobile).
 * - Centered title
 * - Left: Back/Cancel
 * - Right: Settings/Post/Custom actions
 */
export function InstagramPageHeader({
  title,
  left,
  right,
  backTo,
  onBack,
  variant = 'dark',
  className = '',
}: InstagramPageHeaderProps) {
  const navigate = useNavigate();

  const bg = variant === 'light' ? 'bg-white border-b border-[#dbdbdb]' : 'bg-black border-b border-[#262626]';
  const text = variant === 'light' ? 'text-black' : 'text-white';

  const resolvedLeft =
    left ??
    (backTo ? (
      <Link to={backTo} className={`p-2 -m-2 ${text}`} aria-label="Back">
        <ChevronLeft className="w-5 h-5" />
      </Link>
    ) : (
      <button
        type="button"
        onClick={() => (onBack ? onBack() : navigate(-1))}
        className={`p-2 -m-2 ${text}`}
        aria-label="Back"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
    ));

  return (
    <header className={`sticky top-0 z-10 flex items-center h-12 px-3 ${bg} safe-area-pt ${className}`}>
      <div className="w-full grid grid-cols-3 items-center">
        <div className="justify-self-start">{resolvedLeft}</div>
        <div className={`justify-self-center font-semibold text-[17px] ${text}`}>{title}</div>
        <div className="justify-self-end">{right ?? <div className="w-10" />}</div>
      </div>
    </header>
  );
}

