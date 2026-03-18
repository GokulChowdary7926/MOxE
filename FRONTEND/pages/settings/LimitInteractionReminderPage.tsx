import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';

export default function LimitInteractionReminderPage() {
  const [amount, setAmount] = useState(1);
  const [unit, setUnit] = useState<'day' | 'week'>('week');

  return (
    <SettingsPageShell title="Set reminder" backTo="/settings/limit-interactions" right={<Link to="/settings/limit-interactions" className="text-[#0095f6] font-semibold text-sm">Done</Link>}>
      <div className="px-4 py-4">
        <p className="text-[#a8a8a8] text-sm mb-4">We&apos;ll check in to see if you want to turn this tool off, or if you want to add more time.</p>
        <div className="flex gap-4">
          <div className="flex-1">
            <p className="text-[#737373] text-xs mb-1">Duration</p>
            <select
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full px-4 py-3 rounded-lg bg-[#262626] border border-[#363636] text-white text-sm"
            >
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <p className="text-[#737373] text-xs mb-1">Unit</p>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as 'day' | 'week')}
              className="w-full px-4 py-3 rounded-lg bg-[#262626] border border-[#363636] text-white text-sm"
            >
              <option value="day">day</option>
              <option value="week">week</option>
            </select>
          </div>
        </div>
      </div>
    </SettingsPageShell>
  );
}
