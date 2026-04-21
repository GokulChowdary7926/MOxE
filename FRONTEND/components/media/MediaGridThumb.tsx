import React from 'react';
import { ensureAbsoluteMediaUrl, isVideoMediaUrl } from '../../utils/mediaUtils';

export type MediaGridThumbProps = {
  url: string;
  alt?: string;
  className?: string;
};

/**
 * Grid/list thumbnail: muted inline video for video URLs, otherwise img.
 * Use for profile grids, activity thumbs, highlight covers, etc.
 */
export function MediaGridThumb({ url, alt = '', className = '' }: MediaGridThumbProps) {
  const abs = ensureAbsoluteMediaUrl(url);
  if (!abs) return null;
  if (isVideoMediaUrl(url)) {
    return <video src={abs} muted playsInline className={className} />;
  }
  return <img src={abs} alt={alt} className={className} />;
}
