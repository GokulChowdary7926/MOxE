import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ThemedView, ThemedText } from '../../components/ui/Themed';
import { connectTranslateSocket, getTranslateSocket } from '../../services/translateSocket';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5007/api';

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
  const [live, setLive] = useState<LiveDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [languages, setLanguages] = useState<Language[]>([]);
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('es');
  const [translationEnabled, setTranslationEnabled] = useState(false);
  const [subtitle, setSubtitle] = useState<{ text: string; original: string } | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    if (!liveId) return;
    setLoading(true);
    setError(null);
    fetch(`${API_BASE}/live/${liveId}`)
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data.error || 'Failed to load live');
        return data as LiveDetail;
      })
      .then((data) => setLive(data))
      .catch((e: any) => setError(e.message || 'Failed to load live'))
      .finally(() => setLoading(false));
  }, [liveId]);

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
              <ThemedText secondary className="text-moxe-caption">
                Live video placeholder
              </ThemedText>
              {subtitle && translationEnabled && (
                <div className="absolute inset-x-0 bottom-2 flex justify-center px-4">
                  <div className="bg-black/70 text-white text-sm px-3 py-1.5 rounded-full max-w-full truncate">
                    {subtitle.text}
                  </div>
                </div>
              )}
            </div>

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
    </ThemedView>
  );
}

