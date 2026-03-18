import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';

export default function MessageAndStoryReplySettings() {
  return (
    <SettingsPageShell title="Messages and story replies" backTo="/settings">
      <div className="border-t border-[#262626]">
        <Link to="/settings/messages/message-requests" className="flex items-center justify-between px-4 py-3 border-b border-[#262626] text-white active:bg-white/5">
          <span className="font-medium">Message requests</span>
          <ChevronRight className="w-5 h-5 text-[#737373]" />
        </Link>
        <Link to="/settings/messages/story-replies" className="flex items-center justify-between px-4 py-3 border-b border-[#262626] text-white active:bg-white/5">
          <span className="font-medium">Story replies</span>
          <ChevronRight className="w-5 h-5 text-[#737373]" />
        </Link>
        <Link to="/settings/messages/activity-status" className="flex items-center justify-between px-4 py-3 border-b border-[#262626] text-white active:bg-white/5">
          <span className="font-medium">Show activity status</span>
          <ChevronRight className="w-5 h-5 text-[#737373]" />
        </Link>
        <Link to="/settings/messages/read-receipts" className="flex items-center justify-between px-4 py-3 border-b border-[#262626] text-white active:bg-white/5">
          <span className="font-medium">Show read receipts</span>
          <ChevronRight className="w-5 h-5 text-[#737373]" />
        </Link>
        <Link to="/settings/messages/nudity-protection" className="flex items-center justify-between px-4 py-3 border-b border-[#262626] text-white active:bg-white/5">
          <span className="font-medium">Nudity protection</span>
          <ChevronRight className="w-5 h-5 text-[#737373]" />
        </Link>
        <Link to="/settings/messages/previews" className="flex items-center justify-between px-4 py-3 border-b border-[#262626] text-white active:bg-white/5">
          <span className="font-medium">Previews</span>
          <ChevronRight className="w-5 h-5 text-[#737373]" />
        </Link>
        <Link to="/settings/messages/message-filter" className="flex items-center justify-between px-4 py-3 border-b border-[#262626] text-white active:bg-white/5">
          <span className="font-medium">Message filter</span>
          <ChevronRight className="w-5 h-5 text-[#737373]" />
        </Link>
        <Link to="/messages/saved-replies" className="flex items-center justify-between px-4 py-3 border-b border-[#262626] text-white active:bg-white/5">
          <span className="font-medium">Saved replies</span>
          <ChevronRight className="w-5 h-5 text-[#737373]" />
        </Link>
      </div>
    </SettingsPageShell>
  );
}
