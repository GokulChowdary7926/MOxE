import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';

const OPTIONS = [
  { label: 'Some interactions', value: 'some' },
  { label: 'Most interactions', value: 'most' },
];

export default function LimitInteractionWhatPage() {
  const [value, setValue] = useState('most');

  return (
    <SettingsPageShell title="What to limit" backTo="/settings/limit-interactions" right={<Link to="/settings/limit-interactions" className="text-[#0095f6] font-semibold text-sm">Done</Link>}>
      <div className="px-4 py-4">
        <section className="border-b border-[#262626] py-3">
          <label className="flex items-start justify-between gap-3 py-2 cursor-pointer">
            <div>
              <p className="text-white font-medium">Some interactions</p>
              <p className="text-[#a8a8a8] text-sm mt-0.5">New comments on your content and chats from accounts that you limit will be hidden.</p>
            </div>
            <input type="radio" name="what" checked={value === 'some'} onChange={() => setValue('some')} className="sr-only" />
            <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${value === 'some' ? 'border-white' : 'border-[#363636]'}`}>
              {value === 'some' && <span className="w-2.5 h-2.5 rounded-full bg-white" />}
            </span>
          </label>
          <label className="flex items-start justify-between gap-3 py-2 cursor-pointer">
            <div>
              <p className="text-white font-medium">Most interactions</p>
              <p className="text-[#a8a8a8] text-sm mt-0.5">Tags, mentions, story replies and content remixing will be turned off. New comments on your content and chats will also be hidden.</p>
            </div>
            <input type="radio" name="what" checked={value === 'most'} onChange={() => setValue('most')} className="sr-only" />
            <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${value === 'most' ? 'border-white' : 'border-[#363636]'}`}>
              {value === 'most' && <span className="w-2.5 h-2.5 rounded-full bg-white" />}
            </span>
          </label>
        </section>
      </div>
    </SettingsPageShell>
  );
}
