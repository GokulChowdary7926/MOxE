import React from 'react';

/**
 * Storefront/shop icon: rectangular store with scalloped awning on top.
 * Clean outline for header and bottom nav (dark/light theme).
 */
export function ShopIcon({ className = 'w-6 h-6', strokeWidth = 2 }: { className?: string; strokeWidth?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {/* Curved awning + store front */}
      <path d="M2 8 Q12 4 22 8 L22 20 L2 20 Z" />
      <path d="M4 8V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1" />
    </svg>
  );
}
