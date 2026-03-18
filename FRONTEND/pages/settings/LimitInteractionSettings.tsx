import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, User, Clock, ChevronRight } from 'lucide-react';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';

export default function LimitInteractionSettings() {
  return (
    <SettingsPageShell title="Limit interactions" backTo="/settings">
      <div className="px-4 py-4">
        <div className="w-24 h-24 mx-auto mb-4 rounded-full border-2 border-dashed border-[#363636] flex items-center justify-center">
          <User className="w-10 h-10 text-[#737373]" />
        </div>
        <h2 className="text-white font-bold text-lg text-center mb-2">Limit interactions from people who are bothering you</h2>
        <p className="text-[#a8a8a8] text-sm text-center mb-6">Temporarily limit people&apos;s ability to interact with you through messages, comments, tagging and more.</p>

        <Link to="/settings/limit-interactions/what" className="flex items-center gap-3 px-4 py-3 border-b border-[#262626] text-white active:bg-white/5">
          <MessageCircle className="w-5 h-5 text-[#a8a8a8] flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium">What will be limited</p>
            <p className="text-[#a8a8a8] text-sm">Most interactions, including comments, messages, story replies, tags and mentions</p>
          </div>
          <ChevronRight className="w-5 h-5 text-[#737373]" />
        </Link>
        <Link to="/settings/limit-interactions/who" className="flex items-center gap-3 px-4 py-3 border-b border-[#262626] text-white active:bg-white/5">
          <User className="w-5 h-5 text-[#a8a8a8] flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium">Who will be limited</p>
            <p className="text-[#a8a8a8] text-sm">Recent followers and accounts that don&apos;t follow you</p>
          </div>
          <ChevronRight className="w-5 h-5 text-[#737373]" />
        </Link>
        <Link to="/settings/limit-interactions/reminder" className="flex items-center gap-3 px-4 py-3 border-b border-[#262626] text-white active:bg-white/5">
          <Clock className="w-5 h-5 text-[#a8a8a8] flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium">When we&apos;ll remind you to turn this off</p>
            <p className="text-[#a8a8a8] text-sm">In 1 week</p>
          </div>
          <ChevronRight className="w-5 h-5 text-[#737373]" />
        </Link>

        <button type="button" className="w-full py-3 rounded-lg bg-[#0095f6] text-white font-semibold mt-6">Turn on</button>
        <p className="text-[#737373] text-xs text-center mt-3">We won&apos;t let people know that you&apos;ve turned this on.</p>
      </div>
    </SettingsPageShell>
  );
}
