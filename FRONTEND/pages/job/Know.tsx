import React from 'react';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { JOB_MOBILE } from '../../components/job/jobMobileStyles';
import { JobPageContent, JobCard } from '../../components/job/JobPageContent';
import { KnowShell } from '../../components/job/know/KnowShell';
import { ActivityFeedPage } from './know/ActivityFeedPage';
import { PageViewPage } from './know/PageViewPage';

function KnowModulePlaceholder({
  title,
  eyebrow,
  headline,
  description,
  cards,
}: {
  title: string;
  eyebrow: string;
  headline: string;
  description: string;
  cards: { tag: string; title: string; body: string; icon: string }[];
}) {
  return (
    <JobPageContent variant="track" title={title}>
      <div className="space-y-5 pb-2">
        <section className="relative overflow-hidden rounded-xl border border-outline-variant/15 bg-surface-container p-5 border-l-4 border-l-primary">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
          <h2 className="mb-2 font-headline text-xl font-black tracking-tight text-on-surface">{headline}</h2>
          <p className="text-sm leading-relaxed text-on-surface-variant">{description}</p>
          <div className="pointer-events-none absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-primary/10 to-transparent" />
        </section>

        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
            <span className="h-2 w-2 rounded-full bg-secondary" />
            Coming in your workspace
          </h3>
          {cards.map((c) => (
            <article
              key={c.title}
              className="rounded-xl border border-outline-variant/15 bg-surface-container-low p-4 border-l-4 border-l-primary/60"
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <span className="rounded bg-on-primary-container/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-tighter text-on-primary-container">
                  {c.tag}
                </span>
                <span className="material-symbols-outlined text-on-surface-variant/80">{c.icon}</span>
              </div>
              <h4 className="mb-1 text-base font-bold text-on-surface">{c.title}</h4>
              <p className="text-sm leading-snug text-on-surface-variant">{c.body}</p>
            </article>
          ))}
        </div>

        <JobCard variant="track">
          <div className="flex flex-col gap-3 py-1">
            <p className={JOB_MOBILE.trackBody}>
              This area is still being connected to live data. Use Activity for updates today.
            </p>
            <div className="flex flex-col gap-2">
              <Link
                to="/job/know/activity"
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-gradient-to-r from-primary to-on-primary-container px-4 py-2.5 text-center text-sm font-bold text-on-primary"
              >
                Open Activity feed
              </Link>
              <Link
                to="/job/overview/home"
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-outline-variant/25 bg-surface-container-high px-4 py-2.5 text-center text-sm font-semibold text-on-surface"
              >
                Job dashboard
              </Link>
            </div>
          </div>
        </JobCard>
      </div>
    </JobPageContent>
  );
}

export default function Know() {
  return (
    <Routes>
      <Route element={<KnowShell />}>
        <Route index element={<Navigate to="activity" replace />} />
        <Route path="activity" element={<ActivityFeedPage />} />
        <Route
          path="spaces"
          element={
            <KnowModulePlaceholder
              title="Spaces"
              eyebrow="Knowledge mesh"
              headline="Team & project spaces"
              description="Organize pages and permissions by space — same hierarchy as MOxE Know in the design bible."
              cards={[
                {
                  tag: 'Space',
                  title: 'Engineering',
                  body: 'Runbooks, ADRs, and onboarding — pinned for your squad.',
                  icon: 'folder_special',
                },
                {
                  tag: 'Space',
                  title: 'Company',
                  body: 'Policies, handbooks, and announcements.',
                  icon: 'apartment',
                },
              ]}
            />
          }
        />
        <Route
          path="labels"
          element={
            <KnowModulePlaceholder
              title="Labels"
              eyebrow="Taxonomy"
              headline="Labels & facets"
              description="Cross-link knowledge with shared labels for search and automation."
              cards={[
                {
                  tag: 'Label',
                  title: 'platform · reliability',
                  body: 'Group incident docs, status comms, and postmortems.',
                  icon: 'label',
                },
                {
                  tag: 'Label',
                  title: 'hiring · track',
                  body: 'Attach recruiter briefs to knowledge pages.',
                  icon: 'sell',
                },
              ]}
            />
          }
        />
        <Route
          path="drafts"
          element={
            <KnowModulePlaceholder
              title="Drafts"
              eyebrow="Authoring"
              headline="Draft pages"
              description="Save work-in-progress before publish — mobile authoring layout from the bible."
              cards={[
                {
                  tag: 'Draft',
                  title: 'API versioning memo',
                  body: 'Last edited 2h ago · not shared',
                  icon: 'edit_note',
                },
                {
                  tag: 'Draft',
                  title: 'Runbook: deploy freeze',
                  body: 'Awaiting review from on-call lead.',
                  icon: 'description',
                },
              ]}
            />
          }
        />
        <Route
          path="profile"
          element={
            <KnowModulePlaceholder
              title="Knowledge profile"
              eyebrow="Identity"
              headline="Your contributions"
              description="Stats on pages authored, edits, and followed spaces — aligned with Know profile patterns."
              cards={[
                {
                  tag: 'Stats',
                  title: '12 pages authored',
                  body: 'Most active in Engineering space.',
                  icon: 'person',
                },
                {
                  tag: 'Feed',
                  title: 'Following 4 spaces',
                  body: 'Notifications for edits you care about.',
                  icon: 'notifications',
                },
              ]}
            />
          }
        />
        <Route path="pages/:pageIdOrSlug" element={<PageViewPage />} />
        <Route path="*" element={<Navigate to="activity" replace />} />
      </Route>
    </Routes>
  );
}
