import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export const CREATION_MODES = [
  { id: 'POST' as const, label: 'POST', prefix: '/create/post' },
  { id: 'STORY' as const, label: 'STORY', prefix: '/stories/create' },
  { id: 'REEL' as const, label: 'REEL', prefix: '/create/reel' },
  { id: 'LIVE' as const, label: 'LIVE', prefix: '/live' },
];

export type CreationModeId = (typeof CREATION_MODES)[number]['id'];

/**
 * Floating pill: POST · STORY · REEL · LIVE (reference: IG-style create flow).
 */
export default function CreationModeBar({ className = '' }: { className?: string }) {
  const { pathname } = useLocation();

  const active =
    CREATION_MODES.find((m) => pathname === m.prefix || pathname.startsWith(`${m.prefix}/`))?.id ?? 'POST';

  return (
    <div
      className={`pointer-events-auto flex justify-center px-4 ${className}`}
      role="tablist"
      aria-label="Create mode"
    >
      <div className="flex items-center gap-1 rounded-full border border-moxe-border/80 bg-black/55 px-2 py-1.5 backdrop-blur-md">
        {CREATION_MODES.map(({ id, label, prefix }) => {
          const isActive = active === id;
          return (
            <Link
              key={id}
              to={prefix}
              role="tab"
              aria-selected={isActive}
              className={`min-w-[3.25rem] rounded-full px-2.5 py-1.5 text-center text-[11px] font-semibold tracking-wide transition-colors ${
                isActive ? 'text-white' : 'text-moxe-textSecondary hover:text-white/80'
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/** Same pill as {@link CreationModeBar} but switches local camera mode without navigating (IG-style in-camera). */
export function InCameraModePill({
  value,
  onChange,
  className = '',
}: {
  value: CreationModeId;
  onChange: (m: CreationModeId) => void;
  className?: string;
}) {
  return (
    <div className={`pointer-events-auto flex justify-center px-4 ${className}`} role="tablist" aria-label="Capture mode">
      <div className="flex items-center gap-1 rounded-full border border-moxe-border/80 bg-black/55 px-2 py-1.5 backdrop-blur-md">
        {CREATION_MODES.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={value === id}
            onClick={() => onChange(id)}
            className={`min-w-[3.25rem] rounded-full px-2.5 py-1.5 text-center text-[11px] font-semibold tracking-wide transition-colors ${
              value === id ? 'text-white' : 'text-moxe-textSecondary hover:text-white/80'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
