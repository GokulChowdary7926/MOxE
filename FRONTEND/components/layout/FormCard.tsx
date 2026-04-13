import React from 'react';

type FormCardProps = {
  title?: string;
  children: React.ReactNode;
  className?: string;
};

/**
 * Card for forms and controls. Mobile-friendly rounded border.
 */
export function FormCard({ title, children, className = '' }: FormCardProps) {
  return (
    <div
      className={`rounded-xl border border-moxe-border bg-moxe-surface p-4 ${className}`}
    >
      {title && (
        <h2 className="text-sm font-semibold text-moxe-text mb-3">
          {title}
        </h2>
      )}
      {children}
    </div>
  );
}

type ListCardProps = {
  empty?: boolean;
  children: React.ReactNode;
  className?: string;
};

/**
 * Card for lists. Use empty=true with a message when list is empty.
 */
export function ListCard({ empty, children, className = '' }: ListCardProps) {
  return (
    <div
      className={`rounded-xl border border-moxe-border bg-moxe-surface p-4 ${
        empty ? 'flex flex-col items-center justify-center min-h-[120px] text-center text-moxe-textSecondary text-sm' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}
