import React from 'react';

/**
 * Wrapper for Job tool page content. Keeps layout and typography consistent
 * across Overview, Track, Recruiter, Agile, etc., and avoids overflow/scroll bugs.
 */
export function JobPageContent({
  title,
  description,
  error,
  children,
}: {
  title: string;
  description?: string;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="job-page-content min-h-0">
      <h2 className="text-lg font-semibold text-[#172B4D] dark:text-[#E6EDF3] mb-1">
        {title}
      </h2>
      {description && (
        <p className="text-sm text-[#5E6C84] dark:text-[#8C9BAB] mb-4">
          {description}
        </p>
      )}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-[#FFEBE6] dark:bg-red-900/30 text-[#BF2600] dark:text-red-300 text-sm">
          {error}
        </div>
      )}
      {children}
    </div>
  );
}
