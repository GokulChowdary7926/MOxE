import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ThemedView } from '../../components/ui/Themed';
import { MobileShell } from '../../components/layout/MobileShell';

const CHANNELS = [
  { key: 'moxe_explore', label: 'MOxE Explore' },
  { key: 'moxe_notify', label: 'Notify MOxE followers' },
];

export default function AlsoShareOnPage() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isPost = pathname.startsWith('/create/post');
  const backPath = isPost ? '/create/post/share' : '/create/reel/share';
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    moxe_explore: false,
    moxe_notify: false,
  });

  const selectedCount = useMemo(
    () => Object.values(enabled).filter(Boolean).length,
    [enabled],
  );

  return (
    <ThemedView className="min-h-screen flex flex-col bg-black">
      <MobileShell>
        <header className="flex items-center h-12 px-3 border-b border-[#262626] bg-black safe-area-pt">
          <button type="button" onClick={() => navigate(-1)} className="p-2 -m-2 text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="flex-1 text-white font-semibold text-base text-center">Also share on</span>
          <div className="w-10" />
        </header>

        <div className="flex-1 overflow-auto pb-24">
          <p className="px-4 py-3 text-[#a8a8a8] text-xs">
            Select extra channels for this {isPost ? 'post' : 'reel'}.
          </p>

          {CHANNELS.map((channel) => {
            const checked = !!enabled[channel.key];
            return (
              <button
                key={channel.key}
                type="button"
                onClick={() =>
                  setEnabled((prev) => ({ ...prev, [channel.key]: !prev[channel.key] }))
                }
                className="w-full flex items-center gap-3 px-4 py-3 border-b border-[#262626] text-white"
              >
                <span className="flex-1 text-left text-sm">{channel.label}</span>
                <span
                  className={`inline-flex h-5 w-5 items-center justify-center rounded border text-[12px] ${
                    checked
                      ? 'bg-[#0095f6] border-[#0095f6] text-white'
                      : 'bg-transparent border-[#4a4a4a] text-transparent'
                  }`}
                >
                  ✓
                </span>
              </button>
            );
          })}
        </div>

        <div className="fixed bottom-0 left-0 right-0 max-w-[428px] mx-auto p-4 border-t border-[#262626] bg-black safe-area-pb">
          <button
            type="button"
            onClick={() => navigate(backPath)}
            className="w-full py-3 rounded-lg bg-[#0095f6] text-white font-semibold text-sm"
          >
            Done {selectedCount > 0 ? `(${selectedCount})` : ''}
          </button>
        </div>
      </MobileShell>
    </ThemedView>
  );
}
