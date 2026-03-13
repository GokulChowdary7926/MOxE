import React from 'react';
import { Play } from 'lucide-react';
import { UI } from '../../constants/uiTheme';

type GridItem = {
  id: string;
  imageUrl?: string | null;
  label?: string;
  isVideo?: boolean;
  overlayText?: string;
};

/**
 * 2- or 3-column grid for Likes, Saved, Reposts, Watch history.
 * Same layout for mobile and web; columns can be 2 on small, 3+ on larger.
 */
export function ContentGrid({
  items,
  columns = 2,
  showPlayIcon = false,
  onItemClick,
}: {
  items: GridItem[];
  columns?: 2 | 3;
  showPlayIcon?: boolean;
  onItemClick?: (id: string) => void;
}) {
  const gridClass = columns === 3 ? UI.grid3 : UI.grid2;
  return (
    <div className={gridClass}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className="text-left block"
          onClick={() => onItemClick?.(item.id)}
        >
          <div className={`${UI.gridItem} relative`}>
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : item.overlayText ? (
              <div className="w-full h-full flex items-center justify-center p-2 bg-[#262626]">
                <span className="text-white text-xs line-clamp-3">
                  {item.overlayText}
                </span>
              </div>
            ) : (
              <div className="w-full h-full bg-[#262626]" />
            )}
            {showPlayIcon && item.isVideo !== false && (
              <span className={UI.gridItemPlayIcon}>
                <Play className="w-3 h-3 text-white fill-white" />
              </span>
            )}
          </div>
          {item.label != null && item.label !== '' && (
            <p className="text-white text-xs py-1 truncate">{item.label}</p>
          )}
        </button>
      ))}
    </div>
  );
}
