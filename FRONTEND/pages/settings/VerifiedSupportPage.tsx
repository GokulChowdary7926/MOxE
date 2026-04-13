import React from 'react';
import { Link } from 'react-router-dom';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';

/**
 * MOxE verified accounts: in-app entry to help and escalation paths.
 * (Checklist §148 — not third-party “Meta Verified Support”.)
 */
export default function VerifiedSupportPage() {
  return (
    <SettingsPageShell title="Verified support" backTo="/settings">
      <p className="text-[#a8a8a8] text-sm px-4 pt-4">
        Verified accounts get the same in-app Help centre plus dedicated routing labels for certain requests. Use Help for
        guides; for account or impersonation issues, include your username and any case references.
      </p>
      <div className="border-t border-[#262626] mt-4">
        <Link
          to="/settings/help"
          className="flex items-center gap-3 px-4 py-3 border-b border-[#262626] text-white active:bg-white/5"
        >
          <span className="font-medium">Help centre</span>
        </Link>
        <p className="text-[#737373] text-xs px-4 py-3">
          Your organisation can wire a dedicated support inbox in the Help centre; mention that your account is verified when
          you contact us.
        </p>
      </div>
    </SettingsPageShell>
  );
}
