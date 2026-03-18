import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ThemedView } from '../../components/ui/Themed';
import { MobileShell } from '../../components/layout/MobileShell';
import { ChevronLeft, Mic, Image, Send, MessageCircle, RefreshCw } from 'lucide-react';

export default function NearbyMessagingPage() {
  const [message, setMessage] = useState('');

  return (
    <ThemedView className="min-h-screen flex flex-col bg-black">
      <MobileShell>
        <header className="sticky top-0 z-10 flex items-center justify-between h-12 px-3 border-b border-[#262626] bg-black safe-area-pt">
          <Link to="/map" className="flex items-center gap-1 text-white font-medium" aria-label="Back">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <span className="absolute left-1/2 -translate-x-1/2 text-white font-semibold">Nearby Messaging</span>
          <Link to="/map/nearby-messaging/settings" className="text-[#0095f6] text-sm font-medium">Settings</Link>
        </header>

        <div className="flex-1 flex flex-col p-4 pb-24">
          {/* Compose card */}
          <div className="rounded-xl bg-[#262626] border border-[#363636] p-4 mb-4">
            <div className="flex items-center gap-3 mb-3">
              <button type="button" className="flex-1 flex items-center gap-2 p-3 rounded-lg bg-[#363636] text-[#a8a8a8] text-sm">
                <Mic className="w-5 h-5 text-[#a855f7]" />
                <span>Tap and speak to send a nearby message.</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" className="p-2 rounded-lg bg-[#363636] text-[#a855f7]" aria-label="Attach">
                <Image className="w-5 h-5" />
              </button>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2.5 rounded-lg bg-[#363636] border border-[#262626] text-white placeholder:text-[#737373] text-sm"
              />
              <button type="button" className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#a855f7] text-white font-semibold text-sm">
                <Send className="w-4 h-4" />
                Send
              </button>
            </div>
          </div>

          {/* Nearby Messages list */}
          <div className="rounded-xl bg-[#262626] border border-[#363636] overflow-hidden flex-1 min-h-[200px]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#363636]">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-[#a855f7]" />
                <span className="text-white font-semibold">Nearby Messages</span>
              </div>
              <button type="button" className="p-1.5 text-[#a855f7]" aria-label="Refresh">
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="flex items-center gap-2 mb-3 opacity-60">
                <MessageCircle className="w-12 h-12 text-[#737373]" />
                <MessageCircle className="w-10 h-10 text-[#737373] -ml-4" />
              </div>
              <p className="text-white font-bold text-lg mb-1">No nearby messages yet</p>
              <p className="text-[#a8a8a8] text-sm text-center">Send a message to start chatting with people near you.</p>
            </div>
          </div>
        </div>
      </MobileShell>
    </ThemedView>
  );
}
