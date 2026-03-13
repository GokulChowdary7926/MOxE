import React from 'react';
import { ChevronDown } from 'lucide-react';
import { UI } from '../../constants/uiTheme';

export type FilterOption = {
  id: string;
  label: string;
};

/**
 * Horizontal filter/sort bar with pill buttons (e.g. "Newest to oldest", "All dates").
 * Same layout for mobile and web; used on Likes, Reposts, Watch history, Saved.
 */
export function FilterBar({
  options,
  activeId,
  onSelect,
}: {
  options: FilterOption[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className={UI.filterBar}>
      {options.map((opt) => {
        const isActive = opt.id === activeId;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onSelect(opt.id)}
            className={`${UI.filterPill} ${isActive ? UI.filterPillActive : UI.filterPillInactive}`}
          >
            {opt.label}
            <ChevronDown className="inline-block w-4 h-4 ml-1 -mb-0.5 opacity-70" />
          </button>
        );
      })}
    </div>
  );
}
