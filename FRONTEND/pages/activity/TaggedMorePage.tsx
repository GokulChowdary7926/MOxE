import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { ThemedView, ThemedText } from '../../components/ui/Themed';
import { MobileShell } from '../../components/layout/MobileShell';
import { fetchClientSettings, patchClientSettings } from '../../services/clientSettings';

/**
 * Tagged posts — options (who can tag, approvals, visibility).
 */
export default function TaggedMorePage() {
  const navigate = useNavigate();
  const [approveFirst, setApproveFirst] = useState(true);
  const [showOnProfile, setShowOnProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetchClientSettings()
      .then((settings) => {
        if (cancelled) return;
        const t = settings.tagsAndMentions;
        setApproveFirst(!!t?.manualTagApproval);
        setShowOnProfile(t?.showTaggedOnProfile !== false);
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const disabled = useMemo(() => saving || !loaded, [saving, loaded]);

  const persist = async (next: { manualTagApproval: boolean; showTaggedOnProfile: boolean }) => {
    setSaving(true);
    try {
      const current = await fetchClientSettings();
      await patchClientSettings({
        tagsAndMentions: {
          ...(current.tagsAndMentions ?? {}),
          manualTagApproval: next.manualTagApproval,
          showTaggedOnProfile: next.showTaggedOnProfile,
        },
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ThemedView className="min-h-screen flex flex-col bg-black pb-20">
      <MobileShell>
        <header className="sticky top-0 z-10 flex items-center h-12 px-3 border-b border-[#262626] bg-black safe-area-pt">
          <button type="button" onClick={() => navigate(-1)} className="p-2 -m-2 text-white" aria-label="Back">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <span className="absolute left-1/2 -translate-x-1/2 text-white font-semibold truncate max-w-[60%]">
            Tagged options
          </span>
          <div className="w-10" />
        </header>

        <div className="flex-1 overflow-auto px-4 py-4 space-y-6">
          <ThemedText secondary className="text-sm">
            Control how tags appear on your profile and who can tag you.
          </ThemedText>

          <div className="rounded-xl border border-[#363636] bg-[#121212] overflow-hidden">
            <label className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[#262626]">
              <span className="text-white text-sm">Manually approve tags</span>
              <button
                type="button"
                role="switch"
                aria-checked={approveFirst}
                disabled={disabled}
                onClick={() => {
                  const next = !approveFirst;
                  setApproveFirst(next);
                  void persist({ manualTagApproval: next, showTaggedOnProfile: showOnProfile });
                }}
                className={`w-11 h-6 rounded-full flex-shrink-0 ${approveFirst ? 'bg-[#0095f6]' : 'bg-[#363636]'}`}
              >
                <span
                  className={`block w-5 h-5 rounded-full bg-white mt-0.5 transition-transform ${
                    approveFirst ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </label>
            <label className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="text-white text-sm">Show tagged posts on profile</span>
              <button
                type="button"
                role="switch"
                aria-checked={showOnProfile}
                disabled={disabled}
                onClick={() => {
                  const next = !showOnProfile;
                  setShowOnProfile(next);
                  void persist({ manualTagApproval: approveFirst, showTaggedOnProfile: next });
                }}
                className={`w-11 h-6 rounded-full flex-shrink-0 ${showOnProfile ? 'bg-[#0095f6]' : 'bg-[#363636]'}`}
              >
                <span
                  className={`block w-5 h-5 rounded-full bg-white mt-0.5 transition-transform ${
                    showOnProfile ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </label>
          </div>

          <Link
            to="/settings/tags-mentions"
            className="block w-full py-3 px-4 rounded-xl bg-[#262626] border border-[#363636] text-center text-white text-sm font-semibold"
          >
            Tags and mentions settings
          </Link>
          {!loaded ? (
            <ThemedText secondary className="text-xs">
              Loading settings...
            </ThemedText>
          ) : null}
          {saving ? (
            <ThemedText secondary className="text-xs">
              Saving...
            </ThemedText>
          ) : null}
        </div>
      </MobileShell>
    </ThemedView>
  );
}
