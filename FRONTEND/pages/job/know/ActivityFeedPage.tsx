import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { JobCard, JobPageContent } from '../../../components/job/JobPageContent';
import { JOB_MOBILE } from '../../../components/job/jobMobileStyles';
import { fetchApiJson } from '../../../services/api';

type KnowledgeSpace = { id: string; name: string; slug: string };
type KnowledgeUser = { id: string; displayName: string };

type KnowledgePage = {
  id: string;
  title: string;
  slug: string;
  updatedAt: string;
  updatedBy?: KnowledgeUser | null;
  space?: KnowledgeSpace | null;
};

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
}

export function ActivityFeedPage() {
  const navigate = useNavigate();
  const [recentPages, setRecentPages] = useState<KnowledgePage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const list = await fetchApiJson<KnowledgePage[]>('job/know/recent?limit=20');
        if (!cancelled) setRecentPages(Array.isArray(list) ? list : []);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load activity.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const hasItems = useMemo(() => recentPages.length > 0, [recentPages.length]);

  return (
    <JobPageContent
      variant="track"
      title="Recent activity"
      description="Latest edits and updates across your knowledge spaces."
      error={error}
    >
      {loading && !hasItems ? (
        <div className="space-y-3 py-4" aria-busy="true">
          <div className="h-16 animate-pulse rounded-xl bg-surface-container-high/40" />
          <div className="h-16 animate-pulse rounded-xl bg-surface-container-high/35" />
        </div>
      ) : hasItems ? (
        <JobCard variant="track" flush>
          <div className="divide-y divide-outline-variant/15">
            {recentPages.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => navigate(`/job/know/pages/${encodeURIComponent(p.id)}`)}
                className="w-full rounded-none px-4 py-3 text-left transition-colors hover:bg-surface-container-high/35 active:bg-surface-container-high/50"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-outline-variant/25 bg-surface-container-high">
                    <span className="material-symbols-outlined text-lg text-primary">article</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="break-words text-sm font-semibold leading-tight text-on-surface">{p.title}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className={JOB_MOBILE.meta}>{(p.space?.name || 'Unknown space').trim()}</span>
                      <span className="text-on-surface-variant/60">•</span>
                      <span className={JOB_MOBILE.meta}>Updated {formatDate(p.updatedAt)}</span>
                      {p.updatedBy?.displayName ? (
                        <>
                          <span className="text-on-surface-variant/60">•</span>
                          <span className={JOB_MOBILE.meta}>by {p.updatedBy.displayName}</span>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </JobCard>
      ) : (
        <div className="rounded-[14px] border border-outline-variant/20 bg-surface-container-low/80 px-4 py-8 text-center">
          <p className="text-sm text-on-surface-variant">No recent activity yet. Edited pages will show up here.</p>
        </div>
      )}
    </JobPageContent>
  );
}

