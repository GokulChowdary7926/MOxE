import React from 'react';
import { Link } from 'react-router-dom';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { ChevronRight, Image, Video, GitCompare, TrendingUp, Megaphone } from 'lucide-react';

function AdRow({ icon: Icon, title, subtitle, to, badge }: { icon: React.ElementType; title: string; subtitle: string; to: string; badge?: string }) {
  return (
    <Link to={to} className="flex items-center gap-3 px-4 py-3 border-b border-[#262626] text-white active:bg-white/5">
      <div className="w-12 h-12 rounded-lg bg-[#262626] flex items-center justify-center flex-shrink-0">
        <Icon className="w-6 h-6 text-[#a8a8a8]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium flex items-center gap-2">
          {title}
          {badge && <span className="px-2 py-0.5 rounded-full bg-[#0095f6] text-white text-[10px] font-semibold">{badge}</span>}
        </p>
        <p className="text-[#a8a8a8] text-sm truncate">{subtitle}</p>
      </div>
      <ChevronRight className="w-5 h-5 text-[#737373] flex-shrink-0" />
    </Link>
  );
}

export default function AdToolsPage() {
  return (
    <SettingsPageShell title="Ad tools" backTo="/creator-studio">
      <div className="px-4 py-4">
        <p className="text-[#737373] text-xs font-semibold pb-2">Create your next ad</p>
        <div className="border-t border-[#262626]">
          <AdRow icon={Image} title="Run an ad that won't appear on profile" subtitle="Just upload new photos and videos." to="/ads/create/standalone" badge="NEW" />
          <AdRow icon={Video} title="This reel is getting likes" subtitle="Try boosting it so that even more people can see it." to="/ads/boost/reel" />
          <AdRow icon={GitCompare} title="Compare two posts" subtitle="Choose two posts to boost and see which one performs better as an ad." to="/ads/compare" />
        </div>
        <p className="text-[#737373] text-xs font-semibold pt-6 pb-2">Boost content from profile</p>
        <Link to="/ads/boost" className="flex items-center gap-3 px-0 py-3 border-b border-[#262626] text-white active:bg-white/5">
          <TrendingUp className="w-5 h-5 text-[#a8a8a8]" />
          <span className="flex-1 font-medium">Boost content from profile</span>
          <ChevronRight className="w-5 h-5 text-[#737373]" />
        </Link>
        <p className="text-[#737373] text-xs font-semibold pt-6 pb-2">Manage ads</p>
        <div className="py-4">
          <p className="text-[#a8a8a8] text-sm">You have no ads.</p>
        </div>
      </div>
    </SettingsPageShell>
  );
}
