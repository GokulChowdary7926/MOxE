import React, { useEffect, useMemo, useState } from 'react';
import { JobToolBibleShell } from './JobToolBibleShell';
import { JOB_BIBLE_UI } from './jobBibleUiConfig';

export type BibleToolLayoutBodyProps = {
  toolKey: string;
  /** Hero + description block */
  showHero?: boolean;
  /** Chip row */
  showChips?: boolean;
  /** Priority cards */
  showCards?: boolean;
  className?: string;
};

/**
 * Bible “command center” body only (no shell) — compose under a custom header or after live data.
 */
export function BibleToolLayoutBody({
  toolKey,
  showHero = true,
  showChips = true,
  showCards = true,
  className = '',
}: BibleToolLayoutBodyProps) {
  const c = JOB_BIBLE_UI[toolKey];

  const defaultTabIdx = useMemo(() => {
    if (!c) return 0;
    const idx = c.chips.findIndex((ch) => ch.active);
    return idx >= 0 ? idx : 0;
  }, [c]);

  const [tabIndex, setTabIndex] = useState(defaultTabIdx);
  const [cardIndex, setCardIndex] = useState<number | null>(null);

  useEffect(() => {
    setTabIndex(defaultTabIdx);
    setCardIndex(null);
  }, [toolKey, defaultTabIdx]);

  if (!c) {
    return (
      <div className={`p-4 text-sm text-on-surface-variant ${className}`}>
        Unknown tool key: <code>{toolKey}</code>
      </div>
    );
  }

  const setTab = (i: number) => {
    setTabIndex(i);
    setCardIndex(null);
  };

  const setCard = (i: number) => {
    setCardIndex(i);
  };

  const focusedCard = cardIndex !== null ? c.cards[cardIndex] : null;

  return (
    <div className={`space-y-6 pb-4 font-body text-on-background ${className}`}>
      {showHero ? (
        <section className="relative overflow-hidden rounded-xl border border-outline-variant/15 bg-surface-container p-5 border-l-4 border-l-primary">
          <div className="relative z-10">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">{c.eyebrow}</p>
            <h1 className="mb-2 font-headline text-2xl font-black tracking-tighter text-on-surface">{c.headline}</h1>
            <p className="max-w-prose text-sm leading-relaxed text-on-surface-variant">{c.description}</p>
          </div>
          <div className="pointer-events-none absolute right-0 top-0 h-full w-36 bg-gradient-to-l from-primary/10 to-transparent" />
        </section>
      ) : null}

      {showChips ? (
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar -mx-1 px-1">
          {c.chips.map((ch, i) => (
            <button
              key={ch.label}
              type="button"
              onClick={() => setTab(i)}
              className={`flex-none cursor-pointer whitespace-nowrap rounded-full px-5 py-2 text-xs font-bold transition-transform active:scale-[0.98] ${
                tabIndex === i
                  ? 'bg-primary text-on-primary shadow-lg shadow-primary/15'
                  : 'bg-surface-container-high text-on-surface-variant'
              }`}
            >
              {ch.label}
            </button>
          ))}
        </div>
      ) : null}

      {showCards ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
              <span className="h-2 w-2 rounded-full bg-secondary" />
              Priority surface
            </h3>
            <span className="text-[10px] font-medium text-outline">{c.cards.length} panels</span>
          </div>

          {focusedCard ? (
            <div
              className="rounded-xl border border-primary/35 bg-primary/5 p-4 shadow-sm"
              role="region"
              aria-label="Focused panel"
            >
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-primary">Focused view</p>
              <h4 className="mb-1 text-base font-bold text-on-surface">{focusedCard.title}</h4>
              <p className="text-sm text-on-surface-variant">{focusedCard.body}</p>
              <button
                type="button"
                onClick={() => setCardIndex(null)}
                className="mt-3 text-xs font-bold uppercase tracking-wide text-primary underline-offset-2 hover:underline"
              >
                Clear focus
              </button>
            </div>
          ) : null}

          {c.cards.map((card, i) => (
            <button
              key={card.title}
              type="button"
              onClick={() => setCard(i)}
              className={`w-full rounded-xl bg-surface-container-low p-5 text-left shadow-sm transition ring-offset-background ${
                cardIndex === i ? 'ring-2 ring-primary/50' : ''
              } ${card.borderClass ?? 'border border-outline-variant/10'}`}
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <span className="rounded bg-on-primary-container/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-tighter text-on-primary-container">
                  {card.tag}
                </span>
                <span className="material-symbols-outlined text-outline">{card.icon}</span>
              </div>
              <h4 className="mb-2 text-lg font-bold leading-tight text-on-surface">{card.title}</h4>
              <p className="text-sm leading-snug text-on-surface-variant">{card.body}</p>
              <div className="mt-4 flex items-center justify-between border-t border-outline-variant/10 pt-3 text-xs text-outline">
                <span className="flex items-center gap-1 font-semibold uppercase tracking-wide">
                  <span className="material-symbols-outlined text-sm">bolt</span> MOxE mesh
                </span>
                <span className="material-symbols-outlined text-on-surface-variant">more_horiz</span>
              </div>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export type BibleToolPageProps = {
  toolKey: string;
  /** Content below bible panels (e.g. live Track board). */
  belowFold?: React.ReactNode;
  /** Override shell back target; see `JobToolBibleShell.leadingBackTo`. */
  leadingBackTo?: string | null;
};

/**
 * Static “command center” layout for a Job tool — matches `HTML UI.html` patterns.
 * Use `belowFold` for interactive surfaces (Agile/Scrum/Alert boards).
 */
export function BibleToolPage({ toolKey, belowFold, leadingBackTo }: BibleToolPageProps) {
  const c = JOB_BIBLE_UI[toolKey];
  if (!c) {
    return (
      <div className="p-4 text-sm text-on-surface-variant">
        Unknown tool: <code>{toolKey}</code>
      </div>
    );
  }

  return (
    <JobToolBibleShell toolTitle={c.toolTitle} toolIconMaterial={c.toolIcon} leadingBackTo={leadingBackTo}>
      <BibleToolLayoutBody key={toolKey} toolKey={toolKey} />
      {belowFold ? <div className="mt-2 border-t border-outline-variant/15 pt-6">{belowFold}</div> : null}
    </JobToolBibleShell>
  );
}
