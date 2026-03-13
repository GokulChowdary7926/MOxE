import React from 'react';
import { Check } from 'lucide-react';

/** Blue checkmark (Personal/Creator) – optional purple for Job */
export function VerifiedBadge({
  variant = 'blue',
  size = 14,
  className = '',
}: {
  variant?: 'blue' | 'purple';
  size?: number;
  className?: string;
}) {
  const bgClass = variant === 'purple' ? 'bg-[#8A2BE2]' : 'bg-[#0095f6]';
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full flex-shrink-0 ${bgClass} ${className}`}
      style={{ width: size, height: size }}
      aria-label="Verified"
    >
      <Check className="text-white" strokeWidth={3} style={{ width: size * 0.6, height: size * 0.6 }} />
    </span>
  );
}
