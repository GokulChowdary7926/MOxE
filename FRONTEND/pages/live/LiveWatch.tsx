import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { ThemedView, ThemedText } from '../../components/ui/Themed';
import { connectTranslateSocket, getTranslateSocket } from '../../services/translateSocket';
import { getApiBase, getToken } from '../../services/api';
import { connectLiveSocket, getLiveSocket, disconnectLiveSocket } from '../../services/socket';
import { useCurrentAccount } from '../../hooks/useAccountCapabilities';

const API_BASE = getApiBase();

type LiveDetail = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  account?: { id: string; username: string; displayName: string | null; profilePhoto: string | null };
};

type Language = { code: string; name: string };

export default function LiveWatch() {
  const { liveId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const currentAccount = useCurrentAccount() as { id?: string } | null;
  const isBroadcaster = (location.state as { broadcaster?: boolean })?.broadcaster === true;

  const [live, setLive] = useState<LiveDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [broadcasterStream, setBroadcasterStream] = useState<MediaStream | null>(null);
  const [ending, setEnding] = useState(false);
  const broadcasterVideoRef = useRef<HTMLVideoElement>(null);

  const [languages, setLanguages] = useState<Language[]>([]);
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('es');
  const [translationEnabled, setTranslationEnabled] = useState(false);
  const [subtitle, setSubtitle] = useState<{ text: string; original: string } | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [giftType, setGiftType] = useState('HEART');
  const [giftAmount, setGiftAmount] = useState(1);
  const [giftMessage, setGiftMessage] = useState('');
  const [badgeTier, setBadgeTier] = useState('BRONZE');
  const [badgeAmount, setBadgeAmount] = useState(1);
  const [sendingGift, setSendingGift] = useState(false);
  const [buyingBadge, setBuyingBadge] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    if (!liveId) return;
    setLoading(true);
    setError(null);
    const token = getToken();
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
    fetch(`${API_BASE}/live/${liveId}`, { headers })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data.error || 'Failed to load live');
        return data as LiveDetail;
      })
      .then((data) => setLive(data))
      .catch((e: any) => setError(e.message || 'Failed to load live'))
      .finally(() => setLoading(false));
  }, [liveId]);

  // Real-time live room: connect to /live namespace, start or join room, listener for viewer count and ended
  useEffect(() => {
    if (!liveId || !live) return;
    const accountId = currentAccount?.id;
    const ls = connectLiveSocket(accountId, (currentAccount as any)?.userId);
    const onViewerCount = (payload: { count?: number }) => setViewerCount(payload?.count ?? 0);
    const onEnded = () => {
      disconnectLiveSocket();
      navigate('/live', { replace: true });
    };
    ls.on('live:viewer-count', onViewerCount);
    ls.on('live:ended', onEnded);
    if (isBroadcaster) {
      ls.emit('live:start', { liveId });
    } else {
      ls.emit('live:join', { liveId });
    }
    return () => {
      ls.off('live:viewer-count', onViewerCount);
      ls.off('live:ended', onEnded);
      if (!isBroadcaster) {
        ls.emit('live:leave', { liveId });
      }
    };
  }, [liveId, live?.id, isBroadcaster, currentAccount?.id, navigate]);

  // Broadcaster: get camera stream and show preview
  useEffect(() => {
    if (!isBroadcaster || !liveId) return;
    let s: MediaStream | null = null;
    if (navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          s = stream;
          setBroadcasterStream(stream);
          if (broadcasterVideoRef.current) broadcasterVideoRef.current.srcObject = stream;
        })
        .catch(() => setError('Could not access camera'));
    }
    return () => {
      s?.getTracks().forEach((t) => t.stop());
      setBroadcasterStream(null);
    };
  }, [isBroadcaster, liveId]);

  useEffect(() => {
    if (broadcasterStream && broadcasterVideoRef.current) broadcasterVideoRef.current.srcObject = broadcasterStream;
  }, [broadcasterStream]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`${API_BASE}/translate/languages`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.languages)) {
          setLanguages(data.languages);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stop();
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const startTranslation = async () => {
    if (!live || !live.account) return;
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Not logged in');
      return;
    }
    try {
      setJoining(true);
      const res = await fetch(`${API_BASE}/translate/start`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          calleeId: live.account.id,
          sourceLang,
          targetLang,
          synthesizeSpeech: false,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to start translation');
      const sid = data.sessionId as string;
      setSessionId(sid);

      const socket = connectTranslateSocket(token);
      socket.emit('join', { sessionId: sid, role: 'caller' }, (err?: string | null) => {
        if (err) {
          setError(err || 'Failed to join translation session');
          return;
        }
        setTranslationEnabled(true);
        socket.on('translation', (payload: { text: string; original: string; isFinal: boolean }) => {
          if (!payload) return;
          setSubtitle({ text: payload.text, original: payload.original });
        });
      });

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      mediaStreamRef.current = stream;
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => {
        const s = getTranslateSocket();
        if (!s || !e.data || e.data.size === 0) return;
        e.data.arrayBuffer().then((buf) => {
          const b = new Uint8Array(buf);
          s.emit('audio', b);
        });
      };
      recorder.start(1000);
    } catch (e: any) {
      setError(e?.message || 'Failed to start translation');
    } finally {
      setJoining(false);
    }
  };

  const stopTranslation = () => {
    setTranslationEnabled(false);
    setSessionId(null);
    setSubtitle(null);
    mediaRecorderRef.current?.stop();
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
  };

  const sendGift = async () => {
    if (!liveId || !live) return;
    const token = localStorage.getItem('token');
    if (!token) {
      setLiveError('Sign in to send a gift');
      return;
    }
    setSendingGift(true);
    setLiveError(null);
    try {
      const res = await fetch(`${API_BASE}/live/${liveId}/gifts`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ giftType, amount: Number(giftAmount) || 1, message: giftMessage.trim() || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to send gift');
      setShowGiftModal(false);
      setGiftMessage('');
    } catch (e: any) {
      setLiveError(e.message || 'Failed to send gift');
    } finally {
      setSendingGift(false);
    }
  };

  const purchaseBadge = async () => {
    if (!liveId || !live) return;
    const token = localStorage.getItem('token');
    if (!token) {
      setLiveError('Sign in to buy a badge');
      return;
    }
    setBuyingBadge(true);
    setLiveError(null);
    try {
      const res = await fetch(`${API_BASE}/live/${liveId}/badges`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: badgeTier, amount: Number(badgeAmount) || 1 }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to purchase badge');
      setShowBadgeModal(false);
    } catch (e: any) {
      setLiveError(e.message || 'Failed to purchase badge');
    } finally {
      setBuyingBadge(false);
    }
  };

  return (
    <ThemedView className="min-h-screen flex flex-col pb-20">
      <header className="flex items-center justify-between px-4 py-3 border-b border-moxe-border">
        <Link to="/live" className="text-moxe-text text-2xl leading-none" aria-label="Back">
          ←
        </Link>
        <ThemedText className="font-semibold text-moxe-body">Live</ThemedText>
        <div className="w-6" />
      </header>

      <div className="flex-1 overflow-auto px-moxe-md py-moxe-md space-y-4 max-w-4xl mx-auto">
        {loading && <ThemedText secondary>Loading live…</ThemedText>}
        {error && !loading && <ThemedText className="text-moxe-danger text-sm">{error}</ThemedText>}

        {!loading && !error && live && (
          <>
            <div className="aspect-video bg-black rounded-moxe-lg overflow-hidden flex items-center justify-center relative">
              {isBroadcaster && broadcasterStream ? (
                <video
                  ref={broadcasterVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <ThemedText secondary className="text-moxe-caption">
                  Live video placeholder
                </ThemedText>
              )}
              <div className="absolute top-2 left-2 flex items-center gap-2 px-2 py-1 rounded-full bg-black/60 text-white text-sm">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                {viewerCount} watching
              </div>
              {subtitle && translationEnabled && (
                <div className="absolute inset-x-0 bottom-2 flex justify-center px-4">
                  <div className="bg-black/70 text-white text-sm px-3 py-1.5 rounded-full max-w-full truncate">
                    {subtitle.text}
                  </div>
                </div>
              )}
            </div>

            {isBroadcaster && live.status === 'LIVE' && (
              <button
                type="button"
                disabled={ending}
                onClick={async () => {
                  if (!liveId || ending) return;
                  const token = getToken();
                  if (!token) return;
                  setEnding(true);
                  try {
                    await fetch(`${API_BASE}/live/${liveId}/end`, {
                      method: 'PATCH',
                      headers: { Authorization: `Bearer ${token}` },
                    });
                    const ls = getLiveSocket();
                    if (ls) ls.emit('live:end', { liveId });
                    disconnectLiveSocket();
                    navigate('/live', { replace: true });
                  } catch {
                    setEnding(false);
                  }
                }}
                className="w-full py-3 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-semibold"
              >
                {ending ? 'Ending…' : 'End live'}
              </button>
            )}

            <div className="space-y-2">
              <ThemedText className="text-lg font-semibold text-moxe-body">{live.title}</ThemedText>
              {live.account && (
                <ThemedText secondary className="text-sm">
                  @{live.account.username}
                </ThemedText>
              )}
              {live.description && (
                <ThemedText secondary className="text-sm mt-1">
                  {live.description}
                </ThemedText>
              )}
            </div>

            {live.status === 'LIVE' && (
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setShowGiftModal(true)}
                  className="px-4 py-2 rounded-full bg-rose-500/90 text-white text-sm font-semibold"
                >
                  Send gift
                </button>
                <button
                  type="button"
                  onClick={() => setShowBadgeModal(true)}
                  className="px-4 py-2 rounded-full bg-amber-500/90 text-white text-sm font-semibold"
                >
                  Buy badge
                </button>
              </div>
            )}
            {liveError && (
              <p className="text-sm text-red-500 mb-2">{liveError}</p>
            )}
            <div className="mt-4 space-y-2">
              <ThemedText className="font-semibold text-moxe-body text-sm">
                Translation (beta)
              </ThemedText>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={sourceLang}
                  onChange={(e) => setSourceLang(e.target.value)}
                  className="border border-moxe-border rounded-moxe-md px-2 py-1 text-sm bg-moxe-surface text-moxe-body"
                >
                  {languages.map((l) => (
                    <option key={l.code} value={l.code}>
                      From: {l.name}
                    </option>
                  ))}
                </select>
                <select
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  className="border border-moxe-border rounded-moxe-md px-2 py-1 text-sm bg-moxe-surface text-moxe-body"
                >
                  {languages.map((l) => (
                    <option key={l.code} value={l.code}>
                      To: {l.name}
                    </option>
                  ))}
                </select>
                {!translationEnabled ? (
                  <button
                    type="button"
                    disabled={joining}
                    onClick={startTranslation}
                    className="px-3 py-1.5 rounded-full bg-moxe-primary text-white text-sm font-semibold disabled:opacity-60"
                  >
                    {joining ? 'Starting…' : 'Enable translation'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopTranslation}
                    className="px-3 py-1.5 rounded-full bg-moxe-border text-moxe-body text-sm font-semibold"
                  >
                    Disable translation
                  </button>
                )}
              </div>
              <ThemedText secondary className="text-xs">
                When enabled, your microphone audio is sent securely for transcription and translation. Subtitles
                appear over the live video.
              </ThemedText>
            </div>
          </>
        )}
      </div>

      {showGiftModal && live && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-800 dark:bg-slate-900 rounded-xl border border-slate-600 p-4 w-full max-w-sm space-y-3">
            <h3 className="font-semibold text-white">Send gift</h3>
            <div>
              <label className="block text-slate-300 text-sm mb-1">Type</label>
              <select value={giftType} onChange={(e) => setGiftType(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm">
                <option value="HEART">Heart</option>
                <option value="STAR">Star</option>
                <option value="CROWN">Crown</option>
                <option value="TROPHY">Trophy</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-300 text-sm mb-1">Amount</label>
              <input type="number" min={1} value={giftAmount} onChange={(e) => setGiftAmount(Number(e.target.value) || 1)} className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm" />
            </div>
            <div>
              <label className="block text-slate-300 text-sm mb-1">Message (optional)</label>
              <input type="text" value={giftMessage} onChange={(e) => setGiftMessage(e.target.value)} placeholder="Say something" className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm placeholder-slate-400" />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowGiftModal(false)} className="flex-1 py-2 rounded-lg border border-slate-600 text-slate-300 text-sm font-medium">Cancel</button>
              <button type="button" disabled={sendingGift} onClick={sendGift} className="flex-1 py-2 rounded-lg bg-rose-500 text-white text-sm font-semibold disabled:opacity-50">{sendingGift ? 'Sending…' : 'Send'}</button>
            </div>
          </div>
        </div>
      )}

      {showBadgeModal && live && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-800 dark:bg-slate-900 rounded-xl border border-slate-600 p-4 w-full max-w-sm space-y-3">
            <h3 className="font-semibold text-white">Buy badge</h3>
            <div>
              <label className="block text-slate-300 text-sm mb-1">Tier</label>
              <select value={badgeTier} onChange={(e) => setBadgeTier(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm">
                <option value="BRONZE">Bronze</option>
                <option value="SILVER">Silver</option>
                <option value="GOLD">Gold</option>
                <option value="PLATINUM">Platinum</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-300 text-sm mb-1">Amount</label>
              <input type="number" min={1} value={badgeAmount} onChange={(e) => setBadgeAmount(Number(e.target.value) || 1)} className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm" />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowBadgeModal(false)} className="flex-1 py-2 rounded-lg border border-slate-600 text-slate-300 text-sm font-medium">Cancel</button>
              <button type="button" disabled={buyingBadge} onClick={purchaseBadge} className="flex-1 py-2 rounded-lg bg-amber-500 text-white text-sm font-semibold disabled:opacity-50">{buyingBadge ? 'Buying…' : 'Buy'}</button>
            </div>
          </div>
        </div>
      )}
    </ThemedView>
  );
}

