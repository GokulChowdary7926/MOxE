import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, Sparkles, Home, Settings } from 'lucide-react';
import { ThemedView, ThemedText } from '../components/ui/Themed';
import { MobileShell } from '../components/layout/MobileShell';

/**
 * Standalone "Coming soon" route: `/coming-soon` or `/coming-soon/:feature`.
 * Built with a full layout (not only a centered stub) so the route feels complete.
 *
 * Intentional product surface: linked from `/features/:slug` redirects and any marketing
 * deep links — not from primary bottom tab / home navigation (NBK-004).
 */
export default function ComingSoonPage() {
  const { feature } = useParams<{ feature?: string }>();
  const title = feature ? decodeURIComponent(feature).replace(/-/g, ' ') : 'This feature';
  const displayTitle = title.charAt(0).toUpperCase() + title.slice(1);

  return (
    <ThemedView className="min-h-screen flex flex-col bg-black pb-20">
      <MobileShell>
        <header className="sticky top-0 z-10 flex items-center justify-between h-12 px-3 border-b border-[#262626] bg-black safe-area-pt">
          <Link to="/" className="flex items-center gap-1 text-white font-medium active:opacity-70" aria-label="Back">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <span className="absolute left-1/2 -translate-x-1/2 text-white font-semibold truncate max-w-[55%]">
            {displayTitle}
          </span>
          <div className="w-10" />
        </header>

        <div className="flex-1 flex flex-col px-4 pt-8 pb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#7c3aed] to-[#0095f6] flex items-center justify-center mb-6 mx-auto shadow-lg">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-white font-bold text-2xl text-center mb-2">Coming soon</h1>
          <ThemedText secondary className="text-center text-sm max-w-[320px] mx-auto mb-8">
            {displayTitle} is on MOxE&apos;s roadmap. We&apos;re polishing the experience before release.
          </ThemedText>

          <div className="rounded-2xl border border-[#2f2f2f] bg-[#121212] p-4 mb-6">
            <ThemedText className="text-white text-sm font-semibold mb-2">What you can do now</ThemedText>
            <ul className="text-[#a8a8a8] text-sm space-y-2 list-disc list-inside">
              <li>Explore Home, Reels, and Messages</li>
              <li>Adjust your account settings</li>
              <li>Open any feature from the app and return here via deep link</li>
            </ul>
          </div>

          <div className="mt-auto flex flex-col gap-3">
            <Link
              to="/"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#0095f6] text-white font-semibold text-sm"
            >
              <Home className="w-5 h-5" />
              Back to Home
            </Link>
            <Link
              to="/settings"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#262626] border border-[#363636] text-white font-semibold text-sm"
            >
              <Settings className="w-5 h-5" />
              Settings
            </Link>
          </div>
        </div>
      </MobileShell>
    </ThemedView>
  );
}
