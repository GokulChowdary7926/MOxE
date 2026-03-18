import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { Lightbulb } from 'lucide-react';

const CREATION_TIPS = [
  { title: 'Reach more new people with reels', body: 'People often watch reels from accounts that they don\'t follow. Many factors go into growing followers, but accounts with the greatest follower growth rates create 10 or more reels per month.' },
  { title: 'Capture attention with carousels', body: 'Carousels typically get better reach than single photo posts. Try adding text in the first slide to set context and keep people scrolling through.' },
];

const TRIAL_REELS_TIPS = [
  { title: 'Get creative and share it anyway', body: 'Trial reels are only shown to non-followers at first and won\'t appear on your profile unless you choose to share them with everyone. You can take a chance and try something totally new.', cta: 'Create trial reel' },
  { title: 'Use trial reels often to get more reach', body: 'After trying trial reels, 40% of creators started sharing reels more often. Of those who did, 80% saw increased reels reach from non-followers.', cta: 'See details' },
  { title: 'Create content that can stand on its own', body: 'Make sure your reel makes sense without extra context so new viewers can enjoy it.' },
];

export default function InsightsBestPracticesCategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [tab, setTab] = useState<'creation' | 'trial'>('creation');
  const isCreation = slug === 'creation';
  const tips = isCreation ? CREATION_TIPS : TRIAL_REELS_TIPS;
  const showTrialTab = slug === 'creation';

  return (
    <SettingsPageShell title="Best practices" backTo="/insights/best-practices">
      <div className="px-4 py-4">
        {showTrialTab && (
          <div className="flex gap-2 mb-4">
            <button type="button" onClick={() => setTab('creation')} className={`px-3 py-1.5 rounded-lg text-sm ${tab === 'creation' ? 'bg-white text-black' : 'bg-[#262626] text-white'}`}>Creation</button>
            <button type="button" onClick={() => setTab('trial')} className={`px-3 py-1.5 rounded-lg text-sm ${tab === 'trial' ? 'bg-white text-black' : 'bg-[#262626] text-white'}`}>Trial reels</button>
          </div>
        )}
        <h2 className="text-white font-bold text-lg mb-1">{tab === 'creation' ? 'Creation' : 'Trial reels'}</h2>
        <p className="text-[#a8a8a8] text-sm mb-4">{tab === 'creation' ? 'See effective ways to make your content stand out.' : 'Try out new content with non-followers first.'}</p>
        <div className="w-full h-32 rounded-xl bg-[#262626] mb-6 flex items-center justify-center">[Illustration]</div>
        <div className="p-4 rounded-xl bg-[#262626] mb-6 flex gap-3">
          <Lightbulb className="w-5 h-5 text-[#0095f6] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-white font-medium">You haven&apos;t shared any reels or posts lately</p>
            <p className="text-[#a8a8a8] text-sm mt-1">If you&apos;re looking to grow on MOxE, creating content consistently is the best place to start.</p>
            <Link to="/create" className="text-[#0095f6] font-semibold text-sm mt-2 inline-block">Start creating</Link>
          </div>
        </div>
        <div className="space-y-6">
          {(tab === 'trial' ? TRIAL_REELS_TIPS : CREATION_TIPS).map((tip, i) => (
            <div key={i}>
              <p className="text-white font-semibold flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-[#262626] flex items-center justify-center text-sm">{i + 1}</span>{tip.title}</p>
              <p className="text-[#a8a8a8] text-sm mt-1 ml-8">{tip.body}</p>
              {'cta' in tip && typeof (tip as { cta?: string }).cta === 'string' && (
                <Link to="/create" className="text-[#0095f6] text-sm ml-8 mt-1 inline-block">{(tip as { cta: string }).cta}</Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </SettingsPageShell>
  );
}
