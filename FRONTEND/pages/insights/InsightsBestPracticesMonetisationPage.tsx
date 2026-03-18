import React, { useState } from 'react';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { Camera } from 'lucide-react';

const MONETISATION_TIPS = [
  { title: 'Learn the ways to earn', body: 'As you grow and become eligible for more monetisation tools, there are three main ways to earn: from fans, from brands and from MOxE.' },
  { title: 'Check if you\'re eligible', body: 'Each monetisation tool has eligibility criteria. As you grow your followers and become eligible for tools, the tools will appear in professional dashboard if you have a professional account.' },
  { title: 'Know when it\'s time', body: 'Before you start to monetise, consider which ways to earn might be right for you, what you can realistically commit to and when the timing makes sense for your audience.' },
];

const PARTNERSHIP_ADS_TIPS = [
  { title: 'Highlight the product or brand', body: 'Make sure that the product is clearly visible throughout your content and build trust by showing how you use it.' },
  { title: 'Make the most of messaging', body: 'Share one or two of your favourite features to convey authenticity.' },
  { title: 'Embrace your personal style', body: 'Embrace your aesthetic to connect with and inspire your followers.' },
  { title: 'Keep it authentic', body: 'Your audience values genuine recommendations. Only partner with brands you truly use and believe in.' },
];

export default function InsightsBestPracticesMonetisationPage() {
  const [tab, setTab] = useState<'monetisation' | 'partnership'>('monetisation');
  const tips = tab === 'monetisation' ? MONETISATION_TIPS : PARTNERSHIP_ADS_TIPS;
  const title = tab === 'monetisation' ? 'Monetisation' : 'Partnership ads';
  const desc = tab === 'monetisation' ? 'See what it takes to earn money for your content.' : 'Create engaging ad content that gets results.';

  return (
    <SettingsPageShell title="Best practices" backTo="/insights/best-practices" right={<button type="button" className="p-1 text-white" aria-label="Camera"><Camera className="w-5 h-5" /></button>}>
      <div className="px-4 py-4">
        <div className="flex gap-2 mb-4">
          <button type="button" onClick={() => setTab('monetisation')} className={`px-3 py-1.5 rounded-lg text-sm ${tab === 'monetisation' ? 'bg-white text-black' : 'bg-[#262626] text-white'}`}>Monetisation</button>
          <button type="button" onClick={() => setTab('partnership')} className={`px-3 py-1.5 rounded-lg text-sm ${tab === 'partnership' ? 'bg-white text-black' : 'bg-[#262626] text-white'}`}>Partnership ads</button>
        </div>
        <div className="w-full h-36 rounded-xl bg-[#262626] mb-4 flex items-center justify-center">[Illustration]</div>
        <h2 className="text-white font-bold text-lg mb-1">{title}</h2>
        <p className="text-[#a8a8a8] text-sm mb-6">{desc}</p>
        <div className="space-y-6">
          {tips.map((tip, i) => (
            <div key={i}>
              <p className="text-white font-semibold flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-[#262626] flex items-center justify-center text-sm">{i + 1}</span>{tip.title}</p>
              <p className="text-[#a8a8a8] text-sm mt-1 ml-8">{tip.body}</p>
            </div>
          ))}
        </div>
      </div>
    </SettingsPageShell>
  );
}
