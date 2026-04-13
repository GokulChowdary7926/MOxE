import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Flag, Ban, Link2, Music, Info, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { ThemedView, ThemedText } from '../../components/ui/Themed';
import { MobileShell } from '../../components/layout/MobileShell';
import { useCurrentAccount } from '../../hooks/useAccountCapabilities';

type LocationState = { reelId?: string; accountId?: string };

/**
 * Reels — overflow menu: others get report / not interested; own gets copy link + audio info (no report).
 */
export default function ReelMoreActionsPage() {
  const navigate = useNavigate();
  const { state } = useLocation() as { state?: LocationState };
  const reelId = state?.reelId;
  const authorAccountId = state?.accountId;
  const currentAccount = useCurrentAccount() as { id?: string } | null;
  const isOwnReel = Boolean(authorAccountId && currentAccount?.id && authorAccountId === currentAccount.id);

  const copyLink = async () => {
    const url = reelId
      ? `${window.location.origin}/reels?reel=${encodeURIComponent(reelId)}`
      : `${window.location.origin}/reels`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied.');
    } catch {
      toast.error('Could not copy link.');
    }
  };

  const rows: Array<{ icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }> = useMemo(() => {
    const base: Array<{ icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }> = [
      {
        icon: <Link2 className="w-5 h-5" />,
        label: 'Copy link',
        onClick: () => {
          void copyLink();
          navigate(-1);
        },
      },
      {
        icon: <Music className="w-5 h-5" />,
        label: 'About this audio',
        onClick: () => {
          toast('Audio details open in search when available.');
          navigate(-1);
        },
      },
      {
        icon: <Info className="w-5 h-5" />,
        label: 'Why you are seeing this',
        onClick: () => {
          toast('Recommendations use accounts you follow and activity.');
          navigate(-1);
        },
      },
    ];

    if (isOwnReel) {
      return [
        {
          icon: <Trash2 className="w-5 h-5" />,
          label: 'Delete',
          onClick: () => {
            toast('Delete reel when the API hook is wired.');
            navigate(-1);
          },
          danger: true,
        },
        ...base,
      ];
    }

    return [
      {
        icon: <Flag className="w-5 h-5" />,
        label: 'Report',
        onClick: () => {
          toast.success('Thanks — we will review this reel.');
          navigate(-1);
        },
        danger: true,
      },
      {
        icon: <Ban className="w-5 h-5" />,
        label: 'Not interested',
        onClick: () => {
          toast.success('We will show fewer reels like this.');
          navigate(-1);
        },
      },
      ...base,
    ];
  }, [isOwnReel, navigate, reelId]);

  return (
    <ThemedView className="min-h-screen flex flex-col bg-black">
      <MobileShell>
        <header className="flex items-center h-12 px-3 border-b border-[#262626] bg-black safe-area-pt">
          <button type="button" onClick={() => navigate(-1)} className="p-2 -m-2 text-white" aria-label="Back">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="flex-1 text-white font-semibold text-base text-center">More</span>
          <div className="w-10" />
        </header>

        <div className="flex-1 overflow-auto pb-8">
          {reelId && (
            <p className="px-4 py-2 text-[#737373] text-xs">
              Reel <span className="text-[#a8a8a8] font-mono">{reelId}</span>
            </p>
          )}
          <div className="divide-y divide-[#262626]">
            {rows.map((row) => (
              <button
                key={row.label}
                type="button"
                onClick={row.onClick}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-left text-white hover:bg-white/5 active:bg-white/10 ${
                  row.danger ? 'text-red-400' : ''
                }`}
              >
                <span className={row.danger ? 'text-red-400' : 'text-[#a8a8a8]'}>{row.icon}</span>
                <span className="text-[15px] font-medium">{row.label}</span>
              </button>
            ))}
          </div>
          <ThemedText secondary className="px-4 pt-4 text-xs text-center">
            Changes apply to this reel only.
          </ThemedText>
        </div>
      </MobileShell>
    </ThemedView>
  );
}
