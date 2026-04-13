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
  recording?: string | null;
  fundraiserTitle?: string | null;
  fundraiserUrl?: string | null;
  fundraiserGoalAmount?: number | null;
  fundraiserCurrency?: string | null;
  account?: { id: string; username: string; displayName: string | null; profilePhoto: string | null };
};

type LiveQuestionRow = {
  id: string;
  liveId: string;
  text: string;
  pinned: boolean;
  answered: boolean;
  createdAt: string;
  asker: { id: string; username: string; displayName: string | null; profilePhoto: string | null };
};

type LiveModeratorRow = {
  id: string;
  moderatorId: string;
  moderator: { id: string; username: string; displayName: string | null; profilePhoto: string | null };
};

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

type Language = { code: string; name: string };

export default function LiveWatch() {
  const { liveId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const currentAccount = useCurrentAccount() as { id?: string; username?: string } | null;
  const isBroadcaster = (location.state as { broadcaster?: boolean })?.broadcaster === true;

  const [live, setLive] = useState<LiveDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [broadcasterStream, setBroadcasterStream] = useState<MediaStream | null>(null);
  const [ending, setEnding] = useState(false);
  const broadcasterVideoRef = useRef<HTMLVideoElement>(null);
  const broadcasterStreamRef = useRef<MediaStream | null>(null);
  const viewerVideoRef = useRef<HTMLVideoElement>(null);
  const [viewerRemoteStream, setViewerRemoteStream] = useState<MediaStream | null>(null);
  const broadcasterPeersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const pendingViewerSocketsRef = useRef<Set<string>>(new Set());
  const viewerPcRef = useRef<RTCPeerConnection | null>(null);
  const [rtcHint, setRtcHint] = useState<string | null>(null);

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

  const [liveQuestions, setLiveQuestions] = useState<LiveQuestionRow[]>([]);
  const [liveModerators, setLiveModerators] = useState<LiveModeratorRow[]>([]);
  const [questionDraft, setQuestionDraft] = useState('');
  const [postingQuestion, setPostingQuestion] = useState(false);
  const [modUsernameInput, setModUsernameInput] = useState('');
  const [modSaving, setModSaving] = useState(false);
  const [fundTitle, setFundTitle] = useState('');
  const [fundUrl, setFundUrl] = useState('');
  const [fundGoal, setFundGoal] = useState('');
  const [fundCurrency, setFundCurrency] = useState('USD');
  const [fundSaving, setFundSaving] = useState(false);
  /** Optional VOD URL saved when ending live (https or /uploads/… from your storage pipeline). */
  const [replayRecordingUrl, setReplayRecordingUrl] = useState('');

  const sortQuestions = (list: LiveQuestionRow[]) =>
    [...list].sort(
      (a, b) =>
        Number(b.pinned) - Number(a.pinned) || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

  useEffect(() => {
    if (!live) return;
    setFundTitle(live.fundraiserTitle ?? '');
    setFundUrl(live.fundraiserUrl ?? '');
    setFundGoal(live.fundraiserGoalAmount != null ? String(live.fundraiserGoalAmount) : '');
    setFundCurrency(live.fundraiserCurrency ?? 'USD');
  }, [
    live?.id,
    live?.fundraiserTitle,
    live?.fundraiserUrl,
    live?.fundraiserGoalAmount,
    live?.fundraiserCurrency,
  ]);

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

  useEffect(() => {
    if (!liveId || !live || live.status !== 'LIVE') return;
    const token = getToken();
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
    fetch(`${API_BASE}/live/${liveId}/questions`, { headers })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) return;
        setLiveQuestions(sortQuestions((data as { questions?: LiveQuestionRow[] }).questions ?? []));
      })
      .catch(() => {});
    fetch(`${API_BASE}/live/${liveId}/moderators`, { headers })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) return;
        setLiveModerators((data as { moderators?: LiveModeratorRow[] }).moderators ?? []);
      })
      .catch(() => {});
  }, [liveId, live?.id, live?.status]);

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
    const onQuestion = (payload: { question?: LiveQuestionRow }) => {
      if (!payload?.question) return;
      setLiveQuestions((prev) => {
        if (prev.some((x) => x.id === payload.question!.id)) return prev;
        return sortQuestions([...prev, payload.question!]);
      });
    };
    const onQuestionUpdated = (payload: { question?: LiveQuestionRow }) => {
      if (!payload?.question) return;
      setLiveQuestions((prev) => {
        const q = payload.question!;
        const others = prev.filter((x) => x.id !== q.id);
        return sortQuestions([...others, q]);
      });
    };
    const onMods = (payload: { moderators?: LiveModeratorRow[] }) => {
      if (payload?.moderators) setLiveModerators(payload.moderators);
    };
    ls.on('live:viewer-count', onViewerCount);
    ls.on('live:ended', onEnded);
    ls.on('live:question', onQuestion);
    ls.on('live:question:updated', onQuestionUpdated);
    ls.on('live:moderators', onMods);
    if (isBroadcaster) {
      ls.emit('live:start', { liveId });
    } else {
      ls.emit('live:join', { liveId });
    }
    return () => {
      ls.off('live:viewer-count', onViewerCount);
      ls.off('live:ended', onEnded);
      ls.off('live:question', onQuestion);
      ls.off('live:question:updated', onQuestionUpdated);
      ls.off('live:moderators', onMods);
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
    broadcasterStreamRef.current = broadcasterStream;
  }, [broadcasterStream]);

  useEffect(() => {
    if (broadcasterStream && broadcasterVideoRef.current) broadcasterVideoRef.current.srcObject = broadcasterStream;
  }, [broadcasterStream]);

  useEffect(() => {
    if (viewerRemoteStream && viewerVideoRef.current) viewerVideoRef.current.srcObject = viewerRemoteStream;
  }, [viewerRemoteStream]);

  /** Broadcaster: flush viewers who connected before camera + WebRTC socket were ready */
  useEffect(() => {
    if (!isBroadcaster || !liveId || !broadcasterStream) return;
    const ls = connectLiveSocket(currentAccount?.id, (currentAccount as { userId?: string } | null)?.userId);
    const flush = () => {
      const sock = getLiveSocket();
      if (!sock?.connected || !broadcasterStreamRef.current) return;
      const stream = broadcasterStreamRef.current;
      const pending = [...pendingViewerSocketsRef.current];
      pendingViewerSocketsRef.current.clear();
      const seen = new Set<string>();
      for (const viewerSocketId of pending) {
        if (seen.has(viewerSocketId)) continue;
        seen.add(viewerSocketId);
        void createBroadcasterOfferForViewer(liveId, viewerSocketId, stream, sock);
      }
    };
    if (ls.connected) flush();
    else ls.once('connect', flush);
    return () => {
      ls.off('connect', flush);
    };
  }, [isBroadcaster, liveId, broadcasterStream, currentAccount]);

  async function createBroadcasterOfferForViewer(
    roomLiveId: string,
    viewerSocketId: string,
    stream: MediaStream,
    ls: ReturnType<typeof getLiveSocket>,
  ) {
    if (!ls) return;
    const existing = broadcasterPeersRef.current.get(viewerSocketId);
    if (existing) {
      existing.close();
      broadcasterPeersRef.current.delete(viewerSocketId);
    }
    const pc = new RTCPeerConnection(ICE_SERVERS);
    broadcasterPeersRef.current.set(viewerSocketId, pc);
    try {
      for (const track of stream.getTracks()) {
        pc.addTrack(track, stream);
      }
      pc.onicecandidate = (ev) => {
        if (ev.candidate && ls.connected) {
          ls.emit('live:webrtc-ice', {
            liveId: roomLiveId,
            toSocketId: viewerSocketId,
            candidate: ev.candidate.toJSON(),
          });
        }
      };
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          pc.close();
          broadcasterPeersRef.current.delete(viewerSocketId);
        }
      };
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      const loc = pc.localDescription;
      if (!loc) return;
      ls.emit('live:webrtc-offer', { liveId: roomLiveId, viewerSocketId, sdp: { type: loc.type, sdp: loc.sdp } });
    } catch {
      pc.close();
      broadcasterPeersRef.current.delete(viewerSocketId);
      setRtcHint('WebRTC setup failed for a viewer.');
    }
  }

  /** Broadcaster: listen for viewer WebRTC requests and answers / ICE */
  useEffect(() => {
    if (!isBroadcaster || !liveId) return;
    const ls = connectLiveSocket(currentAccount?.id, (currentAccount as { userId?: string } | null)?.userId);

    const onRequest = async (payload: { liveId?: string; viewerSocketId?: string }) => {
      if (payload?.liveId !== liveId || !payload.viewerSocketId) return;
      const stream = broadcasterStreamRef.current;
      if (!stream) {
        pendingViewerSocketsRef.current.add(payload.viewerSocketId);
        return;
      }
      await createBroadcasterOfferForViewer(liveId, payload.viewerSocketId, stream, ls);
    };

    const onAnswer = async (payload: { liveId?: string; viewerSocketId?: string; sdp?: RTCSessionDescriptionInit }) => {
      if (payload?.liveId !== liveId || !payload.viewerSocketId || !payload.sdp) return;
      const pc = broadcasterPeersRef.current.get(payload.viewerSocketId);
      if (!pc) return;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
      } catch {
        // ignore
      }
    };

    const onIce = async (payload: {
      liveId?: string;
      viewerSocketId?: string;
      candidate?: RTCIceCandidateInit;
    }) => {
      if (payload?.liveId !== liveId || !payload.viewerSocketId || payload.candidate == null) return;
      const pc = broadcasterPeersRef.current.get(payload.viewerSocketId);
      if (!pc) return;
      try {
        await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
      } catch {
        // ignore
      }
    };

    ls.on('live:webrtc-request', onRequest);
    ls.on('live:webrtc-answer', onAnswer);
    ls.on('live:webrtc-ice', onIce);

    return () => {
      ls.off('live:webrtc-request', onRequest);
      ls.off('live:webrtc-answer', onAnswer);
      ls.off('live:webrtc-ice', onIce);
      for (const p of broadcasterPeersRef.current.values()) {
        p.close();
      }
      broadcasterPeersRef.current.clear();
      pendingViewerSocketsRef.current.clear();
    };
  }, [isBroadcaster, liveId, currentAccount]);

  /** Viewer: request stream, handle offer / answer / ICE */
  useEffect(() => {
    if (isBroadcaster || !liveId || !live || live.status !== 'LIVE') return;
    const ls = connectLiveSocket(currentAccount?.id, (currentAccount as { userId?: string } | null)?.userId);
    setRtcHint('Connecting to host…');
    setViewerRemoteStream(null);

    const cleanupPc = () => {
      if (viewerPcRef.current) {
        viewerPcRef.current.close();
        viewerPcRef.current = null;
      }
    };

    const attachRemote = (ev: RTCTrackEvent) => {
      const [stream] = ev.streams;
      if (stream) {
        setViewerRemoteStream(stream);
        setRtcHint(null);
      }
    };

    const onOffer = async (payload: { liveId?: string; sdp?: RTCSessionDescriptionInit }) => {
      if (payload?.liveId !== liveId || !payload.sdp) return;
      cleanupPc();
      const pc = new RTCPeerConnection(ICE_SERVERS);
      viewerPcRef.current = pc;
      pc.ontrack = attachRemote;
      pc.onicecandidate = (ev) => {
        if (ev.candidate && ls.connected) {
          ls.emit('live:webrtc-ice', { liveId, candidate: ev.candidate.toJSON() });
        }
      };
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'failed') {
          setRtcHint('Connection failed. Try refreshing.');
        }
      };
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        const loc = pc.localDescription;
        if (loc) ls.emit('live:webrtc-answer', { liveId, sdp: { type: loc.type, sdp: loc.sdp } });
      } catch {
        setRtcHint('Could not play live video.');
        cleanupPc();
      }
    };

    const onIce = async (payload: { liveId?: string; candidate?: RTCIceCandidateInit }) => {
      if (payload?.liveId !== liveId || payload.candidate == null) return;
      const pc = viewerPcRef.current;
      if (!pc) return;
      try {
        await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
      } catch {
        // ignore
      }
    };

    ls.on('live:webrtc-offer', onOffer);
    ls.on('live:webrtc-ice', onIce);

    const t = window.setTimeout(() => {
      if (ls.connected) ls.emit('live:webrtc-request', { liveId });
    }, 400);

    return () => {
      window.clearTimeout(t);
      ls.off('live:webrtc-offer', onOffer);
      ls.off('live:webrtc-ice', onIce);
      cleanupPc();
    };
  }, [isBroadcaster, liveId, live?.id, live?.status, currentAccount]);

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

  const postLiveQuestion = async () => {
    if (!liveId || !questionDraft.trim()) return;
    const token = getToken();
    if (!token) {
      setLiveError('Sign in to ask a question');
      return;
    }
    setPostingQuestion(true);
    setLiveError(null);
    try {
      const res = await fetch(`${API_BASE}/live/${liveId}/questions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: questionDraft.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to post question');
      setQuestionDraft('');
    } catch (e: any) {
      setLiveError(e.message || 'Failed to post question');
    } finally {
      setPostingQuestion(false);
    }
  };

  const patchQuestionPin = async (questionId: string, pinned: boolean) => {
    if (!liveId) return;
    const token = getToken();
    if (!token) return;
    setLiveError(null);
    try {
      const res = await fetch(`${API_BASE}/live/${liveId}/questions/${questionId}/pin`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinned }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to update question');
    } catch (e: any) {
      setLiveError(e.message || 'Failed to update question');
    }
  };

  const patchQuestionAnswered = async (questionId: string, answered: boolean) => {
    if (!liveId) return;
    const token = getToken();
    if (!token) return;
    setLiveError(null);
    try {
      const res = await fetch(`${API_BASE}/live/${liveId}/questions/${questionId}/answered`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ answered }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to update question');
    } catch (e: any) {
      setLiveError(e.message || 'Failed to update question');
    }
  };

  const addModeratorByUsername = async () => {
    if (!liveId || !modUsernameInput.trim()) return;
    const token = getToken();
    if (!token) return;
    setModSaving(true);
    setLiveError(null);
    try {
      const res = await fetch(`${API_BASE}/live/${liveId}/moderators`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: modUsernameInput.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to add moderator');
      setModUsernameInput('');
    } catch (e: any) {
      setLiveError(e.message || 'Failed to add moderator');
    } finally {
      setModSaving(false);
    }
  };

  const removeModerator = async (moderatorId: string) => {
    if (!liveId) return;
    const token = getToken();
    if (!token) return;
    setLiveError(null);
    try {
      const res = await fetch(`${API_BASE}/live/${liveId}/moderators/${moderatorId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to remove moderator');
    } catch (e: any) {
      setLiveError(e.message || 'Failed to remove moderator');
    }
  };

  const saveFundraiser = async () => {
    if (!liveId) return;
    const token = getToken();
    if (!token) return;
    setFundSaving(true);
    setLiveError(null);
    try {
      const res = await fetch(`${API_BASE}/live/${liveId}/fundraiser`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fundraiserTitle: fundTitle.trim() || null,
          fundraiserUrl: fundUrl.trim() || null,
          fundraiserGoalAmount: fundGoal.trim() === '' ? null : Number(fundGoal),
          fundraiserCurrency: fundCurrency.trim() || 'USD',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to save fundraiser');
      setLive(data as LiveDetail);
    } catch (e: any) {
      setLiveError(e.message || 'Failed to save fundraiser');
    } finally {
      setFundSaving(false);
    }
  };

  const isLiveHost = !!(live && currentAccount?.id && live.account?.id === currentAccount.id);
  const isLiveMod = !!(currentAccount?.id && liveModerators.some((m) => m.moderator.id === currentAccount.id));
  const canModerateQa = isLiveHost || isLiveMod;

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
              {live.status === 'SCHEDULED' ? (
                <ThemedText secondary className="text-moxe-caption px-4 text-center">
                  This live is scheduled and hasn&apos;t started yet.
                </ThemedText>
              ) : live.status === 'ENDED' ? (
                <div className="px-4 text-center space-y-3">
                  <ThemedText secondary className="text-moxe-caption block">
                    This broadcast has ended.
                  </ThemedText>
                  {live.recording ? (
                    <Link
                      to={`/live/replay/${live.id}`}
                      className="inline-block text-moxe-primary font-semibold text-sm underline"
                    >
                      Watch replay
                    </Link>
                  ) : (
                    <ThemedText secondary className="text-xs block">
                      No recording is available for replay.
                    </ThemedText>
                  )}
                </div>
              ) : live.status === 'LIVE' && isBroadcaster && broadcasterStream ? (
                <video
                  ref={broadcasterVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              ) : live.status === 'LIVE' && isBroadcaster ? (
                <ThemedText secondary className="text-moxe-caption">
                  Starting camera…
                </ThemedText>
              ) : live.status === 'LIVE' && viewerRemoteStream ? (
                <video ref={viewerVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
              ) : live.status === 'LIVE' ? (
                <div className="px-4 text-center">
                  <ThemedText secondary className="text-moxe-caption block">
                    {rtcHint || 'Connecting to host…'}
                  </ThemedText>
                </div>
              ) : (
                <ThemedText secondary className="text-moxe-caption">
                  Stream unavailable.
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
              <div className="space-y-2">
                <label className="block">
                  <ThemedText secondary className="text-xs mb-1 block">
                    Replay video URL (optional) — paste an https link or <code className="text-moxe-caption">/uploads/…</code> path after upload so viewers can watch a replay.
                  </ThemedText>
                  <input
                    type="url"
                    value={replayRecordingUrl}
                    onChange={(e) => setReplayRecordingUrl(e.target.value)}
                    placeholder="https://… or /uploads/your-video.webm"
                    className="w-full rounded-moxe-md border border-moxe-border bg-moxe-surface px-3 py-2 text-sm text-moxe-text placeholder:text-moxe-textSecondary"
                    autoComplete="off"
                  />
                </label>
                <button
                  type="button"
                  disabled={ending}
                  onClick={async () => {
                    if (!liveId || ending) return;
                    const token = getToken();
                    if (!token) return;
                    setEnding(true);
                    try {
                      const body: { recording?: string } = {};
                      const r = replayRecordingUrl.trim();
                      if (r) body.recording = r;
                      await fetch(`${API_BASE}/live/${liveId}/end`, {
                        method: 'PATCH',
                        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify(body),
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
              </div>
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

            {!!(live.fundraiserTitle || live.fundraiserUrl || live.fundraiserGoalAmount != null) && (
              <div className="rounded-moxe-lg border border-moxe-border p-3 bg-moxe-surface/50 space-y-1 mb-3">
                {live.fundraiserTitle && (
                  <ThemedText className="font-semibold text-moxe-body text-sm">{live.fundraiserTitle}</ThemedText>
                )}
                {live.fundraiserGoalAmount != null && (
                  <ThemedText secondary className="text-xs">
                    Goal: {live.fundraiserCurrency || 'USD'} {live.fundraiserGoalAmount.toLocaleString()}
                  </ThemedText>
                )}
                {live.fundraiserUrl && (
                  <a
                    href={live.fundraiserUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-moxe-primary text-sm font-semibold"
                  >
                    Support this fundraiser
                  </a>
                )}
              </div>
            )}

            {live.status === 'LIVE' && isLiveHost && (
              <div className="rounded-moxe-lg border border-moxe-border p-3 space-y-2 mb-3">
                <ThemedText className="text-sm font-semibold text-moxe-body">Fundraiser (host)</ThemedText>
                <input
                  type="text"
                  value={fundTitle}
                  onChange={(e) => setFundTitle(e.target.value)}
                  placeholder="Title"
                  className="w-full border border-moxe-border rounded-moxe-md px-2 py-1.5 text-sm bg-moxe-surface text-moxe-body"
                />
                <input
                  type="url"
                  value={fundUrl}
                  onChange={(e) => setFundUrl(e.target.value)}
                  placeholder="https://…"
                  className="w-full border border-moxe-border rounded-moxe-md px-2 py-1.5 text-sm bg-moxe-surface text-moxe-body"
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={fundGoal}
                    onChange={(e) => setFundGoal(e.target.value)}
                    placeholder="Goal amount"
                    className="flex-1 border border-moxe-border rounded-moxe-md px-2 py-1.5 text-sm bg-moxe-surface text-moxe-body"
                  />
                  <input
                    type="text"
                    value={fundCurrency}
                    onChange={(e) => setFundCurrency(e.target.value)}
                    placeholder="USD"
                    className="w-20 border border-moxe-border rounded-moxe-md px-2 py-1.5 text-sm bg-moxe-surface text-moxe-body"
                  />
                </div>
                <button
                  type="button"
                  disabled={fundSaving}
                  onClick={saveFundraiser}
                  className="px-3 py-1.5 rounded-moxe-md bg-moxe-primary text-white text-xs font-semibold disabled:opacity-50"
                >
                  {fundSaving ? 'Saving…' : 'Save fundraiser'}
                </button>
              </div>
            )}

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

            {live.status === 'LIVE' && (
              <div className="mt-4 rounded-moxe-lg border border-moxe-border p-3 space-y-3 bg-moxe-surface/40">
                <ThemedText className="font-semibold text-moxe-body text-sm">Live questions</ThemedText>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    value={questionDraft}
                    onChange={(e) => setQuestionDraft(e.target.value)}
                    maxLength={500}
                    placeholder="Ask the host a question…"
                    className="flex-1 border border-moxe-border rounded-moxe-md px-3 py-2 text-sm bg-moxe-surface text-moxe-body"
                  />
                  <button
                    type="button"
                    disabled={postingQuestion}
                    onClick={postLiveQuestion}
                    className="px-4 py-2 rounded-moxe-md bg-moxe-primary text-white text-sm font-semibold disabled:opacity-50"
                  >
                    {postingQuestion ? 'Sending…' : 'Ask'}
                  </button>
                </div>
                {isLiveHost && (
                  <div className="pt-2 border-t border-moxe-border space-y-2">
                    <ThemedText secondary className="text-xs font-semibold uppercase tracking-wide">
                      Moderators
                    </ThemedText>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <input
                        type="text"
                        value={modUsernameInput}
                        onChange={(e) => setModUsernameInput(e.target.value)}
                        placeholder="Username (without @)"
                        className="flex-1 border border-moxe-border rounded-moxe-md px-3 py-2 text-sm bg-moxe-surface text-moxe-body"
                      />
                      <button
                        type="button"
                        disabled={modSaving}
                        onClick={addModeratorByUsername}
                        className="px-4 py-2 rounded-moxe-md border border-moxe-border text-moxe-body text-sm font-semibold disabled:opacity-50"
                      >
                        {modSaving ? 'Adding…' : 'Add moderator'}
                      </button>
                    </div>
                    {liveModerators.length > 0 && (
                      <ul className="text-sm space-y-1">
                        {liveModerators.map((m) => (
                          <li key={m.id} className="flex items-center justify-between gap-2">
                            <span className="text-moxe-textSecondary">
                              @{m.moderator.username}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeModerator(m.moderator.id)}
                              className="text-xs text-red-500 font-medium"
                            >
                              Remove
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
                <ul className="max-h-56 overflow-y-auto space-y-2 text-sm">
                  {liveQuestions.length === 0 ? (
                    <ThemedText secondary className="text-xs">No questions yet.</ThemedText>
                  ) : (
                    liveQuestions.map((q) => (
                      <li
                        key={q.id}
                        className={`rounded-moxe-md border px-2 py-1.5 ${q.pinned ? 'border-moxe-primary/60 bg-moxe-primary/5' : 'border-moxe-border'}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-moxe-textSecondary text-xs">@{q.asker.username}</span>
                            {q.answered && (
                              <span className="ml-2 text-xs text-green-600 dark:text-green-400">Answered</span>
                            )}
                            {q.pinned && (
                              <span className="ml-2 text-xs text-moxe-primary font-semibold">Pinned</span>
                            )}
                            <p className="text-moxe-body mt-0.5">{q.text}</p>
                          </div>
                          {canModerateQa && (
                            <div className="flex flex-col gap-1 flex-shrink-0">
                              <button
                                type="button"
                                className="text-xs text-moxe-primary font-medium"
                                onClick={() => patchQuestionPin(q.id, !q.pinned)}
                              >
                                {q.pinned ? 'Unpin' : 'Pin'}
                              </button>
                              <button
                                type="button"
                                className="text-xs text-moxe-textSecondary font-medium"
                                onClick={() => patchQuestionAnswered(q.id, !q.answered)}
                              >
                                {q.answered ? 'Mark open' : 'Answered'}
                              </button>
                            </div>
                          )}
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              </div>
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
                <option value="DIAMOND">Diamond</option>
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

