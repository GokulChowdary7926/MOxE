import React from 'react';

/** Same semantic API as mobile ThemedView – background #000 */
export function ThemedView({
  className = '',
  style,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) {
  return (
    <div
      className={`bg-moxe-background text-moxe-text ${className}`}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
}

/** Same as mobile ThemedSurface – surface #111, border, rounded */
export function ThemedSurface({
  className = '',
  style,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) {
  return (
    <div
      className={`bg-moxe-surface border border-moxe-border rounded-moxe-md ${className}`}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
}

/** Same as mobile ThemedText – body 14px, optional secondary color */
export function ThemedText({
  className = '',
  secondary,
  style,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  secondary?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <span
      className={
        secondary
          ? `text-moxe-textSecondary text-moxe-body ${className}`
          : `text-moxe-text text-moxe-body ${className}`
      }
      style={style}
      {...props}
    >
      {children}
    </span>
  );
}

/** Same as mobile ThemedButton – primary / secondary / danger */
export function ThemedButton({
  label,
  onClick,
  variant = 'primary',
  className = '',
  disabled,
  type = 'button',
  ...props
}: {
  label: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit';
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const base = 'py-moxe-sm px-moxe-md rounded-moxe-md text-moxe-body font-medium inline-flex items-center justify-center active:opacity-80 disabled:opacity-50';
  const variants = {
    primary: 'bg-moxe-primary text-white',
    secondary: 'bg-moxe-surface text-moxe-text border border-moxe-border',
    danger: 'bg-moxe-danger text-white',
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      {label}
    </button>
  );
}

/** Same as mobile ThemedInput */
export function ThemedInput({
  className = '',
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full bg-moxe-surface border border-moxe-border rounded-moxe-md px-moxe-md py-moxe-sm text-moxe-text text-moxe-body placeholder:text-moxe-textSecondary ${className}`}
      {...props}
    />
  );
}

/** Same as mobile ThemedHeader – title + optional left/right */
export function ThemedHeader({
  title,
  left,
  right,
  className = '',
}: {
  title: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={`flex items-center justify-between py-moxe-sm px-moxe-md border-b border-moxe-border bg-moxe-surface ${className}`}>
      <div className="min-w-[48px] flex justify-start">{left ?? null}</div>
      <span className="text-moxe-title font-semibold text-moxe-text">{title}</span>
      <div className="min-w-[48px] flex justify-end">{right ?? null}</div>
    </header>
  );
}
