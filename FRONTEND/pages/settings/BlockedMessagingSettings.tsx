import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Ban, MessageSquare } from 'lucide-react';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { getApiBase, getToken } from '../../services/api';

export default function BlockedMessagingSettings() {
  const [grants, setGrants] = useState<{ remainingGrants?: number; remainingDays?: number } | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetch(`${getApiBase()}/premium/blocked-messages/grants`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setGrants(data))
      .catch(() => {});
  }, []);

  return (
    <SettingsPageShell title="Blocked messaging" backTo="/settings">
      <div className="px-4 py-4 space-y-4">
        <p className="text-[#a8a8a8] text-sm">
          When you block someone, they normally can&apos;t message you. You can manage blocked accounts and choose whether to allow message requests from people you&apos;ve blocked.
        </p>
        <div className="border-t border-[#262626]">
          <Link
            to="/blocked"
            className="flex items-center gap-3 px-4 py-3 border-b border-[#262626] text-white active:bg-white/5"
          >
            <Ban className="w-5 h-5 text-[#a8a8a8] flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="font-medium">Blocked accounts</span>
              <span className="text-xs text-[#737373] block">View and unblock people you&apos;ve blocked</span>
            </div>
            <ChevronRight className="w-5 h-5 text-[#737373]" />
          </Link>
          <Link
            to="/settings/messages"
            className="flex items-center gap-3 px-4 py-3 border-b border-[#262626] text-white active:bg-white/5"
          >
            <MessageSquare className="w-5 h-5 text-[#a8a8a8] flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="font-medium">Messages and story replies</span>
              <span className="text-xs text-[#737373] block">Message requests, read receipts, and more</span>
            </div>
            <ChevronRight className="w-5 h-5 text-[#737373]" />
          </Link>
        </div>
        {grants != null && typeof grants.remainingGrants === 'number' && (
          <p className="text-[#a8a8a8] text-xs">
            Message requests from blocked users: {grants.remainingGrants} remaining this period.
          </p>
        )}
      </div>
    </SettingsPageShell>
  );
}
