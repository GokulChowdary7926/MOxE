import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { MessageCircle, Mail, Link2, Copy } from 'lucide-react';

type ContentType = 'post' | 'reel' | 'story' | 'live';

export default function SharePage() {
  const { contentType, id } = useParams<{ contentType?: string; id?: string }>();
  const type = (contentType || 'post') as ContentType;
  const backTo = id ? (type === 'post' ? `/post/${id}` : type === 'reel' ? '/reels' : type === 'story' ? '/stories' : '/live') : '/';

  const options = [
    { icon: MessageCircle, label: 'Share to Message', to: id ? `/share/${type}/${id}/message` : '/messages' },
    { icon: Mail, label: 'Share to...', to: '#' },
    { icon: Link2, label: 'Copy link', to: '#' },
  ];

  return (
    <SettingsPageShell title="Share" backTo={backTo}>
      <div className="px-4 py-4">
        <p className="text-[#a8a8a8] text-sm mb-4">Share this {type}</p>
        <div className="space-y-0 border rounded-xl border-[#262626] overflow-hidden">
          {options.map((opt) => {
            const Icon = opt.icon;
            return (
              <Link key={opt.label} to={opt.to} className="flex items-center gap-3 px-4 py-3 border-b border-[#262626] last:border-b-0 text-white active:bg-white/5">
                <Icon className="w-5 h-5 text-[#a8a8a8]" />
                <span className="flex-1 font-medium">{opt.label}</span>
                <span className="text-[#737373]">›</span>
              </Link>
            );
          })}
        </div>
      </div>
    </SettingsPageShell>
  );
}
