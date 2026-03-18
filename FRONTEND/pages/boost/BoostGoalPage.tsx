import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BoostLayout } from './BoostLayout';

const GOALS = [
  { id: 'profile', label: 'Visit your profile', desc: 'Best for brand awareness and follows', tag: 'Recommended', handle: '@username' },
  { id: 'website', label: 'Visit your website', desc: 'Best for online sales, bookings and helping people learn more about you' },
  { id: 'message', label: 'Message you', desc: 'Best for building trust with potential customers' },
  { id: 'mix', label: 'A mix of actions', desc: 'Best for multiple goals including engagement, follows and more to help drive overall performance', tag: 'New' },
];

export default function BoostGoalPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <BoostLayout title="Goal" step={1} onCancel={() => navigate(-1)}>
      <div className="px-4 py-6">
        <h2 className="text-white font-bold text-xl mb-6">What do you want people to do when they see your ad?</h2>
        <div className="space-y-2">
          {GOALS.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setSelected(g.id)}
              className="w-full text-left p-4 rounded-xl bg-[#262626] border border-[#363636] active:bg-white/5"
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-medium">{g.label}</span>
                    {g.tag && <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${g.tag === 'Recommended' ? 'bg-[#363636] text-[#a8a8a8]' : 'bg-[#0095f6] text-white'}`}>{g.tag}</span>}
                  </div>
                  <p className="text-[#a8a8a8] text-sm mt-1">{g.desc}</p>
                  {g.handle && <p className="text-[#737373] text-xs mt-1">{g.handle}</p>}
                </div>
                <span className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 ${selected === g.id ? 'border-[#0095f6] bg-[#0095f6]' : 'border-[#363636]'}`}>
                  {selected === g.id && <span className="w-full h-full rounded-full bg-white m-px block scale-50" />}
                </span>
              </div>
            </button>
          ))}
        </div>
        <button type="button" onClick={() => navigate('/boost/audience')} className="w-full py-3 rounded-lg bg-[#0095f6] text-white font-semibold mt-8">Next</button>
      </div>
    </BoostLayout>
  );
}
