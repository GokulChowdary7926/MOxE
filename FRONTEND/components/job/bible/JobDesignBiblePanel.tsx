import React from 'react';
import { BibleToolLayoutBody } from './BibleToolPage';

function designBibleForcedOn(): boolean {
  const v = import.meta.env.VITE_SHOW_JOB_DESIGN_BIBLE;
  return v === 'true' || v === '1';
}

/**
 * Shared wrapper for illustrative “design bible” layouts (NBK-031).
 *
 * - **Production:** omitted entirely unless `VITE_SHOW_JOB_DESIGN_BIBLE=true` (no silent inline demos in prod).
 * - **Development:** collapsed `<details>` by default so live/API UI stays primary; expand to view reference.
 * - **Forced:** with env var, always renders the expanded section (any mode).
 */
export function JobDesignBiblePanel({
  toolKey,
  showHero = false,
}: {
  toolKey: string;
  showHero?: boolean;
}) {
  const forced = designBibleForcedOn();
  if (import.meta.env.PROD && !forced) {
    return null;
  }

  const body = <BibleToolLayoutBody key={toolKey} toolKey={toolKey} showHero={showHero} />;

  if (forced) {
    return (
      <section className="mt-8 border-t border-outline-variant/20 pt-6" aria-label="Design bible reference">
        <h2 className="mb-3 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
          Reference · Design bible (illustrative)
        </h2>
        {body}
      </section>
    );
  }

  return (
    <details
      className="mt-8 border-t border-outline-variant/20 pt-6 group open:pb-2"
      aria-label="Design bible reference"
    >
      <summary className="cursor-pointer select-none list-none text-[11px] font-bold uppercase tracking-widest text-on-surface-variant [&::-webkit-details-marker]:hidden flex items-center justify-between gap-2">
        <span>Reference · Design bible (illustrative)</span>
        <span className="text-[10px] font-medium normal-case tracking-normal text-on-surface-variant/80 group-open:hidden">
          Show
        </span>
        <span className="text-[10px] font-medium normal-case tracking-normal text-on-surface-variant/80 hidden group-open:inline">
          Hide
        </span>
      </summary>
      <div className="pt-4">{body}</div>
    </details>
  );
}
