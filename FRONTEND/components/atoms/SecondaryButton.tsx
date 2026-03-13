import React from 'react';

/** Gray outline secondary button */
export function SecondaryButton({
  children,
  onClick,
  disabled,
  className = '',
  type = 'button',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        rounded-lg border px-4 py-2.5 text-sm font-semibold
        border-[#363636] bg-transparent text-white
        disabled:opacity-50 active:bg-white/5
        ${className}
      `}
    >
      {children}
    </button>
  );
}
