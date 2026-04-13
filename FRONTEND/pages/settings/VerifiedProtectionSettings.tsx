import React, { useEffect, useState } from 'react';
import { SettingsPageShell, SettingsToggleRow } from '../../components/layout/SettingsPageShell';
import { fetchClientSettings, patchClientSettings } from '../../services/clientSettings';

/**
 * MOxE verified-account protection preferences (stored in clientSettings JSON).
 * (Checklist §149 — product-specific, not “Meta” features.)
 */
export default function VerifiedProtectionSettings() {
  const [priorityChannel, setPriorityChannel] = useState(false);
  const [proactiveMonitoring, setProactiveMonitoring] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchClientSettings()
      .then((s) => {
        if (cancelled) return;
        const v = s.verifiedExperience ?? {};
        setPriorityChannel(!!v.prioritySupportChannel);
        setProactiveMonitoring(!!v.proactiveMonitoring);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SettingsPageShell title="Verified protection" backTo="/settings">
      <p className="text-[#a8a8a8] text-sm px-4 pt-4">
        Tune how MOxE highlights verified accounts in support and safety flows. Enforcement still follows your account
        security settings and platform policies.
      </p>
      {loading ? (
        <p className="text-[#737373] text-sm px-4">Loading…</p>
      ) : (
        <>
          <SettingsToggleRow
            label="Priority support routing"
            description="Surface verified context when you contact support from the app."
            checked={priorityChannel}
            onChange={async (v) => {
              setPriorityChannel(v);
              try {
                await patchClientSettings({ verifiedExperience: { prioritySupportChannel: v } });
              } catch {
                setPriorityChannel(!v);
              }
            }}
          />
          <SettingsToggleRow
            label="Proactive monitoring hints"
            description="Allow MOxE to flag unusual login or impersonation patterns to you faster (best-effort)."
            checked={proactiveMonitoring}
            onChange={async (v) => {
              setProactiveMonitoring(v);
              try {
                await patchClientSettings({ verifiedExperience: { proactiveMonitoring: v } });
              } catch {
                setProactiveMonitoring(!v);
              }
            }}
          />
        </>
      )}
    </SettingsPageShell>
  );
}
