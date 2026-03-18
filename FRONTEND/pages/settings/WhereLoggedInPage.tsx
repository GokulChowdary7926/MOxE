import React from 'react';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { Smartphone, Monitor } from 'lucide-react';

const MOCK_SESSIONS = [
  { id: '1', device: 'iPhone 15', location: 'Current session', icon: Smartphone, current: true },
  { id: '2', device: 'Chrome on Mac', location: 'San Francisco, CA', icon: Monitor, current: false },
];

export default function WhereLoggedInPage() {
  return (
    <SettingsPageShell title="Where you're logged in" backTo="/settings/account-centre">
      <div className="px-4 py-4">
        <p className="text-[#a8a8a8] text-sm mb-4">You’re logged in to MOxE on these devices. Log out any you don’t recognise.</p>
        <div className="space-y-0 border border-[#262626] rounded-xl overflow-hidden">
          {MOCK_SESSIONS.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between px-4 py-3 border-b border-[#262626] last:border-b-0 bg-[#0a0a0a]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#262626] flex items-center justify-center">
                  <s.icon className="w-5 h-5 text-[#a8a8a8]" />
                </div>
                <div>
                  <p className="text-white font-medium text-sm">{s.device}</p>
                  <p className="text-[#737373] text-xs">{s.location}{s.current ? ' · Current session' : ''}</p>
                </div>
              </div>
              {!s.current && (
                <button type="button" className="text-[#ed4956] text-sm font-semibold">Log out</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </SettingsPageShell>
  );
}
