import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BoostLayout } from './BoostLayout';
import { writeBoostDraft } from '../../utils/boostDraft';

export default function BoostBudgetPage() {
  const navigate = useNavigate();
  const [dailyBudget, setDailyBudget] = useState(370);
  const [duration, setDuration] = useState(3);
  const total = dailyBudget * duration;

  return (
    <BoostLayout title="Budget and duration" step={3} onCancel={() => navigate(-1)}>
      <div className="px-4 py-6">
        <h2 className="text-white font-bold text-xl mb-1">What&apos;s your ad budget?</h2>
        <p className="text-[#a8a8a8] text-sm mb-6">Excludes Apple service fee and applicable taxes</p>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white font-medium">Daily budget</span>
            <span className="text-white">₹ {dailyBudget}</span>
          </div>
          <input type="range" min={50} max={1000} value={dailyBudget} onChange={(e) => setDailyBudget(Number(e.target.value))} className="w-full accent-[#0095f6]" />
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white font-medium">Duration</span>
            <span className="text-white">{duration} days</span>
          </div>
          <input type="range" min={1} max={30} value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full accent-[#0095f6]" />
        </div>

        <div className="p-4 rounded-xl bg-[#262626] space-y-2">
          <p className="text-white"><span className="text-[#a8a8a8]">Ad budget:</span> ₹{total} over {duration} days</p>
          <p className="text-[#a8a8a8] text-sm">Reach estimates are not shown until forecasting is connected to your ads account.</p>
          <p className="text-white"><span className="text-[#a8a8a8]">Apple service fee:</span> calculated at purchase when applicable</p>
        </div>

        <button
          type="button"
          onClick={() => {
            writeBoostDraft({ dailyBudget, durationDays: duration });
            navigate('/boost/review');
          }}
          className="w-full py-3 rounded-lg bg-[#0095f6] text-white font-semibold mt-8"
        >
          Next
        </button>
      </div>
    </BoostLayout>
  );
}
