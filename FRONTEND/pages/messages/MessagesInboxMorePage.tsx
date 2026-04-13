import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Archive, Inbox, Bookmark, Settings, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { ThemedView, ThemedText } from '../../components/ui/Themed';
import { MobileShell } from '../../components/layout/MobileShell';

const rows: Array<{ to: string; label: string; icon: React.ReactNode; desc: string }> = [
  {
    to: '/messages/requests',
    label: 'Message requests',
    icon: <Inbox className="w-5 h-5 text-[#a8a8a8]" />,
    desc: 'Requests from people you do not follow',
  },
  {
    to: '/messages/saved-replies',
    label: 'Saved replies',
    icon: <Bookmark className="w-5 h-5 text-[#a8a8a8]" />,
    desc: 'Quick replies for business accounts',
  },
  {
    to: '/settings/messages',
    label: 'Message settings',
    icon: <Settings className="w-5 h-5 text-[#a8a8a8]" />,
    desc: 'Read receipts, requests, and more',
  },
];

/**
 * Messages inbox — overflow menu (replaces generic Settings shortcut).
 */
export default function MessagesInboxMorePage() {
  const navigate = useNavigate();

  return (
    <ThemedView className="min-h-screen flex flex-col bg-black pb-20">
      <MobileShell>
        <header className="sticky top-0 z-10 flex items-center h-12 px-3 border-b border-[#262626] bg-black safe-area-pt">
          <button type="button" onClick={() => navigate(-1)} className="p-2 -m-2 text-white" aria-label="Back">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="flex-1 text-center text-white font-semibold text-base">Messages</span>
          <div className="w-10" />
        </header>

        <div className="flex-1 overflow-auto">
          <button
            type="button"
            onClick={() => toast('No archived chats yet.')}
            className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-[#262626] text-left hover:bg-white/5"
          >
            <Archive className="w-5 h-5 text-[#a8a8a8]" />
            <div>
              <div className="text-white text-[15px] font-medium">Archived chats</div>
              <ThemedText secondary className="text-xs">Chats you have moved to archive</ThemedText>
            </div>
          </button>

          {rows.map((r) => (
            <Link
              key={r.to}
              to={r.to}
              className="flex items-center gap-3 px-4 py-3.5 border-b border-[#262626] text-left hover:bg-white/5 active:bg-white/10"
            >
              {r.icon}
              <div className="min-w-0 flex-1">
                <div className="text-white text-[15px] font-medium">{r.label}</div>
                <ThemedText secondary className="text-xs">{r.desc}</ThemedText>
              </div>
            </Link>
          ))}

          <Link
            to="/messages/new"
            className="flex items-center gap-3 px-4 py-3.5 border-b border-[#262626]"
          >
            <UserPlus className="w-5 h-5 text-[#a8a8a8]" />
            <div>
              <div className="text-white text-[15px] font-medium">New message</div>
              <ThemedText secondary className="text-xs">Start a conversation</ThemedText>
            </div>
          </Link>
        </div>
      </MobileShell>
    </ThemedView>
  );
}
