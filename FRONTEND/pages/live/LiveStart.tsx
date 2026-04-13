import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ThemedView, ThemedText } from '../../components/ui/Themed';
import { getApiBase, getToken } from '../../services/api';
import { useCurrentAccount } from '../../hooks/useAccountCapabilities';

const API_BASE = getApiBase();

export default function LiveStart() {
  const navigate = useNavigate();
  const currentAccount = useCurrentAccount() as { id?: string } | null;
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [title, setTitle] = useState('Live');
  const [fundraiserTitle, setFundraiserTitle] = useState('');
  const [fundraiserUrl, setFundraiserUrl] = useState('');
  const [fundraiserGoal, setFundraiserGoal] = useState('');
  const [fundraiserCurrency, setFundraiserCurrency] = useState('USD');
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let s: MediaStream | null = null;
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera not supported in this browser.');
      return () => {};
    }
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((mediaStream) => {
        s = mediaStream;
        setStream(mediaStream);
        if (videoRef.current) videoRef.current.srcObject = mediaStream;
      })
      .catch((err) => setError(err?.message ?? 'Could not access camera or microphone.'));
    return () => {
      s?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  useEffect(() => {
    if (stream && videoRef.current) videoRef.current.srcObject = stream;
  }, [stream]);

  const handleStartLive = async () => {
    const token = getToken();
    const accountId = currentAccount?.id;
    if (!token || !accountId) {
      setError('Sign in to go live.');
      return;
    }
    setStarting(true);
    setError(null);
    try {
      const createBody: Record<string, unknown> = { title: title.trim() || 'Live' };
      if (fundraiserTitle.trim() || fundraiserUrl.trim() || fundraiserGoal.trim()) {
        createBody.fundraiserTitle = fundraiserTitle.trim() || null;
        createBody.fundraiserUrl = fundraiserUrl.trim() || null;
        createBody.fundraiserGoalAmount = fundraiserGoal.trim() === '' ? null : Number(fundraiserGoal);
        createBody.fundraiserCurrency = fundraiserCurrency.trim() || 'USD';
      }
      const createRes = await fetch(`${API_BASE}/live`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createBody),
      });
      const createData = await createRes.json().catch(() => ({}));
      if (!createRes.ok) throw new Error(createData.error || 'Failed to create live');
      const liveId = createData.id;
      if (!liveId) throw new Error('No live id returned');

      const startRes = await fetch(`${API_BASE}/live/${liveId}/start`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const startData = await startRes.json().catch(() => ({}));
      if (!startRes.ok) throw new Error(startData.error || 'Failed to start live');

      stream?.getTracks().forEach((t) => t.stop());
      setStream(null);
      navigate(`/live/${liveId}`, { state: { broadcaster: true }, replace: true });
    } catch (e: any) {
      setError(e?.message ?? 'Failed to start live');
    } finally {
      setStarting(false);
    }
  };

  return (
    <ThemedView className="min-h-screen flex flex-col pb-20">
      <header className="flex items-center justify-between px-4 py-3 border-b border-moxe-border">
        <Link to="/live" className="text-moxe-text text-2xl leading-none" aria-label="Back">
          ←
        </Link>
        <ThemedText className="font-semibold text-moxe-body">Go Live</ThemedText>
        <div className="w-6" />
      </header>

      <div className="flex-1 overflow-auto p-4 max-w-xl mx-auto w-full space-y-4">
        {error && (
          <div className="rounded-lg bg-red-500/20 border border-red-500/50 px-3 py-2">
            <ThemedText className="text-red-400 text-sm">{error}</ThemedText>
          </div>
        )}

        <div className="rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center relative">
          {stream ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            <ThemedText secondary className="text-moxe-caption">
              {error ? 'Camera error' : 'Requesting camera…'}
            </ThemedText>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-moxe-text mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Live"
            className="w-full px-3 py-2.5 rounded-lg bg-moxe-surface border border-moxe-border text-moxe-text placeholder-moxe-textSecondary text-sm"
          />
        </div>

        <div className="space-y-2 rounded-xl border border-moxe-border p-3">
          <ThemedText className="text-sm font-semibold text-moxe-body">Fundraiser (optional)</ThemedText>
          <input
            type="text"
            value={fundraiserTitle}
            onChange={(e) => setFundraiserTitle(e.target.value)}
            placeholder="Cause title"
            className="w-full px-3 py-2 rounded-lg bg-moxe-surface border border-moxe-border text-moxe-text text-sm"
          />
          <input
            type="url"
            value={fundraiserUrl}
            onChange={(e) => setFundraiserUrl(e.target.value)}
            placeholder="https://… donation or info link"
            className="w-full px-3 py-2 rounded-lg bg-moxe-surface border border-moxe-border text-moxe-text text-sm"
          />
          <div className="flex gap-2">
            <input
              type="number"
              min={0}
              step="0.01"
              value={fundraiserGoal}
              onChange={(e) => setFundraiserGoal(e.target.value)}
              placeholder="Goal amount"
              className="flex-1 px-3 py-2 rounded-lg bg-moxe-surface border border-moxe-border text-moxe-text text-sm"
            />
            <input
              type="text"
              value={fundraiserCurrency}
              onChange={(e) => setFundraiserCurrency(e.target.value)}
              placeholder="USD"
              className="w-20 px-3 py-2 rounded-lg bg-moxe-surface border border-moxe-border text-moxe-text text-sm"
            />
          </div>
        </div>

        <button
          type="button"
          disabled={!stream || starting}
          onClick={handleStartLive}
          className="w-full py-3 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:pointer-events-none text-white font-semibold text-base"
        >
          {starting ? 'Starting…' : 'Start live'}
        </button>
      </div>
    </ThemedView>
  );
}
