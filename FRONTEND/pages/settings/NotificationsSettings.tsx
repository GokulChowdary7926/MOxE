import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';

const rows: { to: string; label: string }[] = [
  { to: '/settings/notifications/quiet-mode', label: 'Quiet mode' },
  { to: '/settings/notifications/posts-stories-comments', label: 'Posts, stories and comments' },
  { to: '/settings/notifications/following-followers', label: 'Following and followers' },
  { to: '/settings/notifications/messages', label: 'Messages' },
  { to: '/settings/notifications/calls', label: 'Calls' },
  { to: '/settings/notifications/email', label: 'Email notifications' },
  { to: '/settings/notifications/from-moxe', label: 'From MOxE' },
  { to: '/settings/notifications/live-reels', label: 'Live and reels' },
  { to: '/settings/notifications/birthdays', label: 'Birthdays' },
  { to: '/settings/notifications/fundraisers', label: 'Fundraisers' },
  { to: '/settings/notifications/from-accounts-you-follow', label: 'From accounts you follow' },
  { to: '/settings/notifications/shopping', label: 'Shopping' },
  { to: '/settings/notifications/voting-reminders', label: 'Voting reminders' },
];

export default function NotificationsSettings() {
  return (
    <SettingsPageShell title="Notifications" backTo="/settings">
      <p className="text-[#737373] text-xs font-semibold px-4 pt-4 pb-1">Notification preferences</p>
      <div className="border-t border-[#262626]">
        {rows.map((r) => (
          <Link key={r.to} to={r.to} className="flex items-center justify-between px-4 py-3 border-b border-[#262626] text-white active:bg-white/5">
            <span className="font-medium">{r.label}</span>
            <ChevronRight className="w-5 h-5 text-[#737373]" />
          </Link>
        ))}
      </div>
    </SettingsPageShell>
  );
}
