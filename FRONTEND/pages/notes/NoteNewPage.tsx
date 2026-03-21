import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { MapPin, Music, Share2 } from 'lucide-react';
import { createLinkNote, createMusicNote, createPollNote, createTextNote, createVideoNote, uploadNoteMedia } from '../../services/noteService';

function Row({ to, icon: Icon, label }: { to: string; icon: React.ElementType; label: string }) {
  return (
    <Link to={to} className="flex items-center gap-3 px-4 py-3 border-b border-[#262626] text-white active:bg-white/5">
      <Icon className="w-5 h-5 text-[#a8a8a8] flex-shrink-0" />
      <span className="flex-1 font-medium">{label}</span>
      <span className="text-[#737373]">›</span>
    </Link>
  );
}

export default function NoteNewPage() {
  const MAX_VIDEO_MB = 50;
  const MAX_VIDEO_SECONDS = 30;
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [kind, setKind] = useState<'TEXT' | 'POLL' | 'MUSIC' | 'VIDEO' | 'LINK'>('TEXT');
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [musicTrackName, setMusicTrackName] = useState('');
  const [musicArtist, setMusicArtist] = useState('');
  const [musicPreviewUrl, setMusicPreviewUrl] = useState('');
  const [musicArtworkFile, setMusicArtworkFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [linkDescription, setLinkDescription] = useState('');
  const [audienceType, setAudienceType] = useState<'mutual' | 'closeFriends'>('mutual');
  const [isScheduled, setIsScheduled] = useState(false);
  const [publishAt, setPublishAt] = useState('');
  const [posting, setPosting] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateVideoFile = async (file: File): Promise<void> => {
    const maxBytes = MAX_VIDEO_MB * 1024 * 1024;
    if (file.size > maxBytes) throw new Error(`Video is too large. Max ${MAX_VIDEO_MB}MB.`);
    const objectUrl = URL.createObjectURL(file);
    try {
      await new Promise<void>((resolve, reject) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
          const duration = Number(video.duration || 0);
          if (duration > MAX_VIDEO_SECONDS) reject(new Error(`Video is too long. Max ${MAX_VIDEO_SECONDS} seconds.`));
          else resolve();
        };
        video.onerror = () => reject(new Error('Unable to read selected video.'));
        video.src = objectUrl;
      });
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  };

  const canPost = (() => {
    if (kind === 'TEXT') return !!text.trim();
    if (kind === 'POLL') return !!pollQuestion.trim() && pollOptions.filter((o) => o.trim()).length >= 2;
    if (kind === 'MUSIC') return !!musicTrackName.trim() && !!musicArtist.trim();
    if (kind === 'VIDEO') return !!videoUrl.trim() || !!videoFile;
    if (kind === 'LINK') return !!linkUrl.trim();
    return false;
  })();

  const onPost = async () => {
    if (!canPost) return;
    setPosting(true);
    setError(null);
    try {
      const scheduleAt = isScheduled && publishAt ? new Date(publishAt).toISOString() : undefined;
      if (kind === 'TEXT') {
        await createTextNote({ text, audienceType, scheduleAt });
      } else if (kind === 'POLL') {
        await createPollNote({
          question: pollQuestion,
          options: pollOptions,
          audienceType,
          scheduleAt,
        });
      } else if (kind === 'MUSIC') {
        let albumArt = '';
        if (musicArtworkFile) {
          setUploadingMedia(true);
          albumArt = await uploadNoteMedia(musicArtworkFile);
          setUploadingMedia(false);
        }
        await createMusicNote({
          trackName: musicTrackName,
          artist: musicArtist,
          previewUrl: musicPreviewUrl,
          albumArt,
          audienceType,
          scheduleAt,
        });
      } else if (kind === 'VIDEO') {
        if (videoFile) await validateVideoFile(videoFile);
        let uploadedUrl = videoUrl;
        if (videoFile) {
          setUploadingMedia(true);
          uploadedUrl = await uploadNoteMedia(videoFile);
          setUploadingMedia(false);
        }
        await createVideoNote({ url: uploadedUrl, audienceType, scheduleAt });
      } else if (kind === 'LINK') {
        await createLinkNote({
          url: linkUrl,
          title: linkTitle,
          description: linkDescription,
          audienceType,
          scheduleAt,
        });
      }
      navigate('/notes');
    } catch (e: any) {
      setError(e?.message || 'Unable to create note.');
    } finally {
      setUploadingMedia(false);
      setPosting(false);
    }
  };

  return (
    <SettingsPageShell title="New note" backTo="/notes">
      <div className="px-4 py-4">
        <div className="mb-3 flex items-center gap-2 text-sm">
          <button
            type="button"
            className={`px-3 py-1.5 rounded-full border ${kind === 'TEXT' ? 'bg-[#0095f6] border-[#0095f6] text-white' : 'border-[#3a3a3a] text-[#a8a8a8]'}`}
            onClick={() => setKind('TEXT')}
          >
            Text
          </button>
          <button
            type="button"
            className={`px-3 py-1.5 rounded-full border ${kind === 'POLL' ? 'bg-[#0095f6] border-[#0095f6] text-white' : 'border-[#3a3a3a] text-[#a8a8a8]'}`}
            onClick={() => setKind('POLL')}
          >
            Poll
          </button>
          <button
            type="button"
            className={`px-3 py-1.5 rounded-full border ${kind === 'MUSIC' ? 'bg-[#0095f6] border-[#0095f6] text-white' : 'border-[#3a3a3a] text-[#a8a8a8]'}`}
            onClick={() => setKind('MUSIC')}
          >
            Music
          </button>
          <button
            type="button"
            className={`px-3 py-1.5 rounded-full border ${kind === 'VIDEO' ? 'bg-[#0095f6] border-[#0095f6] text-white' : 'border-[#3a3a3a] text-[#a8a8a8]'}`}
            onClick={() => setKind('VIDEO')}
          >
            Video
          </button>
          <button
            type="button"
            className={`px-3 py-1.5 rounded-full border ${kind === 'LINK' ? 'bg-[#0095f6] border-[#0095f6] text-white' : 'border-[#3a3a3a] text-[#a8a8a8]'}`}
            onClick={() => setKind('LINK')}
          >
            Link
          </button>
        </div>
        {kind === 'TEXT' ? (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Share what's on your mind..."
            className="w-full min-h-[120px] p-3 rounded-xl bg-[#262626] border border-[#363636] text-white placeholder:text-[#737373] resize-none text-sm"
          />
        ) : (
          kind === 'POLL' ? (
          <div className="space-y-2">
            <input
              value={pollQuestion}
              onChange={(e) => setPollQuestion(e.target.value)}
              placeholder="Poll question"
              className="w-full p-3 rounded-xl bg-[#262626] border border-[#363636] text-white placeholder:text-[#737373] text-sm"
            />
            {pollOptions.map((opt, idx) => (
              <input
                key={idx}
                value={opt}
                onChange={(e) => {
                  const copy = [...pollOptions];
                  copy[idx] = e.target.value;
                  setPollOptions(copy);
                }}
                placeholder={`Option ${idx + 1}`}
                className="w-full p-3 rounded-xl bg-[#262626] border border-[#363636] text-white placeholder:text-[#737373] text-sm"
              />
            ))}
          </div>
          ) : kind === 'MUSIC' ? (
            <div className="space-y-2">
              <input value={musicTrackName} onChange={(e) => setMusicTrackName(e.target.value)} placeholder="Track name" className="w-full p-3 rounded-xl bg-[#262626] border border-[#363636] text-white placeholder:text-[#737373] text-sm" />
              <input value={musicArtist} onChange={(e) => setMusicArtist(e.target.value)} placeholder="Artist" className="w-full p-3 rounded-xl bg-[#262626] border border-[#363636] text-white placeholder:text-[#737373] text-sm" />
              <input value={musicPreviewUrl} onChange={(e) => setMusicPreviewUrl(e.target.value)} placeholder="Preview URL (optional)" className="w-full p-3 rounded-xl bg-[#262626] border border-[#363636] text-white placeholder:text-[#737373] text-sm" />
              <label className="block text-xs text-[#a8a8a8]">
                Album artwork (optional)
                <input
                  type="file"
                  accept="image/*"
                  className="mt-1 block w-full text-xs"
                  onChange={(e) => setMusicArtworkFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>
          ) : kind === 'VIDEO' ? (
            <div className="space-y-2">
              <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="Video URL (or upload below)" className="w-full p-3 rounded-xl bg-[#262626] border border-[#363636] text-white placeholder:text-[#737373] text-sm" />
              <label className="block text-xs text-[#a8a8a8]">
                Upload video
                <input
                  type="file"
                  accept="video/*"
                  className="mt-1 block w-full text-xs"
                  onChange={async (e) => {
                    const file = e.target.files?.[0] ?? null;
                    if (!file) {
                      setVideoFile(null);
                      return;
                    }
                    try {
                      await validateVideoFile(file);
                      setVideoFile(file);
                      setError(null);
                    } catch (err: any) {
                      setVideoFile(null);
                      setError(err?.message || 'Invalid video file.');
                    }
                  }}
                />
              </label>
            </div>
          ) : (
            <div className="space-y-2">
              <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="Link URL" className="w-full p-3 rounded-xl bg-[#262626] border border-[#363636] text-white placeholder:text-[#737373] text-sm" />
              <input value={linkTitle} onChange={(e) => setLinkTitle(e.target.value)} placeholder="Title (optional)" className="w-full p-3 rounded-xl bg-[#262626] border border-[#363636] text-white placeholder:text-[#737373] text-sm" />
              <input value={linkDescription} onChange={(e) => setLinkDescription(e.target.value)} placeholder="Description (optional)" className="w-full p-3 rounded-xl bg-[#262626] border border-[#363636] text-white placeholder:text-[#737373] text-sm" />
            </div>
          )
        )}
        <div className="mt-3 flex items-center gap-3 text-sm">
          <button
            type="button"
            onClick={() => setAudienceType('mutual')}
            className={`px-3 py-1.5 rounded-full border ${audienceType === 'mutual' ? 'bg-[#0095f6] border-[#0095f6] text-white' : 'border-[#3a3a3a] text-[#a8a8a8]'}`}
          >
            Mutual
          </button>
          <button
            type="button"
            onClick={() => setAudienceType('closeFriends')}
            className={`px-3 py-1.5 rounded-full border ${audienceType === 'closeFriends' ? 'bg-[#0095f6] border-[#0095f6] text-white' : 'border-[#3a3a3a] text-[#a8a8a8]'}`}
          >
            Close friends
          </button>
          <button
            type="button"
            onClick={onPost}
            disabled={posting || !canPost}
            className="ml-auto px-4 py-1.5 rounded-full bg-[#0095f6] text-white font-semibold disabled:opacity-50"
          >
            {uploadingMedia ? 'Uploading…' : posting ? 'Posting…' : 'Post'}
          </button>
        </div>
        <div className="mt-3 flex items-center gap-3 text-xs">
          <label className="text-[#a8a8a8] flex items-center gap-2">
            <input type="checkbox" checked={isScheduled} onChange={(e) => setIsScheduled(e.target.checked)} />
            Schedule note
          </label>
          {isScheduled && (
            <input
              type="datetime-local"
              value={publishAt}
              onChange={(e) => setPublishAt(e.target.value)}
              className="bg-[#262626] border border-[#363636] text-white rounded-lg px-2 py-1"
            />
          )}
        </div>
        {error && <p className="text-[#ff6b6b] text-xs mt-2">{error}</p>}
        <p className="text-[#737373] text-xs font-semibold px-0 pt-6 pb-2">Options</p>
        <div className="border-t border-[#262626]">
          <Row to="/notes/new/location" icon={MapPin} label="Location" />
          <Row to="/notes/new/song" icon={Music} label="Song selection and edit" />
          <Row to="/notes/new/share" icon={Share2} label="Share with" />
        </div>
      </div>
    </SettingsPageShell>
  );
}
