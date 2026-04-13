import React from 'react';

/** MOxE primary CTA (social accent) – full width or inline */
export function PrimaryButton({
  children,
  onClick,
  disabled,
  className = '',
  type = 'button',
  fullWidth = true,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit';
  fullWidth?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        rounded-lg bg-[#0095f6] font-semibold text-white text-sm py-3
        ${fullWidth ? 'w-full' : 'px-6'}
        disabled:opacity-50 active:opacity-90
        ${className}
      `}
    >
      {children}
    </button>
  );
}
