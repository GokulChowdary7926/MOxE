import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { ThemedView, ThemedText } from '../../components/ui/Themed';
import { Avatar } from '../../components/ui/Avatar';
import { MobileShell } from '../../components/layout/MobileShell';
import { getApiBase, getToken, fetchApi } from '../../services/api';

export default function EditProfile() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [pronouns, setPronouns] = useState('');
  const [bio, setBio] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [showThreadsBanner, setShowThreadsBanner] = useState(false);
  const [gender, setGender] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
          <button
            type="button"
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
      </MobileShell>
    </ThemedView>
  );
}
