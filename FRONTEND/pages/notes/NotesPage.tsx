import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { ChevronLeft, Plus } from 'lucide-react';
import { ThemedView } from '../../components/ui/Themed';
import { MobileShell } from '../../components/layout/MobileShell';
import { Avatar } from '../../components/ui/Avatar';

export default function NotesPage() {
  const currentAccount = useSelector((s: RootState) => s.account.currentAccount) as { username?: string; profilePhoto?: string | null } | null;
  const username = currentAccount?.username ?? '';

  return (
    <ThemedView className="min-h-screen flex flex-col bg-black">
      <MobileShell>
        <header className="sticky top-0 z-10 flex items-center justify-between h-12 px-3 border-b border-[#262626] bg-black safe-area-pt">
          <Link to="/messages" className="flex items-center gap-1 text-white font-medium active:opacity-70" aria-label="Back">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <span className="absolute left-1/2 -translate-x-1/2 text-white font-semibold">Notes</span>
          <div className="w-10" />
        </header>
        <div className="flex-1 overflow-auto p-4 pb-20">
          <p className="text-[#a8a8a8] text-sm mb-4">Share short updates with your followers. Notes disappear after 24 hours.</p>
          <div className="flex flex-col items-center py-8">
            <div className="relative w-20 h-20 rounded-full border-2 border-[#262626] bg-[#262626] flex items-center justify-center mb-4 overflow-hidden">
              <Avatar uri={currentAccount?.profilePhoto} size={80} className="w-full h-full" />
              <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-[#0095f6] flex items-center justify-center text-white text-sm border-2 border-black">
                <Plus className="w-3 h-3" />
              </span>
            </div>
            <p className="text-white font-medium">{username}</p>
            <p className="text-[#a8a8a8] text-sm mt-1">Your note</p>
            <Link to="/notes/new" className="mt-6 py-2.5 px-4 rounded-lg bg-[#0095f6] text-white font-semibold text-sm">Create note</Link>
          </div>
        </div>
      </MobileShell>
    </ThemedView>
  );
}
