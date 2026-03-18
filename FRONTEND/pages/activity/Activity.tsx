import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ThemedView } from '../../components/ui/Themed';
import { MobileShell } from '../../components/layout/MobileShell';
import { UI } from '../../constants/uiTheme';

function Row({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className={`${UI.listRow} ${UI.bg} border-b border-[#262626]`}>
      <span className="text-white font-medium">{label}</span>
      <ChevronRight className="w-5 h-5 text-[#737373] flex-shrink-0" />
    </Link>
  );
}

export default function Activity() {
  return (
    <ThemedView className={`min-h-screen flex flex-col ${UI.bg}`}>
      <MobileShell>
        <header className={`${UI.header} flex-shrink-0`}>
          <Link to="/settings" className={UI.headerBack} aria-label="Back">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <span className={UI.headerTitle}>Your activity</span>
          <div className="w-14" />
        </header>

        <div className="flex-1 overflow-auto pb-20">
          <section className="py-2">
            <h2 className="text-[#737373] text-xs font-semibold uppercase tracking-wide px-4 py-2">Time & content</h2>
            <Row to="/settings/your-activity/time-management" label="Time management" />
            <Row to="/settings/your-activity/watch-history" label="Watch history" />
            <Row to="/settings/your-activity/account-history" label="Account history" />
            <Row to="/settings/your-activity/recent-searches" label="Recent searches" />
            <Row to="/settings/your-activity/link-history" label="Link history" />
          </section>

          <section className="py-2">
            <h2 className="text-[#737373] text-xs font-semibold uppercase tracking-wide px-4 py-2">Interactions</h2>
            <Row to="/activity/likes" label="Likes" />
            <Row to="/activity/comments" label="Comments" />
            <Row to="/activity/reposts" label="Reposts" />
            <Row to="/activity/tagged" label="Tagged" />
            <Row to="/activity/sticker-responses" label="Sticker responses" />
            <Row to="/activity/profile-visitors" label="Profile visitors" />
            <Row to="/activity/reviews" label="Reviews" />
          </section>

          <section className="py-2">
            <h2 className="text-[#737373] text-xs font-semibold uppercase tracking-wide px-4 py-2">Archives</h2>
            <Row to="/activity/recently-deleted" label="Recently deleted" />
            <Row to="/activity/posts" label="Posts" />
            <Row to="/activity/reels" label="Reels" />
            <Row to="/activity/highlights" label="Highlights" />
          </section>

          <section className="py-2">
            <h2 className="text-[#737373] text-xs font-semibold uppercase tracking-wide px-4 py-2">Preferences</h2>
            <Row to="/activity/not-interested" label="Not interested" />
          </section>
        </div>
      </MobileShell>
    </ThemedView>
  );
}
