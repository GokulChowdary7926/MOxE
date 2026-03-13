import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { UI } from '../../constants/uiTheme';

/**
 * Standard screen header: back + centered title + optional right action (e.g. "Select").
 * Same layout for mobile and web; used on Likes, Reposts, Saved, Watch history, etc.
 */
export function ScreenBar({
  title,
  backTo,
  right,
}: {
  title: string;
  backTo: string;
  right?: React.ReactNode;
}) {
  return (
    <header className={UI.header}>
      <div className="min-w-[80px] flex justify-start">
        <Link to={backTo} className={UI.headerBack} aria-label="Back">
          <ChevronLeft className="w-6 h-6" />
        </Link>
      </div>
      <span className={UI.headerTitle}>{title}</span>
      <div className="min-w-[80px] flex justify-end">
        {right != null ? (
          <span className={typeof right === 'string' ? UI.headerAction : undefined}>
            {right}
          </span>
        ) : (
          <span className="w-10" aria-hidden />
        )}
      </div>
    </header>
  );
}
