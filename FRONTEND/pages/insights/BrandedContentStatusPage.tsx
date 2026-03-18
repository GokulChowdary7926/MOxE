import React from 'react';
import { Link } from 'react-router-dom';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { CheckCircle } from 'lucide-react';

export default function BrandedContentStatusPage() {
  return (
    <SettingsPageShell title="Branded content status" backTo="/insights/branded-content">
      <div className="px-4 py-4">
        <div className="rounded-xl bg-[#262626] border border-[#363636] p-4 flex items-center gap-3 mb-4">
          <CheckCircle className="w-8 h-8 text-emerald-500 flex-shrink-0" />
          <div>
            <p className="text-white font-medium">Eligible for branded content</p>
            <p className="text-[#a8a8a8] text-sm">You can post branded content and use the paid partnership label.</p>
          </div>
        </div>
        <Link to="/insights/branded-content/request-approval" className="block w-full py-3 rounded-xl bg-[#0095f6] text-white font-semibold text-sm text-center">
          Request approval for a partnership
        </Link>
      </div>
    </SettingsPageShell>
  );
}
