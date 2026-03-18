import React from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Megaphone, Shield, Settings } from 'lucide-react';
import { ThemedView } from '../../components/ui/Themed';
import { MobileShell } from '../../components/layout/MobileShell';

const PRODUCT_CARDS = [
  {
    icon: MessageCircle,
    title: 'Private messaging',
    description: 'Our messaging products offer end-to-end encryption, so your conversations stay safe and secure.',
  },
  {
    icon: Megaphone,
    title: 'Ads education',
    description: 'We show different factors that contribute to why you saw an ad and give you options to see more ads that you like.',
  },
];

export default function PrivacyCentrePage() {
  return (
    <ThemedView className="min-h-screen flex flex-col bg-black">
      <MobileShell>
        <header className="sticky top-0 z-10 flex items-center justify-between h-12 px-3 border-b border-[#262626] bg-black safe-area-pt">
          <Link to="/settings/help" className="flex items-center gap-1 text-white font-medium active:opacity-70" aria-label="Back">
            <span className="text-xl leading-none">×</span>
          </Link>
          <span className="flex items-center gap-1 text-white font-semibold">
            <span className="text-xl">∞</span> MOxE
          </span>
          <div className="flex items-center gap-3">
            <button type="button" className="text-white p-1" aria-label="Search"><span className="text-lg">⌕</span></button>
            <button type="button" className="text-white p-1" aria-label="Menu">☰</button>
          </div>
        </header>

        <div className="flex-1 overflow-auto pb-20 px-4">
          <h1 className="text-white font-bold text-2xl pt-6 pb-2">Privacy Centre</h1>
          <p className="text-[#a8a8a8] text-sm pb-6">
            Make the privacy choices that are right for you. Learn how to manage and control your privacy on MOxE and other Meta products.
          </p>

          <h2 className="text-white font-semibold text-lg pb-3">We build privacy into our products</h2>
          <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4">
            {PRODUCT_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.title} className="flex-shrink-0 w-[280px] p-4 rounded-xl bg-[#262626] border border-[#363636]">
                  <Icon className="w-8 h-8 text-[#0095f6] mb-2" />
                  <p className="text-white font-semibold">{card.title}</p>
                  <p className="text-[#a8a8a8] text-sm mt-1">{card.description}</p>
                </div>
              );
            })}
          </div>

          <h2 className="text-white font-semibold text-lg pt-4 pb-2">Settings to help control your privacy</h2>
          <p className="text-[#a8a8a8] text-sm pb-4">
            We build easy-to-use settings that you can use to make the privacy choices that are right for you.
          </p>
          <div className="rounded-xl bg-gradient-to-br from-emerald-500/20 to-[#0095f6]/20 p-8 flex flex-col items-center justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-[#262626] flex items-center justify-center mb-4">
              <Settings className="w-10 h-10 text-[#a8a8a8]" />
            </div>
            <Link to="/settings" className="w-full py-3 rounded-lg bg-[#0095f6] text-white font-semibold text-center">
              Review settings
            </Link>
          </div>

          <h2 className="text-white font-semibold text-lg pt-4 pb-2">Privacy topics</h2>
          <p className="text-[#a8a8a8] text-sm pb-4">
            Get answers to your privacy questions and manage your privacy in a way that&apos;s right for you.
          </p>
          <div className="space-y-2">
            <Link to="/settings/privacy-centre/topics" className="block p-4 rounded-xl bg-[#262626] border border-[#363636] text-white font-medium active:bg-white/5">
              Your information and permissions
            </Link>
            <Link to="/settings/privacy-centre/topics" className="block p-4 rounded-xl bg-[#262626] border border-[#363636] text-white font-medium active:bg-white/5">
              Ad preferences
            </Link>
          </div>
        </div>
      </MobileShell>
    </ThemedView>
  );
}
