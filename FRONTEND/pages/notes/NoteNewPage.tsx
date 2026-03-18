import React from 'react';
import { Link } from 'react-router-dom';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { MapPin, Music, Share2 } from 'lucide-react';

function Row({ to, icon: Icon, label }: { to: string; icon: React.ElementType; label: string }) {
  return (
    <Link to={to} className="flex items-center gap-3 px-4 py-3 border-b border-[#262626] text-white active:bg-white/5">
      <Icon className="w-5 h-5 text-[#a8a8a8] flex-shrink-0" />
      <span className="flex-1 font-medium">{label}</span>
      <span className="text-[#737373]">›</span>
    </Link>
  );
}

export default function NoteNewPage() {
  return (
    <SettingsPageShell title="New note" backTo="/notes">
      <div className="px-4 py-4">
        <textarea placeholder="Share what's on your mind..." className="w-full min-h-[120px] p-3 rounded-xl bg-[#262626] border border-[#363636] text-white placeholder:text-[#737373] resize-none text-sm" />
        <p className="text-[#737373] text-xs font-semibold px-0 pt-6 pb-2">Options</p>
        <div className="border-t border-[#262626]">
          <Row to="/notes/new/location" icon={MapPin} label="Location" />
          <Row to="/notes/new/song" icon={Music} label="Song selection and edit" />
          <Row to="/notes/new/share" icon={Share2} label="Share with" />
        </div>
      </div>
    </SettingsPageShell>
  );
}
