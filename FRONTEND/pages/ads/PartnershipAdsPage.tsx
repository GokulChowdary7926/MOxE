import React from 'react';
import { Link } from 'react-router-dom';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { ChevronRight, CheckCircle, XCircle, UserCheck } from 'lucide-react';

function Row({ to, icon: Icon, label, state }: { to: string; icon: React.ElementType; label: string; state?: any }) {
  return (
    <Link to={to} state={state} className="flex items-center gap-3 px-4 py-3 border-b border-[#262626] text-white active:bg-white/5">
      <Icon className="w-5 h-5 text-[#a8a8a8] flex-shrink-0" />
      <span className="flex-1 font-medium">{label}</span>
      <ChevronRight className="w-5 h-5 text-[#737373]" />
    </Link>
  );
}

export default function PartnershipAdsPage() {
  return (
    <SettingsPageShell title="Partnership ads" backTo="/insights">
      <p className="text-[#a8a8a8] text-sm px-4 py-3">Create and manage partnership ad content with brands.</p>
      <div className="border-t border-[#262626]">
        <Row to="/ads/partnership/permissions" icon={UserCheck} label="Partnership ad permissions" state={{ backTo: '/ads/partnership' }} />
        <Row to="/ads/partnership/active" icon={CheckCircle} label="Active ads" />
        <Row to="/ads/partnership/inactive" icon={XCircle} label="Inactive ads" />
      </div>
    </SettingsPageShell>
  );
}
