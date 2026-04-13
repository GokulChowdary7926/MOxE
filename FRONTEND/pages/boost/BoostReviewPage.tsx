import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BoostLayout } from './BoostLayout';
import { ChevronRight } from 'lucide-react';
import { readBoostDraft } from '../../utils/boostDraft';

export default function BoostReviewPage() {
  const navigate = useNavigate();
  const draft = useMemo(() => readBoostDraft(), []);
  const budgetLine =
    draft.dailyBudget != null && draft.durationDays != null
      ? `₹${draft.dailyBudget * draft.durationDays} over ${draft.durationDays} days`
      : '—';

  return (
    <BoostLayout title="Review" step={4} onCancel={() => navigate(-1)}>
      <div className="px-4 py-6">
        <h2 className="text-white font-bold text-xl mb-6">Everything look good?</h2>

        <div className="space-y-4">
          <div>
            <p className="text-[#737373] text-xs font-semibold mb-1">Goal</p>
            <p className="text-white">{draft.goalLabel ?? '—'}</p>
          </div>
          <div>
            <p className="text-[#737373] text-xs font-semibold mb-1">Audience</p>
            <p className="text-white">{draft.audienceSummary ?? '—'}</p>
          </div>
          <div>
            <p className="text-[#737373] text-xs font-semibold mb-1">Budget and duration</p>
            <p className="text-white">{budgetLine}</p>
          </div>
          <Link to="/boost/preview" className="flex items-center justify-between py-3 border-b border-[#262626] text-white">
            <span className="text-[#737373] font-semibold text-xs">Preview ad</span>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded bg-[#262626]" />
              <ChevronRight className="w-5 h-5 text-[#737373]" />
            </div>
          </Link>
        </div>

        <div className="mt-6 p-4 rounded-xl bg-[#262626] flex items-start gap-3">
          <span className="text-2xl">💳</span>
          <div>
            <p className="text-white font-medium">Payment method</p>
            <p className="text-[#a8a8a8] text-sm">Funds available: ₹0.00</p>
            <p className="text-[#a8a8a8] text-xs mt-2">We&apos;ll deduct funds about once a day when you run ads. Ads are reviewed within 24 hours although, in some cases, it may take longer. Once they&apos;re running, you can pause spending at any time.</p>
          </div>
        </div>

        <Link to="/payouts" className="block w-full py-3 rounded-lg bg-[#0095f6] text-white font-semibold text-center mt-6">Add funds</Link>
        <p className="text-[#737373] text-xs text-center mt-4">By creating ads, you agree to MOxE&apos;s Terms and Advertising Guidelines. Only music that you have the rights to can be used. All ads are listed in the Ad Library.</p>
      </div>
    </BoostLayout>
  );
}
