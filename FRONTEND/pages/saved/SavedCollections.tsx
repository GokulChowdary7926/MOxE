import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, ChevronLeft, ChevronDown, Play } from 'lucide-react';
import { ThemedView } from '../../components/ui/Themed';
import { ThemedText, ThemedButton } from '../../components/ui/Themed';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { UI } from '../../constants/uiTheme';
import { getApiBase, getToken } from '../../services/api';
import { ensureAbsoluteMediaUrl } from '../../utils/mediaUtils';

type Collection = {
  id: string;
  name: string;
  coverImage?: string | null;
  savedPostsCount?: number;
  shareToken?: string | null;
  order?: number;
};

type SavedPost = {
  id: string;
  postId: string;
  post: {
    id: string;
    caption: string | null;
    location: string | null;
    media: { url: string }[] | any;
    account: { username: string; displayName?: string | null; profilePhoto?: string | null };
    _count?: { likes: number; comments: number };
  };
};

export default function SavedCollections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([]);
  const [loadingCollections, setLoadingCollections] = useState(true);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedPostsError, setSavedPostsError] = useState<string | null>(null);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [creating, setCreating] = useState(false);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);
  const [savingCoverId, setSavingCoverId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'Collections' | 'All' | 'Reels' | 'Posts' | 'Audio'>('Collections');
  const [showNewCollectionForm, setShowNewCollectionForm] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [dateRange, setDateRange] = useState('all');
  const [contentType, setContentType] = useState('all');
  const [selectMode, setSelectMode] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setError('You must be logged in to view saved posts.');
      setLoadingCollections(false);
      setLoadingSaved(false);
      return;
    }
    setLoadingCollections(true);
    fetch(`${getApiBase()}/collections`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const list: Collection[] = data || [];
        setCollections(list);
      })
      .catch(() => {
        setError('Failed to load collections.');
      })
      .finally(() => setLoadingCollections(false));
  }, []);

  const loadSavedPosts = useCallback(() => {
    const token = getToken();
    if (!token) return;
    setSavedPostsError(null);
    setLoadingSaved(true);
    const params = new URLSearchParams();
    if (activeCollectionId) params.set('collectionId', activeCollectionId);
    fetch(`${getApiBase()}/collections/saved?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const items: SavedPost[] = data.items ?? data.saved ?? [];
        setSavedPosts(items);
      })
      .catch(() => {
        setSavedPostsError('Couldn’t load saved posts. Check your connection.');
      })
      .finally(() => setLoadingSaved(false));
  }, [activeCollectionId]);

  useEffect(() => {
    loadSavedPosts();
  }, [loadSavedPosts]);

  async function createCollection(e: React.FormEvent) {
    e.preventDefault();
    if (!newCollectionName.trim()) return;
    const token = getToken();
    if (!token) return;
    setCreating(true);
    try {
      const res = await fetch(`${getApiBase()}/collections`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newCollectionName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create collection');
      setCollections((prev) => [...prev, data]);
      setNewCollectionName('');
    } catch (e: any) {
      setError(e.message || 'Failed to create collection.');
    } finally {
      setCreating(false);
    }
  }

  async function shareCollection(id: string) {
    const token = getToken();
    if (!token) return;
    setSharingId(id);
    setShareError(null);
    try {
      const res = await fetch(`${getApiBase()}/collections/${id}/share`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create share link.');
      }
      setCollections((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, shareToken: data.shareToken ?? data.token ?? null } : c,
        ),
      );
    } catch (e: any) {
      setShareError(e.message || 'Failed to create share link.');
    } finally {
      setSharingId(null);
    }
  }

  async function persistOrder(next: Collection[]) {
    const token = getToken();
    if (!token) return;
    try {
      await Promise.all(
        next.map((c, index) =>
          fetch(`${getApiBase()}/collections/${c.id}`, {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ order: index }),
          }),
        ),
      );
    } catch {
      // ignore – UI already updated; next reload will sync
    }
  }

  async function setCollectionCoverFromPost(collectionId: string, url: string) {
    const token = getToken();
    if (!token) return;
    setSavingCoverId(collectionId);
    try {
      const res = await fetch(`${getApiBase()}/collections/${collectionId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ coverImage: url }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update cover image.');
      }
      setCollections((prev) =>
        prev.map((c) => (c.id === collectionId ? { ...c, coverImage: data.coverImage } : c)),
      );
    } catch (e: any) {
      setError(e.message || 'Failed to update cover image.');
    } finally {
      setSavingCoverId(null);
    }
  }

  async function shareActiveCollectionToStory() {
    if (!activeCollectionId || savedPosts.length === 0) return;
    const token = getToken();
    if (!token) return;
    const collection = collections.find((c) => c.id === activeCollectionId);
    const first = savedPosts[0];
    const mediaArray = Array.isArray(first.post.media) ? first.post.media : [];
    const mediaUrl = mediaArray[0]?.url;
    if (!mediaUrl) return;
    try {
      const body = {
        media: [{ url: mediaUrl }],
        text: collection ? `Collection · ${collection.name}` : 'Saved collection',
      };
      const res = await fetch(`${getApiBase()}/stories`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to share collection to story.');
      }
      setShareError(null);
      setShareError(null);
    } catch (e: any) {
      setShareError(e.message || 'Failed to share collection to story.');
    }
  }

  const gridItems = savedPosts.map((s) => {
    const p = s.post;
    const mediaArray = Array.isArray(p.media) ? p.media : [];
    const mediaUrl = mediaArray[0]?.url ?? '';
    const collection = activeCollectionId ? collections.find((c) => c.id === activeCollectionId) : null;
    return {
      id: s.id,
      imageUrl: mediaUrl || null,
      label: collection?.name ?? (p.caption ? p.caption.slice(0, 20) + (p.caption.length > 20 ? '…' : '') : ''),
      isVideo: false,
    };
  });

  return (
    <ThemedView className={`min-h-screen flex flex-col ${UI.bg}`}>
      <header className={`${UI.header} flex-shrink-0`}>
        <Link to="/profile" className={UI.headerBack} aria-label="Back">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <span className={UI.headerTitle}>Saved</span>
        <div className="min-w-[80px] flex justify-end">
          <button type="button" onClick={() => setSelectMode((v) => !v)} className={UI.headerAction}>
            {selectMode ? 'Cancel' : 'Select'}
          </button>
        </div>
      </header>
      <div className="flex-1 overflow-auto pb-20">
        <div className={`${UI.tabs} px-4 pt-2`}>
          {(['Collections', 'All', 'Reels', 'Posts', 'Audio'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`${UI.tab} ${activeTab === tab ? UI.tabActive : UI.tabInactive}`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 px-4 py-2 overflow-x-auto no-scrollbar border-b border-[#262626]">
          <button type="button" className="flex items-center gap-1 px-3 py-2 rounded-lg bg-[#262626] border border-[#363636] text-white text-sm">
            {sortBy === 'newest' ? 'Newest to oldest' : 'Oldest to newest'}
            <ChevronDown className="w-4 h-4 text-[#a8a8a8] ml-0.5" />
          </button>
          <button type="button" className="flex items-center gap-1 px-3 py-2 rounded-lg bg-[#262626] border border-[#363636] text-white text-sm">
            {dateRange === 'all' ? 'All dates' : dateRange}
            <ChevronDown className="w-4 h-4 text-[#a8a8a8] ml-0.5" />
          </button>
          <button type="button" className="flex items-center gap-1 px-3 py-2 rounded-lg bg-[#262626] border border-[#363636] text-white text-sm">
            {contentType === 'all' ? 'All content types' : contentType}
            <ChevronDown className="w-4 h-4 text-[#a8a8a8] ml-0.5" />
          </button>
        </div>
        {activeTab === 'Collections' && (
        <section className="pt-2">
          <h2 className="text-[#737373] font-semibold text-xs uppercase tracking-wider mb-2 px-4">
            Collections
          </h2>
          {loadingCollections && (
            <ThemedText secondary className="text-moxe-caption">
              Loading collections…
            </ThemedText>
          )}
          {!loadingCollections && (
            <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar px-4">
              <button
                type="button"
                onClick={() => setActiveCollectionId(null)}
                className={`flex flex-col items-center flex-shrink-0 w-[72px] ${
                  activeCollectionId === null ? 'opacity-100' : 'opacity-70'
                }`}
              >
                <div className="w-14 h-14 rounded-full border border-[#363636] overflow-hidden mb-1 bg-[#262626] flex items-center justify-center">
                  <span className="text-xl">★</span>
                </div>
                <ThemedText secondary className="text-[11px] truncate max-w-[72px] text-[#a8a8a8]">
                  All posts
                </ThemedText>
              </button>
              {collections.map((c, index) => (
                <div
                  key={c.id}
                  className="flex flex-col items-center flex-shrink-0 w-[72px]"
                >
                  <button
                    type="button"
                    onClick={() => setActiveCollectionId(c.id)}
                    className={`flex flex-col items-center ${
                      activeCollectionId === c.id ? 'opacity-100' : 'opacity-70'
                    }`}
                  >
                    <div className="w-14 h-14 rounded-full border border-[#363636] overflow-hidden mb-1 bg-[#262626]">
                      {c.coverImage ? (
                        <img src={ensureAbsoluteMediaUrl(c.coverImage)} alt={c.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#737373]">
                          📁
                        </div>
                      )}
                    </div>
                    <ThemedText secondary className="text-[11px] truncate max-w-[72px] text-[#a8a8a8]">
                      {c.name}
                    </ThemedText>
                  </button>
                              <div className="flex gap-1 mt-0.5">
                                {index > 0 && (
                                  <button
                                    type="button"
                                  onClick={async () => {
                                    if (reordering) return;
                                    setReordering(true);
                                    setCollections((prev) => {
                                      const copy = [...prev];
                                      const tmp = copy[index - 1];
                                      copy[index - 1] = copy[index];
                                      copy[index] = tmp;
                                      persistOrder(copy);
                                      return copy;
                                    });
                                    setReordering(false);
                                  }}
                                    className="text-[9px] text-moxe-textSecondary"
                                  >
                                    ↑
                                  </button>
                                )}
                                {index < collections.length - 1 && (
                                  <button
                                    type="button"
                                  onClick={async () => {
                                    if (reordering) return;
                                    setReordering(true);
                                    setCollections((prev) => {
                                      const copy = [...prev];
                                      const tmp = copy[index + 1];
                                      copy[index + 1] = copy[index];
                                      copy[index] = tmp;
                                      persistOrder(copy);
                                      return copy;
                                    });
                                    setReordering(false);
                                  }}
                                    className="text-[9px] text-moxe-textSecondary"
                                  >
                                    ↓
                                  </button>
                                )}
                              </div>
                              {c.shareToken && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const url = `${window.location.origin}/collections/shared/${encodeURIComponent(
                                      c.shareToken as string,
                                    )}`;
                                    navigator.clipboard
                                      .writeText(url)
                                      .catch(() => {});
                                  }}
                                  className="mt-0.5 text-[9px] text-moxe-primary"
                                >
                                  Copy link
                                </button>
                              )}
                              {!c.shareToken && (
                                <button
                                  type="button"
                                  onClick={() => shareCollection(c.id)}
                                  className="mt-0.5 text-[9px] text-moxe-textSecondary"
                                >
                                  {sharingId === c.id ? 'Sharing…' : 'Share'}
                                </button>
                              )}
                            </div>
                          ))}
            </div>
          )}
          {showNewCollectionForm && (
            <form onSubmit={createCollection} className="mt-3 flex gap-2 px-4">
              <input
                type="text"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder="New collection name"
                className="flex-1 px-3 py-2 rounded-lg bg-[#262626] border border-[#363636] text-white text-sm placeholder:text-[#737373]"
              />
              <ThemedButton
                type="submit"
                label={creating ? 'Adding…' : 'Add'}
                disabled={creating || !newCollectionName.trim()}
                className="px-3 py-2 text-xs"
              />
            </form>
          )}
        </section>
        )}

        <section className="pt-2 px-0">
          {activeTab !== 'Collections' && (
            <p className="text-[#737373] text-sm px-4 pb-2">
              {activeTab === 'All' && 'All saved content.'}
              {activeTab === 'Reels' && 'Saved reels.'}
              {activeTab === 'Posts' && 'Saved posts.'}
              {activeTab === 'Audio' && 'Saved audio.'}
            </p>
          )}
          {loadingSaved && (
            <ThemedText secondary className="text-[#737373] px-4 py-3">
              Loading saved posts…
            </ThemedText>
          )}
          {savedPostsError && !loadingSaved && (
            <div className="px-4">
              <ErrorState message={savedPostsError} onRetry={loadSavedPosts} />
            </div>
          )}
          {!loadingSaved && !savedPostsError && savedPosts.length === 0 && (
            <EmptyState
              title="Save posts to revisit"
              message="Tap the save icon on posts to add them to your private collection."
            />
          )}
          {activeCollectionId && savedPosts.length > 0 && activeTab === 'Collections' && (
            <div className="mb-2 px-4">
              <ThemedButton
                label="Share this collection to your story"
                onClick={shareActiveCollectionToStory}
                className="w-full justify-center text-xs"
              />
            </div>
          )}
          {!loadingSaved && savedPosts.length > 0 && (
            <div className={UI.grid2}>
              {gridItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="text-left block"
                  onClick={() => {
                    const s = savedPosts.find((x) => x.id === item.id);
                    if (s) navigate(`/post/${s.post.id}`);
                  }}
                >
                  <div className={`${UI.gridItem} relative`}>
                    {item.imageUrl ? (
                      <img src={ensureAbsoluteMediaUrl(item.imageUrl)} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-[#262626] flex items-center justify-center">
                        <span className="text-[#737373] text-xs">No preview</span>
                      </div>
                    )}
                    <span className={UI.gridItemPlayIcon}>
                      <Play className="w-3 h-3 text-white fill-white" />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
        {error && <p className="text-red-400 text-sm mt-2 px-4">{error}</p>}
        {shareError && <p className="text-red-400 text-sm mt-1 px-4">{shareError}</p>}
      </div>
    </ThemedView>
  );
}
