import React from 'react';
import { Link } from 'react-router-dom';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { ChevronRight, CheckCircle, Circle } from 'lucide-react';

const STEPS = [
  { id: 'password', label: 'Strong password', done: true, to: '/settings/account-centre/password-security' },
  { id: '2fa', label: 'Two-factor authentication', done: false, to: '/settings/account-centre/two-factor' },
  { id: 'emails', label: 'Recent emails', done: true, to: '/settings/account-centre/recent-emails' },
  { id: 'sessions', label: 'Where you\'re logged in', done: true, to: '/settings/account-centre/where-logged-in' },
];

export default function SecurityCheckupPage() {
  return (
    <SettingsPageShell title="Security Checkup" backTo="/settings/account-centre">
      <div className="px-4 py-4">
        <p className="text-[#a8a8a8] text-sm mb-4">Follow these steps to help keep your account secure.</p>
        <div className="space-y-0 border border-[#262626] rounded-xl overflow-hidden">
          {STEPS.map((s) => (
            <Link
              key={s.id}
              to={s.to}
              className="flex items-center justify-between px-4 py-3 border-b border-[#262626] last:border-b-0 text-white active:bg-white/5"
            >
              <div className="flex items-center gap-3">
                {s.done ? (
                  <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-[#363636] flex-shrink-0" />
                )}
                <span className="font-medium text-sm">{s.label}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-[#737373]" />
            </Link>
          ))}
        </div>
      </div>
    </SettingsPageShell>
  );
}
