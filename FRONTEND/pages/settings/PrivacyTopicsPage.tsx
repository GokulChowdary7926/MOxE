import React from 'react';
import { Link } from 'react-router-dom';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { ChevronRight } from 'lucide-react';

const TOPICS = [
  { id: 'data', title: 'How we use your data' },
  { id: 'ads', title: 'Ads and data' },
  { id: 'sharing', title: 'Sharing with others' },
  { id: 'security', title: 'Security and storage' },
];

export default function PrivacyTopicsPage() {
  return (
    <SettingsPageShell title="Privacy topics" backTo="/settings/privacy-centre">
      <div className="px-4 py-4">
        <p className="text-[#a8a8a8] text-sm mb-4">Learn how MOxE handles your information and how you can control it.</p>
        <div className="space-y-0 border border-[#262626] rounded-xl overflow-hidden">
          {TOPICS.map((t) => (
            <Link
              key={t.id}
              to={`/settings/info/privacy-${t.id}`}
              className="flex items-center justify-between px-4 py-3 border-b border-[#262626] last:border-b-0 text-white active:bg-white/5"
            >
              <span className="font-medium text-sm">{t.title}</span>
              <ChevronRight className="w-5 h-5 text-[#737373]" />
            </Link>
          ))}
        </div>
      </div>
    </SettingsPageShell>
  );
}
