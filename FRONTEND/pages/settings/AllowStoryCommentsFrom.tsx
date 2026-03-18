import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { SettingsPageShell, SettingsRadioSection } from '../../components/layout/SettingsPageShell';

const CONTROLS_OPTIONS = [
  { label: 'Your followers', value: 'followers' },
  { label: 'Followers you follow back', value: 'follow_back' },
  { label: 'Off', value: 'off' },
];

export default function AllowStoryCommentsFrom() {
  const [who, setWho] = useState('followers');
  const blockCount = 0;

  return (
    <SettingsPageShell title="Allow story comments from" backTo="/settings/story">
      <Link to="/settings/story/block-comments-from" className="flex items-center justify-between px-4 py-3 border-b border-[#262626] text-white active:bg-white/5">
        <span className="font-medium">Block comments from</span>
        <span className="text-[#a8a8a8] flex items-center">{blockCount} people<ChevronRight className="w-5 h-5 ml-1" /></span>
      </Link>
      <SettingsRadioSection
        name="controls"
        title="Controls"
        value={who}
        onChange={setWho}
        options={CONTROLS_OPTIONS}
      />
    </SettingsPageShell>
  );
}
