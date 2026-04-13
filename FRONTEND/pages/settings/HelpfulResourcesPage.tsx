import React from 'react';
import { Link } from 'react-router-dom';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { UserPlus, MessageCircle, AlertTriangle, Sparkles } from 'lucide-react';

const RESOURCES = [
  { to: '/settings/helpful-resources/follow-creators', icon: UserPlus, label: 'Follow creators' },
  { to: '/settings/helpful-resources/moxe-creators', icon: Sparkles, label: 'MOxE creators' },
  { to: '/settings/comments', icon: MessageCircle, label: 'Manage comments' },
  { to: '/settings/help/report', icon: AlertTriangle, label: 'Report spam or abuse' },
];

export default function HelpfulResourcesPage() {
  return (
    <SettingsPageShell title="Helpful resources" backTo="/settings/help">
      <div className="border-t border-[#262626]">
        {RESOURCES.map(({ to, icon: Icon, label }) => (
          <Link key={to} to={to} className="flex items-center gap-3 px-4 py-3 border-b border-[#262626] text-white active:bg-white/5">
            <Icon className="w-5 h-5 text-[#a8a8a8] flex-shrink-0" />
            <span className="flex-1 font-medium">{label}</span>
            <span className="text-[#737373]">›</span>
          </Link>
        ))}
      </div>
    </SettingsPageShell>
  );
}
