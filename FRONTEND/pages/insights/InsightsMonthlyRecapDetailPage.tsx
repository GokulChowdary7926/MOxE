import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';

const MONTH_NAMES: Record<string, string> = {
  'february-2026': 'February',
  'january-2026': 'January',
  'december-2025': 'December',
  'november-2025': 'November',
};

export default function InsightsMonthlyRecapDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const monthName = slug ? MONTH_NAMES[slug] ?? slug : 'February';
  const hasActivity = true; // could come from API

  return (
    <SettingsPageShell title="Monthly recap" backTo="/insights/monthly-recap">
      <div className="px-4 py-6 flex flex-col items-center">
        {hasActivity ? (
          <>
            <div className="w-24 h-24 rounded-full bg-[#262626] flex items-center justify-center mb-4">📖</div>
            <h2 className="text-white font-bold text-xl text-center mb-2">Here&apos;s what happened in {monthName}</h2>
            <div className="w-full space-y-4 mt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-white">3.2K</p>
                <p className="text-[#a8a8a8] text-sm">Reels and post views</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-white">80%</p>
                <p className="text-[#a8a8a8] text-sm">Views from non-followers</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-white">4.9K</p>
                <p className="text-[#a8a8a8] text-sm">Followers</p>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="w-32 h-32 rounded-xl bg-gradient-to-br from-orange-500/20 to-pink-500/20 flex items-center justify-center mb-4">🏖️</div>
            <h2 className="text-white font-bold text-xl text-center mb-2">You haven&apos;t shared any reels or posts lately</h2>
            <p className="text-[#a8a8a8] text-sm text-center mb-6">If you&apos;re looking to grow on MOxE, consistently creating reels, posts or both is the best place to start.</p>
            <div className="w-full p-4 rounded-xl bg-[#262626] mb-4">
              <p className="text-white font-semibold mb-1">Get ready for {monthName}!</p>
              <p className="text-[#a8a8a8] text-sm mb-3">This month brings another opportunity to jump back in, whenever you&apos;re ready. We recommend starting with 1 reel and 1 post a week.</p>
              <Link to="/create" className="text-[#0095f6] font-semibold text-sm">Start creating</Link>
            </div>
          </>
        )}
      </div>
    </SettingsPageShell>
  );
}
