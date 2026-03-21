import React from 'react';
import { JOB_MOBILE } from './jobMobileStyles';

/**
 * Wrapper for Job tool page content. Mobile-first: single column, touch-friendly,
 * consistent Atlassian-style tokens across all Job tools.
 */
export function JobPageContent({
  title,
  description,
  error,
  children,
  className = '',
}: {
  title: string;
  description?: string;
  error?: string | null;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`job-page-content min-h-0 ${className}`}>
      <h1 className={JOB_MOBILE.pageTitle}>{title}</h1>
      {description && <p className={JOB_MOBILE.pageDesc}>{description}</p>}
      {error && <div className={`mb-4 ${JOB_MOBILE.error}`}>{error}</div>}
      {children}
    </div>
  );
}

/** Mobile card for Job tools: rounded, bordered, padded. */
export function JobCard({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`${JOB_MOBILE.card} ${JOB_MOBILE.cardPadding} ${className}`}>
      {children}
    </div>
  );
}

/** Section with label (e.g. "Goals", "Pipelines") for stats or lists. */
export function JobSection({
  label,
  children,
  className = '',
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`${JOB_MOBILE.cardSection} ${className}`}>
      <p className={`${JOB_MOBILE.label} mb-2`}>{label}</p>
      {children}
    </div>
  );
}
