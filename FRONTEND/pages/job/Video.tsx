import React, { useEffect, useRef, useState } from 'react';
import { PageContainer } from '../../components/layout/PageContainer';
import { SplitLayout } from '../../components/layout/SplitLayout';
import { FormCard, ListCard } from '../../components/layout/FormCard';
import { apiFetch, getApiBase, getToken } from '../../services/api';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { safeFirst } from '../../utils/safeAccess';

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

export default function Video() {
  const [videos, setVideos] = useState<JobVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

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

  const loadVideos = async () => {
    setError(null);
    setLoading(true);
    try {
      const data = (await apiFetch<JobVideo[]>('job/video')) ?? [];
      const list = Array.isArray(data) ? data : [];
      setVideos(list);
      const first = safeFirst(list);
      if (!selectedId && first) setSelectedId(first.id);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVideos();
  }, []);

  const startRecording = async () => {
    setRecordError(null);
    setRecordBlob(null);
    setRecordUrl(null);
    setRecordDuration(null);
    try {
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
        setRecordUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(blob);
        });
        if (startTimeRef.current) {
          setRecordDuration(Math.round((Date.now() - startTimeRef.current) / 1000));
        }
        setIsRecording(false);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (e: unknown) {
      setRecordError(e instanceof Error ? e.message : 'Failed to start screen recording. Allow screen capture.');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    try {
      const rec = mediaRecorderRef.current;
      if (rec && rec.state !== 'inactive') rec.stop();
    } catch (e: unknown) {
      setRecordError(e instanceof Error ? e.message : 'Failed to stop recording');
    }
  };

  const handleSaveRecording = async () => {
    if (!recordBlob) return;
    setSaving(true);
    setError(null);
    try {
      const form = new FormData();
      const fileName = newTitle?.trim() || `Recording-${new Date().toISOString()}.webm`;
      form.append('file', new File([recordBlob], fileName, { type: 'video/webm' }));
      const token = getToken();
      const base = getApiBase();
      const uploadRes = await fetch(`${base}/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      if (!uploadRes.ok) {
        const text = await uploadRes.text();
        throw new Error(text || 'Failed to upload video');
      }
      const uploadJson = await uploadRes.json();
      const url = uploadJson.url as string;
      if (!url) throw new Error('Upload did not return a URL');

      await apiFetch('job/video', {
        method: 'POST',
        body: {
          title: newTitle?.trim() || fileName,
          description: newDescription?.trim() || undefined,
          url,
          fileSize: recordBlob.size,
          durationSeconds: recordDuration ?? undefined,
          visibility: newVisibility,
        },
      });
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
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save recording');
    } finally {
      setSaving(false);
    }
  };

  const selected = selectedId ? videos.find((v) => v.id === selectedId) : null;

  if (loading) return <LoadingState message="Loading recordings…" />;
  if (error) return <ErrorState message={error} onRetry={loadVideos} />;

  return (
    <PageContainer
      title="MOxE VIDEO"
      description="Store screen recordings for bug reports, demos, and updates tied to your Job account."
    >
      <SplitLayout
        leftLabel="Screen Recorder"
        left={
          <FormCard>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Record your screen (and optional audio) directly from the browser. After stopping, you can preview and save to your MOxE library.
            </p>
            {recordError && (
              <p className="text-xs text-red-600 dark:text-red-400 mb-2">{recordError}</p>
            )}
            {!isRecording ? (
              <button
                type="button"
                onClick={startRecording}
                className="w-full py-4 bg-[#0052CC] text-white rounded-lg font-medium text-lg"
              >
                Start Recording
              </button>
            ) : (
              <button
                type="button"
                onClick={stopRecording}
                className="w-full py-4 bg-red-600 text-white rounded-lg font-medium text-lg animate-pulse"
              >
                ● Recording... Stop
              </button>
            )}
            {recordUrl && (
              <div className="mt-4 space-y-3">
                <video src={recordUrl} controls className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-black" />
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Title (e.g. Bug reproduction)"
                  className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                />
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Description (optional)"
                  rows={2}
                  className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                />
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-600 dark:text-slate-400">Visibility:</label>
                  <select
                    value={newVisibility}
                    onChange={(e) => setNewVisibility(e.target.value as 'private' | 'unlisted' | 'public')}
                    className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 px-3 py-2 text-sm"
                  >
                    <option value="private">Private</option>
                    <option value="unlisted">Unlisted</option>
                    <option value="public">Public</option>
                  </select>
                  {recordDuration != null && <span className="text-xs text-slate-500">~{recordDuration}s</span>}
                </div>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSaveRecording}
                  className="w-full py-3 bg-[#0052CC] text-white rounded-lg font-medium disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save to MOxE VIDEO'}
                </button>
              </div>
            )}
          </FormCard>
        }
        rightLabel="Library"
        right={
          videos.length === 0 ? (
            <ListCard empty>
              No recordings yet. Start a screen recording on the left and save it to see it here.
            </ListCard>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {videos.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedId(v.id)}
                  className={`w-full text-left p-4 rounded-lg transition-colors ${
                    selectedId === v.id
                      ? 'bg-[#0052CC] text-white'
                      : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <div className="font-medium truncate">{v.title}</div>
                  <div className="text-xs opacity-80 mt-1">
                    {new Date(v.createdAt).toLocaleDateString()}
                    {v.durationSeconds != null && ` • ${Math.round(v.durationSeconds)}s`}
                    {` • ${v.visibility}`}
                  </div>
                </button>
              ))}
            </div>
          )
        }
      />

      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <h3 className="font-semibold text-slate-800 dark:text-white">{selected.title}</h3>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <video src={selected.url} controls className="w-full rounded-lg bg-black" />
              {selected.description && (
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 whitespace-pre-line">
                  {selected.description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
