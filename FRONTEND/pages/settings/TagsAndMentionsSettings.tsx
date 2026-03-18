import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { SettingsPageShell, SettingsRadioSection, SettingsToggleRow } from '../../components/layout/SettingsPageShell';

const TAG_OPTIONS = [
  { label: 'Allow tags from everyone', value: 'everyone' },
  { label: 'Allow tags from people that you follow', value: 'following' },
  { label: "Don't allow tags", value: 'off' },
];
const MENTION_OPTIONS = [
  { label: 'Allow mentions from everyone', value: 'everyone' },
  { label: 'Allow mentions from people you follow', value: 'following' },
  { label: "Don't allow mentions", value: 'off' },
];

export default function TagsAndMentionsSettings() {
  const [whoTag, setWhoTag] = useState('everyone');
  const [manuallyApprove, setManuallyApprove] = useState(false);
  const [whoMention, setWhoMention] = useState('everyone');
  const [boostStories, setBoostStories] = useState(false);

  return (
    <SettingsPageShell title="Tags and mentions" backTo="/settings">
      <SettingsRadioSection
        name="who-can-tag"
        title="Who can tag you"
        value={whoTag}
        onChange={setWhoTag}
        options={TAG_OPTIONS}
        exampleText="Choose who can tag you in their photos and reels. When people try to tag you, they'll see if you don't allow tags from everyone. Potential spam will always be filtered."
      />
      <p className="text-[#a8a8a8] text-xs px-4 py-2">You currently have Limited interactions turned on, which means that some people can&apos;t tag or mention you.</p>

      <section className="border-b border-[#262626] py-3 px-4">
        <h2 className="text-white font-semibold mb-2">How you manage tags</h2>
        <SettingsToggleRow label="Manually approve tags" checked={manuallyApprove} onChange={setManuallyApprove} />
        <Link to="/settings/tags/review" className="flex items-center justify-between py-3 border-b border-[#262626] text-white active:bg-white/5">
          <span className="font-medium">Review tags</span>
          <ChevronRight className="w-5 h-5 text-[#737373]" />
        </Link>
      </section>

      <SettingsRadioSection
        name="who-can-mention"
        title="Who can @mention you"
        value={whoMention}
        onChange={setWhoMention}
        options={MENTION_OPTIONS}
        exampleText="Choose who can @mention you to link your account in their stories, notes, comments, live videos, bio and captions. When people try to @mention you, they'll see if you don't allow @mentions."
      />

      <SettingsToggleRow
        label="Allow people to boost stories that they mention you in"
        checked={boostStories}
        onChange={setBoostStories}
      />
    </SettingsPageShell>
  );
}
