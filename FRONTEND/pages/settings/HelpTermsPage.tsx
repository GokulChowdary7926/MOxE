import React from 'react';
import { Link } from 'react-router-dom';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { ChevronRight } from 'lucide-react';

const POLICIES = [
  { label: 'Terms of use', path: '#' },
  { label: 'Privacy policy', path: '/settings/privacy-centre' },
  { label: 'Community guidelines', path: '#' },
];

export default function HelpTermsPage() {
  return (
    <SettingsPageShell title="Terms and policies" backTo="/settings/help">
      <div className="px-4 py-4">
        <p className="text-[#a8a8a8] text-sm mb-4">Read MOxE’s terms, privacy policy, and community standards.</p>
        <div className="space-y-0 border border-[#262626] rounded-xl overflow-hidden">
          {POLICIES.map((p) => (
            <Link
              key={p.label}
              to={p.path}
              className="flex items-center justify-between px-4 py-3 border-b border-[#262626] last:border-b-0 text-white active:bg-white/5"
            >
              <span className="font-medium text-sm">{p.label}</span>
              <ChevronRight className="w-5 h-5 text-[#737373]" />
            </Link>
          ))}
        </div>
      </div>
    </SettingsPageShell>
  );
}
