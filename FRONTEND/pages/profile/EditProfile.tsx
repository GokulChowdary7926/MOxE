import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, X, Camera, Image as ImageIcon } from 'lucide-react';
import { ThemedView, ThemedText } from '../../components/ui/Themed';
import { Avatar } from '../../components/ui/Avatar';
import { MobileShell } from '../../components/layout/MobileShell';
import { getApiBase, getToken, fetchApi } from '../../services/api';
import { useCamera } from '../../hooks/useCamera';

export default function EditProfile() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [pronouns, setPronouns] = useState('');
  const [bio, setBio] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [showThreadsBanner, setShowThreadsBanner] = useState(false);
  const [gender, setGender] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const { stream, error: cameraError, isActive, start, stop, capturePhoto } = useCamera({ video: true });
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (showCamera) {
      start();
      return () => stop();
    }
  }, [showCamera]);

  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream]);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    fetch(`${getApiBase()}/accounts/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const acc = data?.account ?? data;
        if (acc) {
          setName(acc.displayName ?? acc.name ?? '');
          setUsername(acc.username ?? '');
          setPronouns(acc.pronouns ?? '');
          setBio(acc.bio ?? '');
          setProfilePhoto(acc.profilePhoto ?? acc.avatarUrl ?? null);
          setShowThreadsBanner(!!acc.showThreadsBanner);
          setGender(acc.gender ?? '');
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function uploadAndSetProfilePhoto(file: File) {
    const token = getToken();
    if (!token) return;
    setUploadingPhoto(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const uploadRes = await fetch(`${getApiBase()}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const uploadData = await uploadRes.json().catch(() => ({}));
      if (!uploadRes.ok || !uploadData.url) {
        throw new Error(uploadData.error || 'Upload failed');
      }
      const res = await fetchApi('accounts/me', {
        method: 'PATCH',
        body: JSON.stringify({ profilePhoto: uploadData.url }),
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const acc = data?.account ?? data;
        if (acc?.profilePhoto) setProfilePhoto(acc.profilePhoto);
        setShowCamera(false);
        setShowPhotoOptions(false);
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleTakePhoto() {
    const blob = await capturePhoto();
    if (!blob) return;
    const file = new File([blob], `profile-${Date.now()}.png`, { type: 'image/png' });
    await uploadAndSetProfilePhoto(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) uploadAndSetProfilePhoto(file);
    setShowPhotoOptions(false);
  }

  async function handleSave() {
    const token = getToken();
    if (!token) return;
    setSaving(true);
    try {
      const res = await fetchApi('accounts/me', {
        method: 'PATCH',
        body: JSON.stringify({
          displayName: name,
          username: username.trim() || undefined,
          pronouns: pronouns.trim() || undefined,
          bio: bio.trim() || undefined,
          showThreadsBanner,
          gender: gender.trim() || undefined,
        }),
      });
      if (res.ok) navigate(-1);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <ThemedView className="min-h-screen flex items-center justify-center bg-black">
        <ThemedText secondary className="text-white">Loading…</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView className="min-h-screen flex flex-col bg-black">
      <MobileShell>
        <header className="flex items-center justify-between h-12 px-3 border-b border-[#262626] bg-black safe-area-pt">
          <Link to="/profile" className="flex items-center text-white p-2 -m-2" aria-label="Back">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <span className="text-white font-semibold text-base">Edit profile</span>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="text-[#0095f6] font-semibold text-sm px-2 py-1"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </header>

        <div className="flex-1 overflow-auto pb-20">
          {/* Profile picture + avatar */}
          <div className="flex items-center gap-6 px-4 py-6">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-[#262626] flex-shrink-0">
              <Avatar uri={profilePhoto} size={80} className="w-full h-full !rounded-full" />
            </div>
            <div className="w-20 h-20 rounded-full bg-[#262626] border border-[#363636] flex items-center justify-center flex-shrink-0 text-white/60">
              <span className="text-2xl">🐵</span>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => setShowPhotoOptions(true)}
            className="text-[#0095f6] font-semibold text-sm px-4 pb-4"
          >
            Edit picture or avatar
          </button>

          {/* Fields */}
          <div className="border-t border-[#262626]">
            {[
              { label: 'Name', value: name, onChange: setName, placeholder: 'Name' },
              { label: 'Username', value: username, onChange: setUsername, placeholder: 'Username' },
              { label: 'Pronouns', value: pronouns, onChange: setPronouns, placeholder: 'Pronouns' },
              { label: 'Bio', value: bio, onChange: setBio, placeholder: 'Bio', multiline: true },
            ].map(({ label, value, onChange, placeholder, multiline }) => (
              <div key={label} className="flex items-center justify-between px-4 py-3 border-b border-[#262626]">
                <span className="text-[#a8a8a8] text-sm w-20 flex-shrink-0">{label}</span>
                {multiline ? (
                  <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="flex-1 bg-transparent text-white text-sm text-right py-1 min-h-[60px] placeholder:text-[#737373] focus:outline-none"
                  />
                ) : (
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="flex-1 bg-transparent text-white text-sm text-right py-1 placeholder:text-[#737373] focus:outline-none"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-[#262626]">
            <Link
              to="/settings/account/links"
              className="flex items-center justify-between px-4 py-3 border-b border-[#262626]"
            >
              <span className="text-white text-sm">Links</span>
              <span className="text-[#a8a8a8] text-sm">Add links</span>
              <ChevronRight className="w-4 h-4 text-[#a8a8a8] ml-1" />
            </Link>
            <Link
              to="/profile/edit/banners"
              className="flex items-center justify-between px-4 py-3 border-b border-[#262626]"
            >
              <span className="text-white text-sm">Banners</span>
              <span className="text-[#a8a8a8] text-sm">2</span>
              <ChevronRight className="w-4 h-4 text-[#a8a8a8] ml-1" />
            </Link>
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#262626]">
              <span className="text-white text-sm">Music</span>
              <div className="flex items-center gap-2">
                <span className="text-[#a8a8a8] text-sm">The Script · Hall of Fame</span>
                <button type="button" className="text-white p-1" aria-label="Remove">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-[#262626] px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-white text-sm">Show Threads banner</span>
              <button
                type="button"
                role="switch"
                aria-checked={showThreadsBanner}
                onClick={() => setShowThreadsBanner((v) => !v)}
                className={`w-11 h-6 rounded-full transition-colors ${showThreadsBanner ? 'bg-[#0095f6]' : 'bg-[#363636]'}`}
              >
                <span
                  className={`block w-5 h-5 rounded-full bg-white shadow mt-0.5 transition-transform ${
                    showThreadsBanner ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="border-t border-[#262626]">
            <Link
              to="/profile/edit/gender"
              className="flex items-center justify-between px-4 py-3 border-b border-[#262626]"
            >
              <span className="text-white text-sm">Gender</span>
              <span className="text-[#a8a8a8] text-sm">{gender || 'Male'}</span>
              <ChevronRight className="w-4 h-4 text-[#a8a8a8] ml-1" />
            </Link>
          </div>

          <div className="px-4 py-6 space-y-3">
            <button type="button" className="block w-full text-left text-[#0095f6] font-semibold text-sm">
              Switch to professional account
            </button>
            <Link to="/settings/account" className="block text-[#0095f6] font-semibold text-sm">
              Personal information settings
            </Link>
            <button type="button" className="block w-full text-left text-[#0095f6] font-semibold text-sm">
              Show that your profile is verified
            </button>
          </div>
        </div>

        {/* Photo source options */}
        {showPhotoOptions && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-end justify-center safe-area-pb">
            <div className="w-full max-w-[428px] bg-[#262626] rounded-t-2xl p-4 pb-8">
              <ThemedText className="text-white font-semibold text-center mb-4">Change profile photo</ThemedText>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => { fileInputRef.current?.click(); setShowPhotoOptions(false); }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#363636] text-white"
                >
                  <ImageIcon className="w-6 h-6" />
                  <span>Upload from gallery</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setShowPhotoOptions(false); setShowCamera(true); }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#363636] text-white"
                >
                  <Camera className="w-6 h-6" />
                  <span>Take photo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPhotoOptions(false)}
                  className="px-4 py-3 text-[#a8a8a8] text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Camera capture for profile photo */}
        {showCamera && (
          <div className="fixed inset-0 z-50 flex flex-col bg-black">
            <div className="flex items-center justify-between px-4 py-3 safe-area-pt">
              <button type="button" onClick={() => { stop(); setShowCamera(false); }} className="text-white font-medium">
                Cancel
              </button>
              <span className="text-white font-semibold">Take profile photo</span>
              <div className="w-14" />
            </div>
            <div className="flex-1 relative min-h-0">
              {cameraError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                  <ThemedText className="text-red-400 text-center mb-2">{cameraError}</ThemedText>
                  <button type="button" onClick={() => start()} className="text-[#0095f6] text-sm font-semibold">Try again</button>
                </div>
              ) : (
                <>
                  {stream && (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}
                  {!stream && (
                    <div className="absolute inset-0 flex items-center justify-center text-[#737373] text-sm">Starting camera…</div>
                  )}
                </>
              )}
            </div>
            <div className="p-4 safe-area-pb bg-black/50">
              <button
                type="button"
                onClick={handleTakePhoto}
                disabled={!isActive || uploadingPhoto}
                className="w-16 h-16 rounded-full border-4 border-white bg-transparent mx-auto block disabled:opacity-50"
              >
                {uploadingPhoto ? <span className="text-white text-sm">…</span> : null}
              </button>
            </div>
          </div>
        )}
      </MobileShell>
    </ThemedView>
  );
}
