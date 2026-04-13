import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';

const LINKS: { to: string; label: string; description: string }[] = [
  {
    to: '/settings/help/memorialization',
    label: 'Memorialization request',
    description: 'Request a remembering state for someone who has died (admin review).',
  },
  {
    to: '/settings/help/claim-profile',
    label: 'Claim a profile',
    description: 'Request review of an inactive or brand username you have rights to.',
  },
  {
    to: '/settings/help/counter-notification',
    label: 'DMCA counter-notification',
    description: 'Formal counter-notice intake (logged + support ticket).',
  },
  {
    to: '/settings/help/law-enforcement',
    label: 'Law enforcement & legal process',
    description: 'Preservation requests, subpoenas, and related notices.',
  },
  {
    to: '/settings/help/transfer-information',
    label: 'Transfer my information',
    description: 'Assisted portability to another service (request intake).',
  },
];

export default function LegalTrustHubPage() {
  return (
    <SettingsPageShell title="Legal & trust" backTo="/settings/help">
      <p className="text-[#a8a8a8] text-sm px-4 py-3">
        MOxE provides structured intakes for sensitive requests. These are not legal advice; consult counsel
        where appropriate.
      </p>
      <div className="border-t border-[#262626]">
        {LINKS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="flex items-center justify-between px-4 py-3 border-b border-[#262626] text-white active:bg-white/5"
          >
            <div className="flex-1 min-w-0 pr-2">
              <span className="block font-medium text-sm">{item.label}</span>
              <span className="text-[#a8a8a8] text-xs block mt-0.5">{item.description}</span>
            </div>
            <ChevronRight className="w-5 h-5 text-[#737373] flex-shrink-0" />
          </Link>
        ))}
      </div>
    </SettingsPageShell>
  );
}
