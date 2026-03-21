import React from 'react';

type SplitLayoutProps = {
  leftLabel?: string;
  rightLabel?: string;
  left: React.ReactNode;
  right: React.ReactNode;
  /** On mobile, show right (e.g. chat) first when true. */
  reverse?: boolean;
};

/**
 * Two-column layout for Job tools: stacks vertically on mobile, side-by-side on desktop.
 */
export function SplitLayout({ leftLabel, rightLabel, left, right, reverse = false }: SplitLayoutProps) {
  return (
    <div
      className={`flex flex-col gap-6 ${reverse ? 'md:flex-row-reverse' : 'md:flex-row'}`}
    >
      <div className="w-full md:w-80 xl:w-96 flex-shrink-0 space-y-2">
        {leftLabel && (
          <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {leftLabel}
          </div>
        )}
        {left}
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        {rightLabel && (
          <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {rightLabel}
          </div>
        )}
        {right}
      </div>
    </div>
  );
}
