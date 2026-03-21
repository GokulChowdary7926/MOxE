import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { ChevronLeft, Plus } from 'lucide-react';
import { ThemedView } from '../../components/ui/Themed';
import { MobileShell } from '../../components/layout/MobileShell';
import { Avatar } from '../../components/ui/Avatar';
import { deleteNote, getMyNote, getNoteAnalytics, getNotes, likeNote, votePoll, type NoteItem } from '../../services/noteService';
import { getSocket } from '../../services/socket';
import { ensureAbsoluteMediaUrl } from '../../utils/mediaUtils';

export default function NotesPage() {
  const currentAccount = useSelector((s: RootState) => s.account.currentAccount) as { id?: string; username?: string; profilePhoto?: string | null } | null;
  const username = currentAccount?.username ?? '';
  const [loading, setLoading] = useState(true);
  const [myNote, setMyNote] = useState<NoteItem | null>(null);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [myAnalytics, setMyAnalytics] = useState<any | null>(null);
  const [votedPollById, setVotedPollById] = useState<Record<string, string>>({});

  const timeLeft = (iso: string) => {
    const ms = new Date(iso).getTime() - Date.now();
    if (ms <= 0) return 'expiring';
    const h = Math.floor(ms / (60 * 60 * 1000));
    const m = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
    return `${h}h ${m}m left`;
  };

  const loadNotes = async () => {
    const [mine, all] = await Promise.all([getMyNote(), getNotes()]);
    setMyNote(mine.note);
    setNotes(all);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [mine, all] = await Promise.all([getMyNote(), getNotes()]);
        if (!mounted) return;
        setMyNote(mine.note);
        setNotes(all);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onCreated = () => { loadNotes().catch(() => {}); };
    const onDeleted = () => { loadNotes().catch(() => {}); };
    const onRefresh = () => { loadNotes().catch(() => {}); };
    socket.on('note:created', onCreated);
    socket.on('note:deleted', onDeleted);
    socket.on('note:refresh', onRefresh);
    return () => {
      socket.off('note:created', onCreated);
      socket.off('note:deleted', onDeleted);
      socket.off('note:refresh', onRefresh);
    };
  }, []);

  const otherNotes = useMemo(
    () => notes.filter((n) => n.accountId !== currentAccount?.id),
    [notes, currentAccount?.id],
  );

  const onDeleteMine = async () => {
    if (!myNote) return;
    await deleteNote(myNote.id);
    setMyNote(null);
    setNotes((prev) => prev.filter((n) => n.id !== myNote.id));
  };

  const onLike = async (noteId: string) => {
    await likeNote(noteId);
    setNotes((prev) =>
      prev.map((n) =>
        n.id === noteId ? { ...n, likes: [...(n.likes ?? []), { accountId: currentAccount?.id ?? '' }] } : n,
      ),
    );
  };

  const onVotePoll = async (noteId: string, option: string) => {
    if (votedPollById[noteId]) return;
    await votePoll(noteId, option);
    setVotedPollById((prev) => ({ ...prev, [noteId]: option }));
    setNotes((prev) =>
      prev.map((n) =>
        n.id === noteId
          ? {
              ...n,
              pollVotes: [...(n.pollVotes ?? []), { accountId: currentAccount?.id ?? '', option }],
            }
          : n,
      ),
    );
  };

  const onLoadMyAnalytics = async () => {
    if (!myNote) return;
    const data = await getNoteAnalytics(myNote.id);
    setMyAnalytics(data);
  };

  return (
    <ThemedView className="min-h-screen flex flex-col bg-black">
      <MobileShell>
        <header className="sticky top-0 z-10 flex items-center justify-between h-12 px-3 border-b border-[#262626] bg-black safe-area-pt">
          <Link to="/messages" className="flex items-center gap-1 text-white font-medium active:opacity-70" aria-label="Back">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <span className="absolute left-1/2 -translate-x-1/2 text-white font-semibold">MOxE Notes</span>
          <div className="w-10" />
        </header>
        <div className="flex-1 overflow-auto p-4 pb-20">
          <p className="text-[#a8a8a8] text-sm mb-4">Share quick updates in MOxE. Notes disappear automatically.</p>
          <div className="flex flex-col items-center py-8">
            <div className="relative w-20 h-20 rounded-full border-2 border-[#262626] bg-[#262626] flex items-center justify-center mb-4 overflow-hidden">
              <Avatar uri={currentAccount?.profilePhoto} size={80} className="w-full h-full" />
              <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-[#0095f6] flex items-center justify-center text-white text-sm border-2 border-black">
                <Plus className="w-3 h-3" />
              </span>
            </div>
            <p className="text-white font-medium">{username}</p>
            <p className="text-[#a8a8a8] text-sm mt-1">Your MOxE note</p>
            <Link to="/notes/new" className="mt-6 py-2.5 px-4 rounded-lg bg-[#0095f6] text-white font-semibold text-sm">Create MOxE note</Link>
            {myNote && (
              <div className="mt-5 w-full bg-[#171717] border border-[#2a2a2a] rounded-xl p-3">
                <p className="text-xs text-[#a8a8a8] mb-1">Your active note</p>
                {myNote.type === 'POLL' ? (
                  <>
                    <p className="text-white text-sm">{String((myNote.contentJson as any)?.poll?.question ?? '')}</p>
                    <div className="mt-2 space-y-1">
                      {(((myNote.contentJson as any)?.poll?.options ?? []) as string[]).map((opt) => (
                        <div key={opt} className="text-xs text-[#cfcfcf]">- {opt}</div>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    {myNote.type === 'MUSIC' && (
                      <div className="space-y-2">
                        <p className="text-white text-sm">
                          {String((myNote.contentJson as any)?.music?.trackName ?? '')} - {String((myNote.contentJson as any)?.music?.artist ?? '')}
                        </p>
                        {((myNote.contentJson as any)?.music?.albumArt as string | undefined) && (
                          <img
                            src={ensureAbsoluteMediaUrl((myNote.contentJson as any)?.music?.albumArt)}
                            alt="Album art"
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        )}
                        {((myNote.contentJson as any)?.music?.previewUrl as string | undefined) && (
                          <audio controls className="w-full" src={ensureAbsoluteMediaUrl((myNote.contentJson as any)?.music?.previewUrl)} />
                        )}
                      </div>
                    )}
                    {myNote.type === 'VIDEO' && (
                      <video
                        controls
                        className="w-full rounded-lg max-h-[320px] object-cover"
                        src={ensureAbsoluteMediaUrl(String((myNote.contentJson as any)?.video?.url ?? ''))}
                      />
                    )}
                    {myNote.type === 'LINK' && (
                      <a className="text-[#7db7ff] text-sm" href={String((myNote.contentJson as any)?.link?.url ?? '')} target="_blank" rel="noreferrer">
                        {String((myNote.contentJson as any)?.link?.preview?.title ?? (myNote.contentJson as any)?.link?.url ?? '')}
                      </a>
                    )}
                    {myNote.type === 'TEXT' && <p className="text-white text-sm">{String(myNote.contentJson?.text ?? '')}</p>}
                  </>
                )}
                <p className="text-[11px] text-[#8a8a8a] mt-2">{timeLeft(myNote.expiresAt)}</p>
                <div className="mt-3 flex items-center gap-4">
                  <button type="button" onClick={onDeleteMine} className="text-xs text-[#ff8a8a]">
                    Delete note
                  </button>
                  <button type="button" onClick={onLoadMyAnalytics} className="text-xs text-[#0095f6]">
                    View analytics
                  </button>
                </div>
                {myAnalytics && (
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[#a8a8a8]">
                    <div>Impressions: <span className="text-white">{myAnalytics.impressions}</span></div>
                    <div>Likes: <span className="text-white">{myAnalytics.likes}</span></div>
                    <div>Replies: <span className="text-white">{myAnalytics.replies}</span></div>
                    <div>Engagement: <span className="text-white">{myAnalytics.engagementRate}%</span></div>
                  </div>
                )}
              </div>
            )}
          </div>
          {!loading && otherNotes.length > 0 && (
            <div className="space-y-2">
              {otherNotes.slice(0, 20).map((n) => (
                <div key={n.id} className="bg-[#151515] border border-[#262626] rounded-xl p-3">
                  <p className="text-xs text-[#a8a8a8]">@{n.account?.username ?? 'user'}</p>
                  {n.type === 'POLL' ? (
                    <>
                      <p className="text-sm text-white mt-1">{String((n.contentJson as any)?.poll?.question ?? '')}</p>
                      <div className="mt-2 space-y-1">
                        {((((n.contentJson as any)?.poll?.options ?? []) as string[]).slice(0, 4)).map((opt) => {
                          const votesFor = (n.pollVotes ?? []).filter((v) => v.option === opt).length;
                          const total = (n.pollVotes ?? []).length || 1;
                          const pct = Math.round((votesFor / total) * 100);
                          const votedOption = votedPollById[n.id];
                          const isSelected = votedOption === opt;
                          return (
                            <button
                              key={opt}
                              type="button"
                              disabled={!!votedOption}
                              className={`block w-full text-left text-xs rounded px-2 py-1 ${
                                isSelected ? 'text-white bg-[#1e4f82]' : 'text-[#cfcfcf] bg-[#222]'
                              } disabled:opacity-70`}
                              onClick={() => onVotePoll(n.id, opt)}
                            >
                              {opt} ({votesFor}, {pct}%)
                            </button>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <>
                      {n.type === 'MUSIC' && (
                        <div className="mt-1 space-y-2">
                          <p className="text-sm text-white">
                            {String((n.contentJson as any)?.music?.trackName ?? '')} - {String((n.contentJson as any)?.music?.artist ?? '')}
                          </p>
                          {((n.contentJson as any)?.music?.albumArt as string | undefined) && (
                            <img
                              src={ensureAbsoluteMediaUrl((n.contentJson as any)?.music?.albumArt)}
                              alt="Album art"
                              className="w-14 h-14 rounded-lg object-cover"
                            />
                          )}
                          {((n.contentJson as any)?.music?.previewUrl as string | undefined) && (
                            <audio controls className="w-full" src={ensureAbsoluteMediaUrl((n.contentJson as any)?.music?.previewUrl)} />
                          )}
                        </div>
                      )}
                      {n.type === 'VIDEO' && (
                        <video
                          controls
                          className="w-full rounded-lg max-h-[280px] object-cover mt-1"
                          src={ensureAbsoluteMediaUrl(String((n.contentJson as any)?.video?.url ?? ''))}
                        />
                      )}
                      {n.type === 'LINK' && (
                        <a className="text-[#7db7ff] text-sm mt-1 block" href={String((n.contentJson as any)?.link?.url ?? '')} target="_blank" rel="noreferrer">
                          {String((n.contentJson as any)?.link?.preview?.title ?? (n.contentJson as any)?.link?.url ?? '')}
                        </a>
                      )}
                      {n.type === 'TEXT' && <p className="text-sm text-white mt-1">{String(n.contentJson?.text ?? '')}</p>}
                      <div className="flex items-center justify-between mt-2">
                        <button type="button" className="text-xs text-[#0095f6]" onClick={() => onLike(n.id)}>
                          Like ({n.likes?.length ?? 0})
                        </button>
                        <span className="text-[11px] text-[#8a8a8a]">{timeLeft(n.expiresAt)}</span>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </MobileShell>
    </ThemedView>
  );
}
