import React, { useEffect, useState } from 'react';
import { SettingsPageShell, SettingsToggleRow } from '../../components/layout/SettingsPageShell';
import { fetchClientSettings, patchClientSettings } from '../../services/clientSettings';

export default function ContactSyncSettings() {
  const [enabled, setEnabled] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchClientSettings()
      .then((s) => {
        if (cancelled) return;
        const c = s.contactSync ?? {};
        setEnabled(!!c.enabled);
        setAcknowledged(!!c.acknowledged);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SettingsPageShell title="Contact syncing" backTo="/settings/following-invitations">
      <p className="text-[#a8a8a8] text-sm px-4 pt-4 pb-2">
        Control whether MOxE can use contact information to suggest people you may know. On the web, enabling this
        records your preference; device-level contact access is managed in your browser or system settings.
      </p>
      {loading ? (
        <p className="text-[#737373] text-sm px-4">Loading…</p>
      ) : (
        <>
          <SettingsToggleRow
            label="Sync contacts"
            checked={enabled}
            onChange={async (v) => {
              setEnabled(v);
              try {
                await patchClientSettings({ contactSync: { enabled: v } });
              } catch {
                setEnabled(!v);
              }
            }}
            description="When on, we may use contacts (where supported) to improve suggestions and invitations."
          />
          <SettingsToggleRow
            label="I understand contacts may be stored securely for this feature"
            checked={acknowledged}
            onChange={async (v) => {
              setAcknowledged(v);
              try {
                await patchClientSettings({ contactSync: { acknowledged: v } });
              } catch {
                setAcknowledged(!v);
              }
            }}
            description="Required to turn on syncing where the product enforces explicit consent."
          />
        </>
      )}
    </SettingsPageShell>
  );
}
