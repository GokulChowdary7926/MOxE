import React from 'react';
import { Link } from 'react-router-dom';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { Play, Camera } from 'lucide-react';

const CATEGORIES = [
  { slug: 'creation', title: 'Creation', desc: 'See effective ways to make your content stand out.', count: 14 },
  { slug: 'engagement', title: 'Engagement', desc: 'Find out why interactions matter and how to encourage them.', count: 7 },
  { slug: 'reach', title: 'Reach', desc: 'Get to know the algorithms and how to get more views.', count: 6 },
  { slug: 'monetisation', title: 'Monetisation', desc: 'See what it takes to earn money for your content.', count: 4 },
  { slug: 'guidelines', title: 'Guidelines', desc: 'Learn what to avoid so that you won\'t limit your growth.', count: 5 },
];

export default function InsightsBestPracticesPage() {
  return (
    <SettingsPageShell title="Best practices" backTo="/insights" right={<button type="button" className="p-1 text-white" aria-label="Camera"><Camera className="w-5 h-5" /></button>}>
      <div className="px-4 py-4">
        <h2 className="text-white font-bold text-xl mb-1">Get the most out of MOxE</h2>
        <p className="text-[#a8a8a8] text-sm mb-6">Discover best practices straight from the source to help you create, grow and thrive on MOxE.</p>
        <div className="flex items-center gap-2 mb-4 text-[#a8a8a8] text-sm">
          <Play className="w-4 h-4" />
          <span>14 videos</span>
        </div>
        <div className="space-y-3">
          {CATEGORIES.map((c) => (
            <Link key={c.slug} to={`/insights/best-practices/${c.slug}`} className="flex items-center gap-3 p-4 rounded-xl bg-[#262626] border border-[#363636] active:bg-white/5">
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold">{c.title}</p>
                <p className="text-[#a8a8a8] text-sm mt-0.5">{c.desc}</p>
                <p className="text-[#a8a8a8] text-xs mt-2 flex items-center gap-1"><Play className="w-3 h-3" /> {c.count} videos</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </SettingsPageShell>
  );
}
