import React from 'react';
import { Link } from 'react-router-dom';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { Calendar } from 'lucide-react';

const RECAPS = [
  { month: 'February', year: 2026, isNew: true },
  { month: 'January', year: 2026, isNew: true },
  { month: 'December', year: 2025, isNew: true },
  { month: 'November', year: 2025, isNew: true },
];

function RecapRow({ month, year, isNew }: { month: string; year: number; isNew?: boolean }) {
  const slug = `${month.toLowerCase()}-${year}`;
  return (
    <Link to={`/insights/monthly-recap/${slug}`} className="flex items-center gap-3 px-4 py-3 border-b border-[#262626] text-white active:bg-white/5">
      <div className="w-10 h-10 rounded-lg bg-[#262626] flex items-center justify-center flex-shrink-0">
        <Calendar className="w-5 h-5 text-[#a8a8a8]" />
      </div>
      <span className="flex-1 font-medium">{month} {year}</span>
      {isNew && <span className="px-2 py-0.5 rounded-full bg-[#0095f6] text-white text-xs font-semibold">New</span>}
    </Link>
  );
}

export default function InsightsMonthlyRecapPage() {
  const [latest, ...previous] = RECAPS;
  return (
    <SettingsPageShell title="Monthly recap" backTo="/insights">
      <p className="text-[#737373] text-xs font-semibold px-4 pt-4 pb-2">Latest</p>
      <div className="border-t border-[#262626]">
        <RecapRow month={latest.month} year={latest.year} isNew={latest.isNew} />
      </div>
      <p className="text-[#737373] text-xs font-semibold px-4 pt-6 pb-2">Previous</p>
      <div className="border-t border-[#262626]">
        {previous.map((r) => <RecapRow key={`${r.month}-${r.year}`} month={r.month} year={r.year} isNew={r.isNew} />)}
      </div>
    </SettingsPageShell>
  );
}
