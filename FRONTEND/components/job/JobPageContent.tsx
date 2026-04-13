import React from 'react';
import { JOB_MOBILE } from './jobMobileStyles';

/**
 * Wrapper for Job tool page content. Mobile-first: single column, touch-friendly,
 * consistent MOxE Job workspace tokens across all Job tools.
 */
export function JobPageContent({
  title,
  description,
  error,
  children,
  className = '',
  variant = 'default',
}: {
  title?: string;
  description?: string;
  error?: string | null;
  children: React.ReactNode;
  className?: string;
  /** MOxE TRACK: dark shell typography + spacing (no extra eyebrow; layout header is MOxE TRACK). */
  variant?: 'default' | 'track';
}) {
  if (variant === 'track') {
    return (
      <div className={`job-page-content min-h-0 w-full min-w-0 ${className}`}>
        {title ? (
          <header className="mb-5 border-b border-outline-variant/15 pb-4">
            <h1 className={JOB_MOBILE.trackSectionHeading}>{title}</h1>
            {description ? <p className={`mt-1 ${JOB_MOBILE.trackBody}`}>{description}</p> : null}
          </header>
        ) : null}
        {error ? (
          <div className={`mb-4 ${JOB_MOBILE.error}`} role="alert">
            {error}
          </div>
        ) : null}
        {children}
      </div>
    );
  }

  return (
    <div className={`job-page-content min-h-0 ${className}`}>
      {title ? <h1 className={JOB_MOBILE.pageTitle}>{title}</h1> : null}
      {description ? <p className={JOB_MOBILE.pageDesc}>{description}</p> : null}
      {error && <div className={`mb-4 ${JOB_MOBILE.error}`}>{error}</div>}
      {children}
    </div>
  );
}

/** Mobile card for Job tools: rounded, bordered, padded. */
export function JobCard({
  children,
  className = '',
  variant = 'default',
  flush = false,
}: {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'track';
  /** No inner padding (e.g. list bodies). */
  flush?: boolean;
}) {
  const base =
    variant === 'track'
      ? 'rounded-[14px] border border-[#2C333A] bg-[#161A1D] overflow-hidden'
      : `${JOB_MOBILE.card} overflow-hidden`;
  const pad = flush ? '' : JOB_MOBILE.cardPadding;
  return (
    <div className={`${base} ${pad} ${className}`}>
      {children}
    </div>
  );
}

/** Section with label (e.g. "Goals", "Pipelines") for stats or lists. */
export function JobSection({
  label,
  children,
  className = '',
  variant = 'default',
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'track';
}) {
  const wrap =
    variant === 'track' ? `${JOB_MOBILE.trackCard} p-4 shadow-none` : JOB_MOBILE.cardSection;
  const labelCls =
    variant === 'track'
      ? `${JOB_MOBILE.trackSectionTitle} !mb-2`
      : `${JOB_MOBILE.label} mb-2`;

  return (
    <div className={`${wrap} ${className}`}>
      <p className={labelCls}>{label}</p>
      {children}
    </div>
  );
}
