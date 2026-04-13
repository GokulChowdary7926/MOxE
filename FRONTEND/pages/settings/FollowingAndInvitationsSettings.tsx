import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, User, BookUser, Link2, MessageCircle, Share2 } from 'lucide-react';
import { SettingsPageShell, SettingsToggleRow } from '../../components/layout/SettingsPageShell';

export default function FollowingAndInvitationsSettings() {
  const [autoConfirm, setAutoConfirm] = useState(false);

  return (
    <SettingsPageShell title="Following and invitations" backTo="/settings">
      <p className="text-[#737373] text-xs font-semibold px-4 pt-4 pb-2">Following</p>
      <SettingsToggleRow
        label="Automatically confirm anyone that you follow"
        checked={autoConfirm}
        onChange={setAutoConfirm}
        description="Automatically confirm follow requests from people who want to follow you back. This won't apply to creators and businesses."
      />
      <Link to="/settings/following-invitations/contacts" className="flex items-center gap-3 px-4 py-3 border-b border-[#262626] text-white active:bg-white/5">
        <User className="w-5 h-5 text-[#a8a8a8] flex-shrink-0" />
        <span className="font-medium">Follow contacts</span>
        <ChevronRight className="w-5 h-5 text-[#737373] ml-auto" />
      </Link>
      <Link to="/settings/contact-sync" className="flex items-center gap-3 px-4 py-3 border-b border-[#262626] text-white active:bg-white/5">
        <User className="w-5 h-5 text-[#a8a8a8] flex-shrink-0" />
        <span className="font-medium">Contact syncing</span>
        <ChevronRight className="w-5 h-5 text-[#737373] ml-auto" />
      </Link>

      <p className="text-[#737373] text-xs font-semibold px-4 pt-6 pb-2">Invite your friends</p>
      <div className="border-t border-[#262626]">
        {[
          { icon: BookUser, label: 'Contacts', to: '/settings/following-invitations/contacts' },
          { icon: Link2, label: 'Copy invitation link', to: '#' },
          { icon: MessageCircle, label: 'WhatsApp', to: '#' },
          { icon: Share2, label: 'Invite friends via...', to: '#' },
        ].map((item) => {
          const Icon = item.icon;
          return (
          <Link key={item.label} to={item.to} className="flex items-center gap-3 px-4 py-3 border-b border-[#262626] text-white active:bg-white/5">
            <Icon className="w-5 h-5 text-[#a8a8a8] flex-shrink-0" />
            <span className="font-medium">{item.label}</span>
            <ChevronRight className="w-5 h-5 text-[#737373] ml-auto" />
          </Link>
          );
        })}
      </div>
    </SettingsPageShell>
  );
}
