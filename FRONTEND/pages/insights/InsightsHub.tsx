import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { ChevronRight, Eye, Heart, Users, Image, Calendar, Lightbulb, BookOpen, BadgeDollarSign, FileText, Gift, Megaphone } from 'lucide-react';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';

function Row({ to, icon: Icon, label }: { to: string; icon: React.ElementType; label: string }) {
  return (
    <Link to={to} className="flex items-center gap-3 px-4 py-3 border-b border-[#262626] text-white active:bg-white/5">
      <Icon className="w-5 h-5 text-[#a8a8a8] flex-shrink-0" />
      <span className="flex-1 font-medium">{label}</span>
      <ChevronRight className="w-5 h-5 text-[#737373]" />
    </Link>
  );
}

export default function InsightsHub() {
  const currentAccount = useSelector((s: RootState) => s.account.currentAccount) as { accountType?: string } | null;
  const accountType = currentAccount?.accountType ?? 'PERSONAL';
  const isProfessional = ['CREATOR', 'BUSINESS', 'JOB'].includes(accountType ?? '') || accountType === 'PERSONAL'; // Show for all; content can vary

  return (
    <SettingsPageShell title="Insights" backTo="/profile">
      <p className="text-[#a8a8a8] text-sm px-4 py-3">Understand your audience and how your content performs.</p>
      <div className="border-t border-[#262626]">
        <Row to="/insights/content" icon={Eye} label="Content" />
        <Row to="/insights/interaction" icon={Heart} label="Interaction" />
        <Row to="/insights/followers" icon={Users} label="Followers" />
        <Row to="/insights/content-shared" icon={Image} label="Content shared" />
        <Row to="/insights/monthly-recap" icon={Calendar} label="Monthly recap" />
        <Row to="/insights/best-practices" icon={BookOpen} label="Best practices" />
        <Row to="/insights/inspiration" icon={Lightbulb} label="Inspiration" />
        {isProfessional && <Row to="/insights/branded-content" icon={BadgeDollarSign} label="Branded content" />}
        {isProfessional && <Row to="/ads/partnership" icon={Megaphone} label="Partnership ads" />}
        {isProfessional && <Row to="/insights/monetisation-status" icon={Gift} label="Monetisation status" />}
        {isProfessional && <Row to="/insights/community-payments-terms" icon={FileText} label="Community payments terms" />}
      </div>
    </SettingsPageShell>
  );
}
