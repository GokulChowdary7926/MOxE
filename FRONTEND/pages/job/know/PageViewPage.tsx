import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { JobPageContent } from '../../../components/job/JobPageContent';
import { JOB_MOBILE } from '../../../components/job/jobMobileStyles';
import { fetchApiJson } from '../../../services/api';

type KnowledgeSpace = { id: string; name: string; slug: string };
type KnowledgeUser = { id: string; displayName: string };

type KnowledgePage = {
  id: string;
  title: string;
  slug: string;
  content: string;
  status: string;
  updatedAt: string;
  space?: KnowledgeSpace | null;
  updatedBy?: KnowledgeUser | null;
};

export function PageViewPage() {
  const { pageIdOrSlug } = useParams<{ pageIdOrSlug: string }>();
  const [page, setPage] = useState<KnowledgePage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pageIdOrSlug) return;
    let cancelled = false;
    async function load() {
      const key = pageIdOrSlug;
      if (!key) return;
      setLoading(true);
      setError(null);
      try {
        const data = await fetchApiJson<KnowledgePage>(`job/know/pages/${encodeURIComponent(key)}`);
        if (cancelled) return;
        if (data && typeof data === 'object' && 'id' in data && (data as KnowledgePage).id) {
          setPage(data as KnowledgePage);
        } else {
          setPage(null);
          setError('Page not found or you no longer have access.');
        }
      } catch (e: any) {
        if (!cancelled) {
          setPage(null);
          setError(e?.message || 'Failed to load page.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [pageIdOrSlug]);

  const truncatedContent = useMemo(() => {
    if (!page?.content) return '';
    // Keep the initial view light; full editor rendering comes later.
    return page.content.length > 4000 ? `${page.content.slice(0, 4000)}\n\n…(truncated)` : page.content;
  }, [page?.content]);

  return (
    <JobPageContent
      variant="track"
      title={page?.title ?? (loading ? 'Loading…' : 'Page not found')}
      description={page?.space?.name ? `${page.space.name}` : undefined}
      error={error}
    >
      {loading && !page ? (
        <div className="flex items-center justify-center py-12">
          <p className={JOB_MOBILE.meta}>Loading page…</p>
        </div>
      ) : (
        <div
          className="rounded-[14px] border border-outline-variant/25 bg-surface-container p-4 text-sm leading-relaxed text-on-surface whitespace-pre-wrap break-words"
          aria-label="Knowledge page content"
        >
          {truncatedContent || <span className={JOB_MOBILE.meta}>No content yet.</span>}
        </div>
      )}
    </JobPageContent>
  );
}

