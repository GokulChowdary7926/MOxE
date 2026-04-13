import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ThemedView } from '../ui/Themed';

/**
 * MOxE page wrapper: optional back + title bar, consistent content area.
 * Use fullBleed for Home, Reels (no side padding). Default: padded content + pb for bottom nav.
 */
export function PageLayout({
  title,
  backTo,
  right,
  children,
  className = '',
  fullBleed = false,
  noBottomPad = false,
}: {
  title?: string;
  backTo?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  fullBleed?: boolean;
  noBottomPad?: boolean;
}) {
  const hasHeader = title != null || backTo != null || right != null;
  return (
    <ThemedView className={`flex flex-1 flex-col min-h-0 w-full overflow-hidden ${className}`}>
      {hasHeader && (
        <header className="sticky top-0 z-10 shrink-0 relative flex items-center justify-between h-12 px-3 border-b border-[#262626] bg-black safe-area-pt">
          <div className="min-w-[44px] flex justify-start">
            {backTo != null ? (
              <Link
                to={backTo}
                className="flex items-center justify-center w-10 h-10 -ml-1 text-white active:opacity-70"
                aria-label="Back"
              >
                <ChevronLeft className="w-6 h-6" />
              </Link>
            ) : null}
          </div>
          {title != null && (
            <span className="absolute left-1/2 -translate-x-1/2 text-[17px] font-semibold text-white max-w-[50%] truncate">
              {title}
            </span>
          )}
          <div className="min-w-[44px] flex justify-end">{right ?? null}</div>
        </header>
      )}
      <div
        className={`flex-1 min-h-0 overflow-y-auto overflow-x-hidden touch-pan-y ${fullBleed ? '' : 'px-3'} ${noBottomPad ? '' : 'pb-20'}`}
      >
        {children}
      </div>
    </ThemedView>
  );
}

/** Settings-style row: label + optional value + chevron, for use inside a card. */
export function SettingsRow({
  to,
  label,
  value,
  onClick,
  children,
}: {
  to?: string;
  label: string;
  value?: string;
  onClick?: () => void;
  children?: React.ReactNode;
}) {
  const content = (
    <>
      <span className="text-moxe-body font-medium text-moxe-text">{label}</span>
      {(value != null || to != null) && (
        <span className="flex items-center gap-1 text-moxe-textSecondary text-moxe-body">
          {value}
          {children}
          {to != null && <ChevronRight className="w-4 h-4 text-moxe-textSecondary" />}
        </span>
      )}
    </>
  );
  const rowClass =
    'flex items-center justify-between py-3 px-4 border-b border-moxe-border last:border-b-0 active:bg-moxe-surface/80';
  if (to != null) {
    return (
      <Link to={to} className={rowClass}>
        {content}
      </Link>
    );
  }
  if (onClick != null) {
    return (
      <button type="button" onClick={onClick} className={`w-full text-left ${rowClass}`}>
        {content}
      </button>
    );
  }
  return <div className={rowClass}>{content}</div>;
}

/** Section card for settings: title + list of rows. */
export function SettingsSection({
  title,
  children,
  className = '',
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`mb-6 ${className}`}>
      <h2 className="text-[11px] font-semibold text-moxe-textSecondary uppercase tracking-wider mb-2 px-1">
        {title}
      </h2>
      <div className="rounded-xl bg-moxe-surface border border-moxe-border overflow-hidden">
        {children}
      </div>
    </section>
  );
}

/**
 * MOxE settings section with radio options and optional example text (§9.3).
 * Use for notification/preference screens (Posts, stories and comments; Following and followers; etc.).
 */
export function SettingsRadioSection({
  title,
  options,
  value,
  onChange,
  exampleText,
}: {
  title: string;
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
  exampleText?: string;
}) {
  const name = `radio-${title.replace(/\s+/g, '-')}`;
  return (
    <section className="mb-6">
      <h2 className="text-moxe-body font-semibold text-moxe-text mb-2">{title}</h2>
      <div className="space-y-1">
        {options.map((opt) => (
          <label
            key={opt.value}
            className="flex items-center justify-between py-2 active:opacity-80 cursor-pointer"
          >
            <span className="text-moxe-body text-moxe-text">{opt.label}</span>
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              className="sr-only"
            />
            <span className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-moxe-border flex-shrink-0">
              {value === opt.value ? (
                <span className="w-2.5 h-2.5 rounded-full bg-moxe-text" />
              ) : null}
            </span>
          </label>
        ))}
      </div>
      {exampleText && (
        <p className="text-moxe-caption text-moxe-textSecondary mt-1 mb-2">{exampleText}</p>
      )}
    </section>
  );
}

/** Single row with label + toggle (for boolean notification prefs). */
export function SettingsToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-moxe-border last:border-b-0">
      <span className="text-moxe-body font-medium text-moxe-text">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full flex-shrink-0 transition-colors ${
          checked ? 'bg-moxe-primary' : 'bg-moxe-border'
        }`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'left-5' : 'left-0.5'
          }`}
        />
      </button>
    </div>
  );
}
