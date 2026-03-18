import React from 'react';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { Settings, BarChart3 } from 'lucide-react';

export default function TeenAccountSettings() {
  return (
    <SettingsPageShell title="Supervision for Teen Accounts" backTo="/settings">
      <div className="px-4 py-6 flex flex-col items-center">
        <div className="w-40 h-32 rounded-2xl bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 flex items-center justify-center mb-6">
          <span className="text-white/90 text-4xl">👫</span>
        </div>
        <h2 className="text-white font-bold text-xl text-center mb-3">Supervision for Teen Accounts</h2>
        <p className="text-[#a8a8a8] text-sm text-center mb-6">
          Invite your teen to partner with you on supervising their MOxE experience.
        </p>
        <div className="space-y-4 w-full mb-6">
          <div className="flex gap-3 items-start">
            <Settings className="w-5 h-5 text-[#a8a8a8] flex-shrink-0 mt-0.5" />
            <p className="text-[#a8a8a8] text-sm">
              Teens aged 13-17 automatically get Teen Accounts with built-in protections. Teens under 16 need approval from a supervising parent or guardian for changes.
            </p>
          </div>
          <div className="flex gap-3 items-start">
            <BarChart3 className="w-5 h-5 text-[#a8a8a8] flex-shrink-0 mt-0.5" />
            <p className="text-[#a8a8a8] text-sm">
              With supervision, parents can set time limits, see insights into how their teen uses MOxE and help manage their safety settings.
            </p>
          </div>
        </div>
        <button type="button" className="w-full py-3 rounded-lg bg-[#0095f6] text-white font-semibold">Get started</button>
        <button type="button" className="text-[#0095f6] text-sm font-medium mt-4">Learn more</button>
      </div>
    </SettingsPageShell>
  );
}
