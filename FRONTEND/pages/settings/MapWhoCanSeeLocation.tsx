import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Star, User, Plane } from 'lucide-react';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';

type Option = 'friends' | 'close_friends' | 'only_these' | 'no_one';

export default function MapWhoCanSeeLocation() {
  const [value, setValue] = useState<Option>('no_one');

  const options: { value: Option; icon: React.ElementType; title: string; subtitle: string }[] = [
    { value: 'friends', icon: Users, title: 'Friends', subtitle: '216 followers that you follow back' },
    { value: 'close_friends', icon: Star, title: 'Close Friends', subtitle: '13 people >' },
    { value: 'only_these', icon: User, title: 'Only these friends', subtitle: 'Choose people >' },
    { value: 'no_one', icon: Plane, title: 'No one', subtitle: "Don't share location" },
  ];

  return (
    <SettingsPageShell title="Who can see your location" backTo="/settings/story-live-location">
      <div className="px-4 py-4">
        <p className="text-[#a8a8a8] text-sm mb-2">
          If you share, your precise location updates every time you open MOxE. It disappears if you don&apos;t open the app for 24 hours.{' '}
          <span className="text-[#0095f6]">Learn more</span>
        </p>
        <div className="space-y-0 divide-y divide-[#262626]">
          {options.map((opt) => {
            const Icon = opt.icon;
            return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setValue(opt.value)}
              className="flex items-center gap-3 w-full px-4 py-3 text-left active:bg-white/5"
            >
              <span className="w-10 h-10 rounded-full bg-[#262626] flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-[#a8a8a8]" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium">{opt.title}</p>
                <p className="text-[#a8a8a8] text-sm">{opt.subtitle}</p>
              </div>
              <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${value === opt.value ? 'border-white' : 'border-[#363636]'}`}>
                {value === opt.value && <span className="w-2.5 h-2.5 rounded-full bg-white" />}
              </span>
            </button>
          );})}
        </div>
        <button type="button" className="w-full py-3 rounded-lg bg-[#0095f6] text-white font-semibold mt-6">
          Done
        </button>
      </div>
    </SettingsPageShell>
  );
}
