import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Sparkles } from 'lucide-react';
import { ThemedView } from './ui/Themed';
import { MobileShell } from './layout/MobileShell';

export interface ComingSoonProps {
  /** Page title shown in header (e.g. feature name) */
  title: string;
  /** Route to navigate when user taps Back. Defaults to /settings */
  backTo?: string;
  /** Optional short description. Defaults to "We're working on this. Check back later." */
  description?: string;
}

export default function ComingSoon({ title, backTo = '/settings', description }: ComingSoonProps) {
  const desc = description ?? "We're working on this. Check back later.";
  return (
    <ThemedView className="min-h-screen flex flex-col bg-black pb-20">
      <MobileShell>
        <header className="sticky top-0 z-10 flex items-center justify-between h-12 px-3 border-b border-[#262626] bg-black safe-area-pt">
          <Link to={backTo} className="flex items-center gap-1 text-white font-medium active:opacity-70" aria-label="Back">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <span className="absolute left-1/2 -translate-x-1/2 text-white font-semibold truncate max-w-[60%]">{title}</span>
          <div className="w-10" />
        </header>
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
          <div className="w-20 h-20 rounded-full bg-[#262626] border border-[#363636] flex items-center justify-center mb-6">
            <Sparkles className="w-10 h-10 text-[#a855f7]" />
          </div>
          <h2 className="text-white font-bold text-xl mb-2">Coming soon</h2>
          <p className="text-[#a8a8a8] text-sm max-w-[280px] mb-8">{desc}</p>
          <Link to={backTo} className="px-6 py-3 rounded-lg bg-[#262626] border border-[#363636] text-white font-semibold text-sm active:opacity-80">
            Go back
          </Link>
        </div>
      </MobileShell>
    </ThemedView>
  );
}
