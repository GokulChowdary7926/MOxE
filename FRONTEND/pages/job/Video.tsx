import React, { useEffect, useRef, useState } from 'react';
import { apiFetch, getToken, getUploadUrl } from '../../services/api';
import { JobPageContent, JobCard } from '../../components/job/JobPageContent';
import { JOB_MOBILE } from '../../components/job/jobMobileStyles';
import { JobBibleReferenceSection, JobToolBibleShell } from '../../components/job/bible';
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
      const uploadRes = await fetch(getUploadUrl(), {
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

  return (
    <JobPageContent variant="track" error={error}>
      <JobToolBibleShell toolTitle="MOxE VIDEO" toolIconMaterial="videocam">
      {error && (
        <button type="button" onClick={loadVideos} className={`${JOB_MOBILE.btnSecondary} w-full mb-4`}>
          Retry loading library
        </button>
      )}
      {loading && videos.length === 0 ? (
        <div className="py-12 text-center text-sm text-[#5E6C84] dark:text-[#8C9BAB]">Loading recordings…</div>
      ) : (
        <div className="flex flex-col gap-4">
          <JobCard variant="track">
            <p className="text-sm text-[#5E6C84] dark:text-[#8C9BAB] mb-4">
              Record your screen (and optional audio) directly from the browser. After stopping, you can preview and save to your MOxE library.
            </p>
            {recordError && <p className="text-xs text-[#BF2600] dark:text-red-300 mb-2">{recordError}</p>}
            {!isRecording ? (
              <button type="button" onClick={startRecording} className={JOB_MOBILE.btnPrimary}>
                Start recording
              </button>
            ) : (
              <button
                type="button"
                onClick={stopRecording}
                className="w-full min-h-[44px] px-4 py-3 rounded-xl bg-red-600 text-white font-semibold text-sm animate-pulse"
              >
                ● Recording… Stop
              </button>
            )}
            {recordUrl && (
              <div className="mt-4 space-y-3">
                <video src={recordUrl} controls className="w-full rounded-xl border border-[#DFE1E6] dark:border-[#2C333A] bg-black" />
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Title (e.g. Bug reproduction)"
                  className={JOB_MOBILE.input}
                />
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Description (optional)"
                  rows={2}
                  className={JOB_MOBILE.input}
                />
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-[#5E6C84] dark:text-[#8C9BAB]">Visibility</label>
                  <select
                    value={newVisibility}
                    onChange={(e) => setNewVisibility(e.target.value as 'private' | 'unlisted' | 'public')}
                    className={`flex-1 ${JOB_MOBILE.input}`}
                  >
                    <option value="private">Private</option>
                    <option value="unlisted">Unlisted</option>
                    <option value="public">Public</option>
                  </select>
                  {recordDuration != null && <span className="text-xs text-[#5E6C84]">~{recordDuration}s</span>}
                </div>
                <button type="button" disabled={saving} onClick={handleSaveRecording} className={JOB_MOBILE.btnPrimary}>
                  {saving ? 'Saving…' : 'Save to MOxE Video'}
                </button>
              </div>
            )}
          </JobCard>

          <JobCard variant="track">
            <p className={`${JOB_MOBILE.label} mb-2`}>Library</p>
            {videos.length === 0 ? (
              <p className="text-sm text-[#5E6C84] dark:text-[#8C9BAB]">
                No recordings yet. Record and save above to see items here.
              </p>
            ) : (
              <div className="space-y-2 max-h-[min(420px,50vh)] overflow-y-auto">
                {videos.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedId(v.id)}
                    className={`w-full text-left p-3 rounded-xl transition-colors border ${
                      selectedId === v.id
                        ? 'border-[#0052CC] dark:border-[#2684FF] bg-[#DEEBFF] dark:bg-[#1D2125]'
                        : 'border-[#DFE1E6] dark:border-[#2C333A] bg-[#F4F5F7] dark:bg-[#161A1D] hover:bg-white dark:hover:bg-[#1D2125]'
                    }`}
                  >
                    <div className="font-medium text-[#172B4D] dark:text-[#E6EDF3] truncate">{v.title}</div>
                    <div className="text-xs text-[#5E6C84] dark:text-[#8C9BAB] mt-1">
                      {new Date(v.createdAt).toLocaleDateString()}
                      {v.durationSeconds != null && ` • ${Math.round(v.durationSeconds)}s`}
                      {` • ${v.visibility}`}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </JobCard>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1D2125] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-auto border border-[#DFE1E6] dark:border-[#2C333A]">
            <div className="p-4 border-b border-[#DFE1E6] dark:border-[#2C333A] flex justify-between items-center">
              <h3 className="font-semibold text-[#172B4D] dark:text-[#E6EDF3]">{selected.title}</h3>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="p-2 hover:bg-[#F4F5F7] dark:hover:bg-[#2C333A] rounded-full text-[#5E6C84]"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <video src={selected.url} controls className="w-full rounded-lg bg-black" />
              {selected.description && (
                <p className="text-sm text-[#5E6C84] dark:text-[#8C9BAB] mt-2 whitespace-pre-line">{selected.description}</p>
              )}
            </div>
          </div>
        </div>
      )}

      <JobBibleReferenceSection toolKey="video" />
      </JobToolBibleShell>
    </JobPageContent>
  );
}
