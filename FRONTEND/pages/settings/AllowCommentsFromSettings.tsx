import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';

const OPTIONS = [
  { label: 'Your followers', value: 'followers' },
  { label: 'Followers you follow back', value: 'follow_back' },
  { label: 'Off', value: 'off' },
];

export default function AllowCommentsFromSettings() {
  const { pathname } = useLocation();
  const isStories = pathname.includes('allow-from-stories');
  const [value, setValue] = useState('followers');
  const followersCount = 222;
  const followBackCount = 214;

  return (
    <SettingsPageShell
      title={isStories ? 'Allow story comments from' : 'Allow comments from'}
      backTo="/settings/comments"
    >
      <p className="text-[#a8a8a8] text-sm px-4 py-3">This setting will apply to all of your posts.</p>
      <section className="border-b border-[#262626] py-3 px-4">
        {OPTIONS.map((opt) => (
          <label key={opt.value} className="flex items-center justify-between py-3 cursor-pointer active:opacity-80">
            <div>
              <span className="text-white font-medium">{opt.label}</span>
              {opt.value === 'followers' && <p className="text-[#a8a8a8] text-sm">{followersCount} people</p>}
              {opt.value === 'follow_back' && <p className="text-[#a8a8a8] text-sm">{followBackCount} people</p>}
            </div>
            <input type="radio" name="allow-comments" checked={value === opt.value} onChange={() => setValue(opt.value)} className="sr-only" />
            <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${value === opt.value ? 'border-white' : 'border-[#363636]'}`}>
              {value === opt.value && <span className="w-2.5 h-2.5 rounded-full bg-white" />}
            </span>
          </label>
        ))}
      </section>
    </SettingsPageShell>
  );
}
