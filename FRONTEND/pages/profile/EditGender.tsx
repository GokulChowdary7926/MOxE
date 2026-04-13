import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { ThemedView } from '../../components/ui/Themed';
import { MobileShell } from '../../components/layout/MobileShell';
import { fetchApi } from '../../services/api';

const OPTIONS = ['Female', 'Male', 'Non-binary', 'Prefer not to say'];

export default function EditGender() {
  const navigate = useNavigate();
  const [gender, setGender] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchApi('accounts/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const acc = data?.account ?? data;
        if (acc?.gender) setGender(String(acc.gender));
      })
      .catch(() => {});
  }, []);

  async function save() {
    setSaving(true);
    try {
      await fetchApi('accounts/me', {
        method: 'PATCH',
        body: JSON.stringify({ gender }),
      });
      navigate('/profile/edit');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ThemedView className="min-h-screen flex flex-col bg-black">
      <MobileShell>
        <header className="flex items-center h-12 px-3 border-b border-[#262626] bg-black safe-area-pt">
          <button type="button" onClick={() => navigate(-1)} className="p-2 -m-2 text-white">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="flex-1 text-white font-semibold text-base text-center">Gender</span>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="text-[#0095f6] text-sm font-semibold disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Done'}
          </button>
        </header>
        <div className="flex-1 overflow-auto pb-20">
          {OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setGender(opt)}
              className="w-full flex items-center justify-between px-4 py-3 border-b border-[#262626] text-left"
            >
              <span className="text-white text-sm">{opt}</span>
              <span className={`w-4 h-4 rounded-full border ${gender === opt ? 'bg-[#0095f6] border-[#0095f6]' : 'border-[#737373]'}`} />
            </button>
          ))}
        </div>
      </MobileShell>
    </ThemedView>
  );
}
