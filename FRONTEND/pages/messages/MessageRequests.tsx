import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, PenSquare } from 'lucide-react';
import { ThemedView, ThemedText } from '../../components/ui/Themed';
import { Avatar } from '../../components/ui/Avatar';
import { MobileShell } from '../../components/layout/MobileShell';
import { getApiBase, getToken } from '../../services/api';

type MessageRequestItem = {
  otherId: string;
  other?: { id: string; username: string; displayName?: string; profilePhoto?: string };
  lastMessage?: string;
};

export default function MessageRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<MessageRequestItem[]>([]);
  const [hiddenRequests, setHiddenRequests] = useState<MessageRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'youMayKnow' | 'hidden'>('youMayKnow');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const token = getToken();
        if (!token) {
          setLoading(false);
          return;
        }
        const res = await fetch(`${getApiBase()}/messages/threads`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        setRequests(data.requests ?? []);
        setHiddenRequests(data.hiddenRequests ?? []);
      } catch {
        if (!cancelled) setRequests([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const list = tab === 'youMayKnow' ? requests : hiddenRequests;

  const accept = async (otherId: string) => {
    const token = getToken();
    if (!token) return;
    try {
      await fetch(`${getApiBase()}/message_requests/${encodeURIComponent(otherId)}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests((prev) => prev.filter((r) => r.otherId !== otherId));
      navigate(`/messages/${otherId}`);
    } catch {
      // ignore
    }
  };

  const decline = async (otherId: string) => {
    const token = getToken();
    if (!token) return;
    try {
      await fetch(`${getApiBase()}/message_requests/${encodeURIComponent(otherId)}/decline`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests((prev) => prev.filter((r) => r.otherId !== otherId));
      setHiddenRequests((prev) => prev.filter((r) => r.otherId !== otherId));
    } catch {
      // ignore
    }
  };

  const block = async (otherId: string) => {
    const token = getToken();
    if (!token) return;
    try {
      await fetch(`${getApiBase()}/message_requests/${encodeURIComponent(otherId)}/block`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests((prev) => prev.filter((r) => r.otherId !== otherId));
      setHiddenRequests((prev) => prev.filter((r) => r.otherId !== otherId));
    } catch {
      // ignore
    }
  };

  const deleteAll = async () => {
    const token = getToken();
    if (!token || list.length === 0) return;
    try {
      await Promise.all(
        list.map((r) =>
          fetch(`${getApiBase()}/message_requests/${encodeURIComponent(r.otherId)}/decline`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          }),
        ),
      );
      if (tab === 'youMayKnow') setRequests([]);
      else setHiddenRequests([]);
    } catch {
      // ignore
    }
  };

  return (
    <ThemedView className="min-h-screen flex flex-col bg-black">
      <MobileShell>
        <header className="flex items-center justify-between h-12 px-3 border-b border-[#262626] bg-black safe-area-pt">
          <div className="flex items-center gap-2">
            <Link to="/messages" className="flex items-center text-white" aria-label="Back">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <span className="text-white font-semibold text-base">Message requests</span>
          </div>
          <button type="button" className="text-white p-2" aria-label="Edit">
            <PenSquare className="w-5 h-5" />
          </button>
        </header>

        {/* Tabs: You may know | Hidden requests */}
        <div className="flex border-b border-[#262626]">
          <button
            type="button"
            onClick={() => setTab('youMayKnow')}
            className={`flex-1 py-3 text-sm font-semibold ${
              tab === 'youMayKnow' ? 'text-[#0095f6] border-b-2 border-[#0095f6]' : 'text-[#737373] border-b-2 border-transparent'
            }`}
          >
            You may know
          </button>
          <button
            type="button"
            onClick={() => setTab('hidden')}
            className={`flex-1 py-3 text-sm font-semibold ${
              tab === 'hidden' ? 'text-[#0095f6] border-b-2 border-[#0095f6]' : 'text-[#737373] border-b-2 border-transparent'
            }`}
          >
            Hidden requests
          </button>
        </div>

        <div className="flex-1 overflow-auto px-4 py-4 pb-20">
          {tab === 'youMayKnow' && (
            <p className="text-[#a8a8a8] text-sm mb-4">
              When someone you&apos;re not following messages you, their message will appear here.
            </p>
          )}
          {loading && (
            <ThemedText secondary className="text-sm">Loading…</ThemedText>
          )}
          {!loading && list.length === 0 && (
            <div className="py-8 text-center">
              <ThemedText secondary className="text-sm">No message requests.</ThemedText>
            </div>
          )}
          {!loading &&
            list.map((r) => {
              const other = (r.other ?? {}) as { username?: string; displayName?: string; profilePhoto?: string };
              const name = other.username || other.displayName || 'Unknown';
              return (
                <div
                  key={r.otherId}
                  className="flex items-center justify-between py-3 border-b border-[#262626]"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Avatar uri={other.profilePhoto} size={44} />
                    <div className="min-w-0 flex-1">
                      <ThemedText className="font-semibold text-white text-sm truncate">{name}</ThemedText>
                      {r.lastMessage && (
                        <ThemedText secondary className="text-xs truncate">{r.lastMessage}</ThemedText>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => accept(r.otherId)}
                      className="text-[#0095f6] text-sm font-semibold"
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => decline(r.otherId)}
                      className="text-[#a8a8a8] text-sm"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => block(r.otherId)}
                      className="text-[#ed4956] text-sm"
                    >
                      Block
                    </button>
                  </div>
                </div>
              );
            })}
        </div>

        {!loading && list.length > 0 && (
          <div className="border-t border-[#262626] px-4 py-3 pb-8">
            <button
              type="button"
              onClick={deleteAll}
              className="w-full py-2 text-[#ed4956] text-sm font-semibold"
            >
              Delete all
            </button>
          </div>
        )}
      </MobileShell>
    </ThemedView>
  );
}
