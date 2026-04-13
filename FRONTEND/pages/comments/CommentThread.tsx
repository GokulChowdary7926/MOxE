import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useCurrentAccount } from '../../hooks/useAccountCapabilities';
import { getApiBase, getToken } from '../../services/api';
import { SocialCommentRow } from '../../components/comments/SocialCommentRow';
import { ThemedView } from '../../components/ui/Themed';
import { MobileShell } from '../../components/layout/MobileShell';
import { UI } from '../../constants/uiTheme';

type Reply = {
  id: string;
  content: string;
  createdAt: string;
  account: {
    id: string;
    username: string;
    displayName?: string | null;
    profilePhoto?: string | null;
    avatarUrl?: string | null;
  };
};

function normalizeComment(raw: any): Reply | null {
  if (!raw?.id || !raw?.account) return null;
  const created =
    typeof raw.createdAt === 'string'
      ? raw.createdAt
      : raw.createdAt instanceof Date
        ? raw.createdAt.toISOString()
        : new Date().toISOString();
  const acc = raw.account;
  return {
    id: raw.id,
    content: raw.content ?? '',
    createdAt: created,
    account: {
      id: acc.id,
      username: acc.username ?? 'user',
      displayName: acc.displayName ?? null,
      profilePhoto: acc.profilePhoto ?? acc.avatarUrl ?? null,
      avatarUrl: acc.avatarUrl ?? null,
    },
  };
}

/**
 * Full-screen comment thread — MOxE social shell.
 */
export default function CommentThread() {
  const { commentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { focusComposer?: boolean } };
  const [root, setRoot] = useState<Reply | null>(null);
  const [postId, setPostId] = useState<string | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [saving, setSaving] = useState(false);
  const currentAccount = useCurrentAccount();
  const replyInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (location.state?.focusComposer) {
      const t = setTimeout(() => replyInputRef.current?.focus(), 300);
      return () => clearTimeout(t);
    }
  }, [location.state]);

  useEffect(() => {
    if (!commentId) return;
    const threadId: string = commentId;
    const fallbackPostId = (location.state as { fromPostId?: string } | undefined)?.fromPostId;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const token = getToken();
        const headers: HeadersInit = {};
        if (token) headers.Authorization = `Bearer ${token}`;
        const res = await fetch(
          `${getApiBase()}/posts/comments/${encodeURIComponent(threadId)}/replies`,
          { headers },
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error((data as { error?: string }).error || 'Failed to load comment thread.');
        }
        const rawRoot = (data as { comment?: unknown }).comment;
        const rawReplies = (data as { replies?: unknown[] }).replies;
        const pid = (data as { postId?: string | null }).postId;
        const nRoot = normalizeComment(rawRoot);
        setRoot(nRoot);
        setPostId(typeof pid === 'string' ? pid : null);
        const list = Array.isArray(rawReplies)
          ? rawReplies.map(normalizeComment).filter(Boolean) as Reply[]
          : [];
        setReplies(list);
        if (!nRoot) {
          setError('Comment not found.');
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load comment thread.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [commentId, location.state]);

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!commentId) return;
    const text = replyText.trim();
    if (!text) return;
    const token = getToken();
    if (!token) {
      setError('You must be logged in to reply.');
      return;
    }
    setSaving(true);
    try {
      if (!postId) throw new Error('Missing post context.');
      const res = await fetch(`${getApiBase()}/posts/${encodeURIComponent(postId)}/comments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: text, parentId: commentId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data as { error?: string }).error || 'Failed to reply.');
      }
      const added = normalizeComment(data);
      if (added) setReplies((prev) => [added, ...prev]);
      setReplyText('');
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to reply.');
    } finally {
      setSaving(false);
    }
  }

  const displayComments = useMemo(() => {
    return root ? [root, ...replies] : replies;
  }, [root, replies]);

  const totalCount = displayComments.length;

  return (
    <ThemedView className={`min-h-screen flex flex-col ${UI.bg}`}>
      <MobileShell>
        <header className={`${UI.header} flex-shrink-0`}>
          <button type="button" onClick={() => navigate(-1)} className={UI.headerBack} aria-label="Back">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <span className={UI.headerTitle}>
            Comments ({totalCount} Comment{totalCount === 1 ? '' : 's'})
          </span>
          <div className="w-11" />
        </header>

        <div className="flex-1 min-h-0 overflow-auto px-4">
          {loading && <p className="text-[#8e8e8e] text-sm py-8 text-center">Loading…</p>}
          {error && !loading && !root && <p className="text-red-400 text-sm py-6 text-center">{error}</p>}

          {!loading &&
            displayComments.map((r) => (
              <SocialCommentRow
                key={r.id}
                commentId={r.id}
                content={r.content}
                createdAt={r.createdAt}
                account={{
                  id: r.account.id,
                  username: r.account.username,
                  displayName: r.account.displayName,
                  profilePhoto: r.account.profilePhoto ?? r.account.avatarUrl,
                }}
                usePseudoCounts
                onReply={() => replyInputRef.current?.focus()}
              />
            ))}
        </div>

        {error && root && (
          <p className="shrink-0 px-4 py-2 text-red-400 text-xs border-t border-[#262626] bg-black">{error}</p>
        )}

        {currentAccount && root && postId && (
          <form
            onSubmit={sendReply}
            className="shrink-0 px-4 py-3 border-t border-[#262626] bg-black flex items-center gap-2 pb-[max(12px,env(safe-area-inset-bottom))]"
          >
            <input
              ref={replyInputRef}
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Add a comment…"
              className="flex-1 min-h-[44px] px-4 rounded-full bg-[#262626] border border-[#363636] text-[15px] text-white placeholder:text-[#8e8e8e] outline-none focus:ring-1 focus:ring-moxe-primary"
            />
            <button
              type="submit"
              disabled={saving || !replyText.trim()}
              className="text-moxe-primary font-semibold text-[15px] px-2 py-1 disabled:opacity-40"
            >
              {saving ? '…' : 'Post'}
            </button>
          </form>
        )}

        {currentAccount && root && !postId && (
          <p className="shrink-0 px-4 py-3 text-sm text-red-400 border-t border-[#262626]">Missing post context.</p>
        )}

        {!currentAccount && (
          <div className="shrink-0 px-4 py-3 border-t border-[#262626] bg-black pb-[max(12px,env(safe-area-inset-bottom))]">
            <Link to="/login" className="text-moxe-primary text-sm font-semibold">
              Log in to comment
            </Link>
          </div>
        )}
      </MobileShell>
    </ThemedView>
  );
}
