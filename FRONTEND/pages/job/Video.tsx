import React, { useEffect, useRef, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5007/api';

type JobVideo = {
  id: string;
  title: string;
  description?: string | null;
  url: string;
  fileSize: number;
  durationSeconds?: number | null;
  visibility: string;
  createdAt: string;
};

function useAuthHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export default function Video() {
  const [videos, setVideos] = useState<JobVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<JobVideo | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordError, setRecordError] = useState<string | null>(null);
  const [recordBlob, setRecordBlob] = useState<Blob | null>(null);
  const [recordUrl, setRecordUrl] = useState<string | null>(null);
  const [recordDuration, setRecordDuration] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newVisibility, setNewVisibility] = useState<'private' | 'unlisted' | 'public'>('private');
  const [saving, setSaving] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<BlobPart[]>([]);
  const startTimeRef = useRef<number | null>(null);

  const headers = useAuthHeaders();

  const loadVideos = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/job/video`, {
        headers,
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to load videos');
      }
      const data = (await res.json()) as JobVideo[];
      setVideos(data || []);
      if (!selected && data && data.length > 0) {
        setSelected(data[0]);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVideos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startRecording = async () => {
    setRecordError(null);
    setRecordBlob(null);
    setRecordUrl(null);
    setRecordDuration(null);
    try {
      // Capture screen with optional system audio
      const stream = await (navigator.mediaDevices as any).getDisplayMedia({
        video: true,
        audio: true,
      });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9,opus',
      });
      recordedChunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;
      startTimeRef.current = Date.now();

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((t: MediaStreamTrack) => t.stop());
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        setRecordBlob(blob);
        if (recordUrl) {
          URL.revokeObjectURL(recordUrl);
        }
        const url = URL.createObjectURL(blob);
        setRecordUrl(url);
        if (startTimeRef.current) {
          const secs = Math.round((Date.now() - startTimeRef.current) / 1000);
          setRecordDuration(secs);
        }
        setIsRecording(false);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (e: any) {
      setRecordError(e.message || 'Failed to start screen recording. Make sure screen capture is allowed.');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    try {
      const rec = mediaRecorderRef.current;
      if (rec && rec.state !== 'inactive') {
        rec.stop();
      }
    } catch (e: any) {
      setRecordError(e.message || 'Failed to stop recording');
    }
  };

  const handleSaveRecording = async () => {
    if (!recordBlob) return;
    setSaving(true);
    setError(null);
    try {
      // 1) Upload raw video file using existing /upload endpoint
      const form = new FormData();
      const fileName = newTitle?.trim() || `Recording-${new Date().toISOString()}.webm`;
      form.append('file', new File([recordBlob], fileName, { type: 'video/webm' }));
      const uploadRes = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        headers,
        body: form,
      } as any);
      if (!uploadRes.ok) {
        const text = await uploadRes.text();
        throw new Error(text || 'Failed to upload video');
      }
      const uploadJson = await uploadRes.json();
      const url = uploadJson.url as string;
      if (!url) throw new Error('Upload did not return a URL');

      // 2) Create Video record for Job account
      const createRes = await fetch(`${API_BASE}/job/video`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newTitle?.trim() || fileName,
          description: newDescription?.trim() || undefined,
          url,
          fileSize: recordBlob.size,
          durationSeconds: recordDuration ?? undefined,
          visibility: newVisibility,
        }),
      });
      if (!createRes.ok) {
        const text = await createRes.text();
        throw new Error(text || 'Failed to save video metadata');
      }
      setNewTitle('');
      setNewDescription('');
      setNewVisibility('private');
      setRecordBlob(null);
      if (recordUrl) {
        URL.revokeObjectURL(recordUrl);
        setRecordUrl(null);
      }
      setRecordDuration(null);
      await loadVideos();
    } catch (e: any) {
      setError(e.message || 'Failed to save recording');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="w-full lg:w-80 xl:w-96 space-y-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800 dark:text-white mb-1">
            MOxE VIDEO
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Capture screen recordings for bug reports, demos, and async updates tied to your Job
            account.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200 text-xs">
            {error}
          </div>
        )}

        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              Screen recorder
            </div>
            {recordError && (
              <span className="text-[11px] text-red-500 dark:text-red-300 truncate max-w-[160px]">
                {recordError}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Capture your screen (and optional audio) directly from the browser. After stopping, you
            can preview and save to your MOxE Job library.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isRecording}
              onClick={startRecording}
              className="inline-flex items-center justify-center px-3 py-1.5 rounded-md bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 disabled:opacity-50"
            >
              {isRecording ? 'Recording...' : 'Start recording'}
            </button>
            <button
              type="button"
              disabled={!isRecording}
              onClick={stopRecording}
              className="inline-flex items-center justify-center px-3 py-1.5 rounded-md bg-red-600 text-white text-xs font-medium hover:bg-red-700 disabled:opacity-50"
            >
              Stop
            </button>
          </div>

          {recordUrl && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Preview & save
              </div>
              <video
                src={recordUrl}
                controls
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-black"
              />
              <div className="space-y-2">
                <input
                  type="text"
                  className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs"
                  placeholder="Title (e.g. Horizon login bug reproduction)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
                <textarea
                  className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs"
                  placeholder="Description (optional)"
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                />
                <div className="flex items-center gap-2">
                  <label className="text-[11px] text-slate-600 dark:text-slate-300">
                    Visibility:
                  </label>
                  <select
                    className="flex-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-[11px]"
                    value={newVisibility}
                    onChange={(e) =>
                      setNewVisibility(
                        (e.target.value as 'private' | 'unlisted' | 'public') || 'private'
                      )
                    }
                  >
                    <option value="private">Private</option>
                    <option value="unlisted">Unlisted</option>
                    <option value="public">Public</option>
                  </select>
                  {recordDuration != null && (
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      ~{recordDuration}s
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSaveRecording}
                  className="w-full inline-flex items-center justify-center px-3 py-1.5 rounded-md bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save to MOxE VIDEO'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 min-w-0 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Library
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Your saved recordings for this Job account.
            </p>
          </div>
          {loading && (
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Loading...</span>
          )}
        </div>

        {!loading && videos.length === 0 && (
          <div className="text-sm text-slate-500 dark:text-slate-400">
            No recordings yet. Start a screen recording on the left and save it to see it here.
          </div>
        )}

        {!loading && videos.length > 0 && (
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="w-full lg:w-72 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 max-h-[420px] overflow-auto">
              <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200">
                Recordings
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-700 text-xs">
                {videos.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelected(v)}
                    className={`w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 ${
                      selected?.id === v.id
                        ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-200'
                        : 'text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div className="font-medium truncate">{v.title}</div>
                    <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="truncate">
                        {new Date(v.createdAt).toLocaleString()}
                      </span>
                      <span className="uppercase">{v.visibility}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {selected && (
              <div className="flex-1 min-w-0 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 space-y-3">
                <div>
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {selected.title}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    <span>{new Date(selected.createdAt).toLocaleString()}</span>
                    {selected.durationSeconds != null && (
                      <span>· {Math.round(selected.durationSeconds)}s</span>
                    )}
                    <span>
                      · {(selected.fileSize / (1024 * 1024)).toFixed(1)} MB · {selected.visibility}
                    </span>
                  </div>
                </div>
                {selected.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line">
                    {selected.description}
                  </p>
                )}
                <div className="w-full">
                  <video
                    src={selected.url}
                    controls
                    className="w-full max-h-[420px] rounded-lg border border-slate-200 dark:border-slate-700 bg-black"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

