import React from 'react';

/** Web Avatar – matches mobile (rounded, surface bg, optional story ring) */
export function Avatar({
  uri,
  size = 40,
  showStoryRing = false,
  className = '',
}: {
  uri?: string | null;
  size?: number;
  showStoryRing?: boolean;
  className?: string;
}) {
  const ringColors = ['#f09433', '#e1306c', '#833ab4', '#405de6'];
  const ringColor = ringColors[0];

  const inner = (
    <div
      className={`overflow-hidden rounded-full bg-moxe-surface flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {uri ? (
        <img src={uri} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-moxe-border" />
      )}
    </div>
  );

  if (showStoryRing) {
    return (
      <div
        className="flex items-center justify-center flex-shrink-0 rounded-full"
        style={{
          width: size + 4,
          height: size + 4,
          padding: 2,
          background: `linear-gradient(135deg, ${ringColors.join(', ')})`,
        }}
      >
        <div className="rounded-full overflow-hidden bg-moxe-background" style={{ width: size, height: size }}>
          {uri ? (
            <img src={uri} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-moxe-border" />
          )}
        </div>
      </div>
    );
  }

  return inner;
}
